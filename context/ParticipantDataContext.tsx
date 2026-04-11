
import React, { createContext, useState, useContext, useMemo, useEffect, useRef, ReactNode } from 'react';
import { Participant, PersonalizedSession } from '../types';
import { mockParticipants } from '../services/mockData';
import * as supa from '../services/supabaseService';

// ─────────────────────────────────────────────
//  Training-plan localStorage helpers
//  (training_plan is not stored in Supabase)
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

/** Merge training_plan (from localStorage) into a participant array coming from Supabase. */
function mergeTrainingPlans(participants: Participant[]): Participant[] {
  return participants.map(p => ({
    ...p,
    training_plan: loadTrainingPlan(p.study_id).length > 0
      ? loadTrainingPlan(p.study_id)
      : p.training_plan,
  }));
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

  // Tracks whether Supabase loaded successfully
  const supabaseReady = useRef(false);

  // ── On mount: load from Supabase, fall back to localStorage ──────────────
  useEffect(() => {
    // Migrate legacy training-plan data before switching storage strategy
    extractLegacyTrainingPlans();

    supa.loadAllParticipants()
      .then(async (data) => {
        if (data.length === 0) {
          // First run: seed DB with mock participants
          console.info('[Supabase] DB is empty. Migrating mock data...');
          await supa.migrateParticipants(mockParticipants);
          // After migration persist training plans for mock participants
          mockParticipants.forEach(p => {
            if (p.training_plan?.length > 0) saveTrainingPlan(p.study_id, p.training_plan);
          });
          data = mockParticipants.map(p => ({ ...p, training_plan: [] }));
        }

        // Restore training_plan from localStorage for each participant
        const merged = mergeTrainingPlans(data);
        setParticipants(merged);
        localStorage.setItem('participantsData', JSON.stringify(merged));
        supabaseReady.current = true;
        console.info('[Supabase] Loaded', merged.length, 'participant(s).');
      })
      .catch(err => {
        console.warn('[Supabase] Load failed — using localStorage fallback.', err);
        // State already has localStorage data from useState initializer; nothing to do.
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
    () => ({ participants, updateParticipant, addParticipant }),
    [participants],
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
