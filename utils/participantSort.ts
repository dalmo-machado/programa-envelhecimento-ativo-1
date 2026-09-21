import { Participant } from '../types';
import { getDaysSinceLastSession } from './inactivityAlert';

/**
 * Sorting for the researcher's participants table.
 *
 * Kept out of DashboardPage so the comparison rules are stated once, in one
 * place, and can be reasoned about without reading JSX.
 */

export type SortKey =
  | 'study_id'
  | 'name'
  | 'sex'
  | 'age'
  | 'sessions'
  | 'last_session'
  | 'adherence'
  | 'feedback'
  | 'last_assessment'
  | 'height'
  | 'weight'
  | 'dob'
  | 'grip'
  | 'balance'
  | 'bmi';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

/** Sessions in the study protocol — a participant is only eligible for the
 *  final questionnaire after completing all of them. */
const STUDY_SESSIONS = 24;

const lastAssessment = (p: Participant) =>
  p.assessments.length > 0 ? p.assessments[p.assessments.length - 1] : null;

/** Age in whole years today. Same computation the table displays. */
export function ageOf(p: Participant): number | null {
  if (!p.birth_date) return null;
  const birth = new Date(p.birth_date + 'T12:00:00Z');
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getUTCFullYear();
  const m = today.getMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getUTCDate())) age--;
  return age;
}

/**
 * Final-questionnaire state as an ordinal, so the column sorts meaningfully:
 *   2 = answered · 1 = eligible and pending · 0 = not yet eligible
 * Descending therefore brings the answered ones to the top.
 */
function feedbackRank(p: Participant): number {
  if (p.app_feedback) return 2;
  if (p.sessions_completed >= STUDY_SESSIONS) return 1;
  return 0;
}

/**
 * One accessor per column. Returning `null` means "no value" — those rows are
 * always pushed to the bottom, in either direction, so that sorting by grip
 * strength to find the weakest participant does not fill the top of the table
 * with people who have no assessment yet.
 */
const ACCESSORS: Record<SortKey, (p: Participant) => string | number | null> = {
  study_id:        p => p.study_id ?? null,
  name:            p => (p.name || '').trim() || null,
  sex:             p => p.sex ?? null,
  age:             p => ageOf(p),
  sessions:        p => p.sessions_completed ?? 0,
  // Days since the last session. Ascending = most recently active first;
  // participants who never trained have no value and sort last.
  last_session:    p => getDaysSinceLastSession(p),
  adherence:       p => p.sessions_completed ?? 0,   // adherence is a linear function of sessions
  feedback:        p => feedbackRank(p),
  last_assessment: p => { const a = lastAssessment(p); return a ? Date.parse(a.date) || null : null; },
  height:          p => lastAssessment(p)?.data.height_cm ?? null,
  weight:          p => lastAssessment(p)?.data.weight_kg ?? null,
  dob:             p => (p.birth_date ? Date.parse(p.birth_date + 'T12:00:00Z') || null : null),
  grip:            p => lastAssessment(p)?.data.grip_kgf ?? null,
  balance:         p => lastAssessment(p)?.data.balance_s ?? null,
  bmi:             p => lastAssessment(p)?.data.bmi ?? null,
};

/**
 * Returns a new sorted array — never mutates the input, which comes straight
 * from the shared participants context.
 *
 * `locale` matters: Portuguese and Spanish names carry accents, and a plain
 * `<` comparison would place "Ercília" after "Zilda". `numeric: true` also
 * keeps BR-2 before BR-10 when codes are not zero-padded.
 */
export function sortParticipants(
  participants: Participant[],
  sort: SortState | null,
  locale: string,
): Participant[] {
  if (!sort) return participants;

  const get = ACCESSORS[sort.key];
  const factor = sort.dir === 'asc' ? 1 : -1;

  return [...participants].sort((a, b) => {
    const va = get(a);
    const vb = get(b);

    // Missing values sink to the bottom in both directions.
    if (va === null && vb === null) return tieBreak(a, b, locale);
    if (va === null) return 1;
    if (vb === null) return -1;

    let r: number;
    if (typeof va === 'number' && typeof vb === 'number') {
      r = va - vb;
    } else {
      r = String(va).localeCompare(String(vb), locale, {
        numeric: true,
        sensitivity: 'base',
      });
    }

    // Equal values keep a deterministic order instead of whatever the
    // database happened to return. The tiebreak is never inverted.
    return r !== 0 ? r * factor : tieBreak(a, b, locale);
  });
}

function tieBreak(a: Participant, b: Participant, locale: string): number {
  return String(a.study_id ?? '').localeCompare(String(b.study_id ?? ''), locale, {
    numeric: true,
  });
}

/** Click behaviour: a new column starts ascending; the same column flips. */
export function nextSort(current: SortState | null, key: SortKey): SortState {
  if (current && current.key === key) {
    return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  }
  return { key, dir: 'asc' };
}
