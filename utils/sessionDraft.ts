import { ExerciseRpe } from '../types';

/**
 * A session in progress, kept in the browser so that a reload, a tab the
 * system kills for memory, or a flat battery does not erase it.
 *
 * Reported from Cádiz on 23/10/2026: a session of almost two hours was
 * recorded as ten minutes, because it had to be started again from scratch.
 * The confirmation dialog prevents an accidental exit; this covers the
 * failures nobody can prevent.
 *
 * Deliberately local-only. The completed session still reaches Supabase once,
 * at the end, exactly as before:
 *   - a draft never needs the network, and sessions run in places where there
 *     may not be any;
 *   - session_logs is a study outcome, and partial rows that never complete
 *     would have to be told apart during analysis;
 *   - sessions_completed must not move until the session actually ends.
 */

export type SessionPhase = 'warmup' | 'active' | 'cooldown' | 'incident' | 'post';

export interface SessionDraft {
  study_id: string;
  session_index: number;
  /** The ORIGINAL start. Restoring this is what keeps the duration honest. */
  session_start: string;
  phase: SessionPhase;
  exercise_index: number;
  exercise_rpe: ExerciseRpe[];
  wellness_score: number | null;
  difficulty: 'easy' | 'adequate' | 'hard' | null;
  /** Last write, used to expire the draft. */
  saved_at: string;
}

/**
 * How long a draft stays offerable.
 *
 * Long enough for a real session — the Cádiz one ran nearly two hours, plus
 * interruptions — and short enough that a draft abandoned in the morning is
 * not offered back in the evening. Resuming a stale draft would restore its
 * original session_start and report a duration of many hours, which is a worse
 * error than the one being fixed.
 */
const MAX_DRAFT_AGE_MS = 6 * 60 * 60 * 1000;

const KEY = (studyId: string) => `sessionDraft_${studyId}`;

export function saveDraft(draft: Omit<SessionDraft, 'saved_at'>): void {
  try {
    const payload: SessionDraft = { ...draft, saved_at: new Date().toISOString() };
    localStorage.setItem(KEY(draft.study_id), JSON.stringify(payload));
  } catch {
    // A full or unavailable localStorage must never interrupt a session in
    // progress. Losing the draft is bad; losing the session is worse.
  }
}

/**
 * Returns the draft only when it is safe to offer:
 * same participant, same session, well formed, and still within the age limit.
 * Anything else is discarded rather than shown, so the participant is never
 * asked about a session they cannot meaningfully resume.
 */
export function loadDraft(studyId: string, sessionIndex: number): SessionDraft | null {
  try {
    const raw = localStorage.getItem(KEY(studyId));
    if (!raw) return null;

    const draft = JSON.parse(raw) as SessionDraft;

    if (draft.study_id !== studyId) return discard(studyId);
    if (draft.session_index !== sessionIndex) return null;   // another session's draft — leave it alone
    if (!draft.session_start || !draft.phase) return discard(studyId);

    const age = Date.now() - new Date(draft.saved_at).getTime();
    if (!Number.isFinite(age) || age < 0 || age > MAX_DRAFT_AGE_MS) return discard(studyId);

    return draft;
  } catch {
    return discard(studyId);
  }
}

export function clearDraft(studyId: string): void {
  try {
    localStorage.removeItem(KEY(studyId));
  } catch {
    /* ignore */
  }
}

function discard(studyId: string): null {
  clearDraft(studyId);
  return null;
}
