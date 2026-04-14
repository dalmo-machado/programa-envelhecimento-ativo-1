
import React, { createContext, useState, useContext, useMemo, useEffect, useRef, ReactNode } from 'react';
import { Participant, PersonalizedSession } from '../types';
import { mockParticipants } from '../services/mockData';
import * as supa from '../services/supabaseService';
import { generateTrainingPlan } from '../services/trainingPlanner';

// ─────────────────────────────────────────────
//  Training-plan localStorage helpers
//  (also stored in Supabase; localStorage used as cache / offline fallback)
// ─────────────────────────────────────────────

const TP_KEY = (id: string) => `trainingPlan_${id}`;

function saveTrainingPlan(participantId: string, plan: PersonalizedSession[]) {
  localStorage.setItem(TP_KEY(participantId), JSON.stringify(plan));
}

function loadTrainingPlan(participantId: string): PersonalizedSession[] {
  try {
    const raw = localStorage.getItem(TP_KEY(participantId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

/**
 * Merge localStorage data into a Supabase-loaded participant array.
 * - sessions_completed: take MAX to prevent regression from the race condition
 *   where updates made before supabaseReady was set were never synced.
 * - training_plan: prefer Supabase (now authoritative); fall back to the
 *   per-participant localStorage key for browsers that haven't synced yet.
 */
function mergeLocalData(supabaseParticipants: Participant[]): Participant[] {
  type LocalSnapshot = { sessions_completed: number; session_logs: Participant['session_logs'] };
  let localMap = new Map<string, LocalSnapshot>();
  try {
    const raw = localStorage.getItem('participantsData');
    if (raw) {
      const localData: Participant[] = JSON.parse(raw);
      localData.forEach(p => localMap.set(p.study_id, {
        sessions_completed: p.sessions_completed ?? 0,
        session_logs: p.session_logs ?? [],
      }));
    }
  } catch { /* ignore */ }

  return supabaseParticipants.map(p => {
    const local = localMap.get(p.study_id);
    const localSessions = local?.sessions_completed ?? 0;
    const localLogs = local?.session_logs ?? [];
    const supabaseLogs = p.session_logs ?? [];
    const localPlan = loadTrainingPlan(p.study_id);
    const effectivePlan = (p.training_plan ?? []).length > 0 ? p.training_plan : localPlan;
    return {
      ...p,
      sessions_completed: Math.max(p.sessions_completed, localSessions),
      training_plan: effectivePlan,
      // Take whichever source has more log entries to prevent race-condition regression
      session_logs: supabaseLogs.length >= localLogs.length ? supabaseLogs : localLogs,
    };
  });
}

/** One-time extraction: pull training plans from the old monolithic localStorage blob. */
function extractLegacyTrainingPlans() {
  try {
    const raw = localStorage.getItem('participantsData');
    if (!raw) return;
    const legacy: Participant[] = JSON.parse(raw);
    legacy.forEach(p => {
      if (p.training_plan?.length > 0 && !localStorage.getItem(TP_KEY(p.study_id))) {
        saveTrainingPlan(p.study_id, p.training_plan);
      }
    });
  } catch { /* ignore */ }
}

// ─────────────────────────────────────────────
//  Context
// ─────────────────────────────────────────────

interface ParticipantDataContextType {
  participants: Participant[];
  /** True while the initial Supabase fetch is in flight. Login should wait for this to be false. */
  isLoading: boolean;
  /** True if the initial Supabase fetch failed and data is localStorage/mock only. */
  supabaseLoadFailed: boolean;
  updateParticipant: (participantId: string, updatedData: Partial<Participant>) => void;
  addParticipant: (participant: Participant) => void;
}

const ParticipantDataContext = createContext<ParticipantDataContextType | undefined>(undefined);

export const ParticipantDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Synchronous initial state from localStorage (instant UI, no flicker)
  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      const raw = localStorage.getItem('participantsData');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return mockParticipants;
  });

  // True while the initial Supabase fetch is in flight
  const [isLoading, setIsLoading] = useState(true);
  // True if Supabase fetch failed; participants may be incomplete
  const [supabaseLoadFailed, setSupabaseLoadFailed] = useState(false);

  // Tracks whether Supabase loaded successfully
  const supabaseReady = useRef(false);

  // ── On mount: load from Supabase, fall back to localStorage ──────────────
  useEffect(() => {
    // Migrate legacy training-plan data before switching storage strategy
    extractLegacyTrainingPlans();

    supa.loadAllParticipants()
      .then(async (data) => {
        // Incremental migration: insert any mock participant not yet in the DB
        const existingIds = new Set(data.map(p => p.study_id));
        const missing = mockParticipants.filter(p => !existingIds.has(p.study_id));
        if (missing.length > 0) {
          console.info('[Supabase] Migrating missing mock participants:', missing.map(p => p.study_id));
          await supa.migrateParticipants(missing);
          missing.forEach(p => {
            if (p.training_plan?.length > 0) saveTrainingPlan(p.study_id, p.training_plan);
          });
          // Merge newly migrated participants into the loaded list
          data = [...data, ...missing.map(p => ({ ...p, training_plan: [] }))];
        }

        // Merge sessions_completed (MAX) and training_plan (Supabase > localStorage)
        const merged = mergeLocalData(data);

        // Safety fallback: regenerate training plan for participants who have
        // assessments but no plan (e.g., plan was saved only on researcher's browser).
        const withPlans = merged.map(p => {
          if ((p.training_plan ?? []).length === 0 && p.assessments.length > 0) {
            const plan = generateTrainingPlan(p.assessments[0].data);
            saveTrainingPlan(p.study_id, plan);
            // Sync the regenerated plan to Supabase so all devices benefit.
            supa.syncUpdate(p.study_id, p, { training_plan: plan }).catch(err =>
              console.warn('[Supabase] auto-regenerate training_plan sync failed:', err),
            );
            return { ...p, training_plan: plan };
          }
          return p;
        });

        setParticipants(withPlans);
        localStorage.setItem('participantsData', JSON.stringify(withPlans));
        supabaseReady.current = true;
        setIsLoading(false);
        console.info('[Supabase] Loaded', withPlans.length, 'participant(s).');
      })
      .catch(err => {
        console.warn('[Supabase] Load failed — using localStorage fallback.', err);
        // State already has localStorage data from useState initializer; nothing to do.
        setSupabaseLoadFailed(true);
        setIsLoading(false);
      });
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updateParticipant = (participantId: string, updatedData: Partial<Participant>) => {
    setParticipants(prev => {
      const oldParticipant = prev.find(p => p.study_id === participantId);
      if (!oldParticipant) return prev;

      const newParticipants = prev.map(p =>
        p.study_id === participantId ? { ...p, ...updatedData } : p,
      );

      // Always persist to localStorage (fallback)
      localStorage.setItem('participantsData', JSON.stringify(newParticipants));

      // training_plan → localStorage only
      if (updatedData.training_plan) {
        saveTrainingPlan(participantId, updatedData.training_plan);
      }

      // Supabase async sync (fire-and-forget)
      if (supabaseReady.current) {
        supa.syncUpdate(participantId, oldParticipant, updatedData).catch(err =>
          console.warn('[Supabase] updateParticipant failed:', err),
        );
      }

      return newParticipants;
    });
  };

  const addParticipant = (participant: Participant) => {
    setParticipants(prev => {
      let newParticipants: Participant[];
      if (prev.find(p => p.study_id === participant.study_id)) {
        newParticipants = prev.map(p =>
          p.study_id === participant.study_id ? participant : p,
        );
      } else {
        newParticipants = [...prev, participant];
      }

      // Always persist to localStorage
      localStorage.setItem('participantsData', JSON.stringify(newParticipants));

      // training_plan → localStorage only
      if (participant.training_plan?.length > 0) {
        saveTrainingPlan(participant.study_id, participant.training_plan);
      }

      // Supabase async sync
      if (supabaseReady.current) {
        supa.syncAddParticipant(participant).catch(err =>
          console.warn('[Supabase] addParticipant failed:', err),
        );
      }

      return newParticipants;
    });
  };

  const value = useMemo(
    () => ({ participants, isLoading, supabaseLoadFailed, updateParticipant, addParticipant }),
    [participants, isLoading, supabaseLoadFailed],
  );

  return (
    <ParticipantDataContext.Provider value={value}>
      {children}
    </ParticipantDataContext.Provider>
  );
};

export const useParticipantData = (): ParticipantDataContextType => {
  const context = useContext(ParticipantDataContext);
  if (!context) {
    throw new Error('useParticipantData must be used within a ParticipantDataProvider');
  }
  return context;
};
