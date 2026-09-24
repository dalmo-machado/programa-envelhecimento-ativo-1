
import { SessionKey } from './services/trainingData';

export enum Language {
  PT_BR = 'pt-BR',
  ES_ES = 'es-ES',
}

export enum UserRole {
  NONE = 'none',
  PARTICIPANT = 'participant',
  RESEARCHER = 'researcher',
  ADMIN = 'admin',
}

export interface Assessment {
  // Station 1 — Body Composition
  weight_kg: number;
  height_cm: number;
  bmi: number;
  calf_circum_cm: number;
  cc_bmi_index: number;
  cintura_cm?: number;
  quadril_cm?: number;
  gordura_percent?: number;
  rcq?: number;
  // Station 2 — Force and Agility
  grip_kgf: number;
  balance_s: number;
  back_scratch_cm: number;
  handgrip_nondominant_kgf?: number;
  chair_stand_reps?: number;
  arm_curl_reps?: number;
  chair_sit_reach_cm?: number;
  up_and_go_seconds?: number;
  // Station 3 — Aerobic Capacity
  six_min_walk_meters?: number;
  six_min_walk_predicted?: number;
  six_min_walk_percent?: number;
}

/**
 * Which measurement point an assessment belongs to. Without it, a participant
 * with several assessments cannot be paired pre/post — the date alone is not
 * enough, since the study has a third measurement beyond the 24-session post.
 */
export type AssessmentMoment = 'PRE' | 'POS' | 'SEG';

export interface AssessmentRecord {
  date: string; // ISO string for easier serialization
  moment?: AssessmentMoment | null;
  data: Assessment;
}

export interface PersonalizedSession {
  sessionType: SessionKey;
  level: 1 | 2 | 3;
}

export interface IncidentReport {
  id: string;
  session_index: number;
  reported_date: string; // ISO string
  reviewed: boolean;
  occurrence_description?: string;
  action_taken?: string;
}

export interface ExerciseRpe {
  exercise_index: number;  // position in the session's exercise list
  rpe: 1 | 2 | 3;         // 1=Leve (≤4/10), 2=Moderado (5–6/10), 3=Intenso (≥7/10)
}

export interface SessionLog {
  session_index: number;
  session_start: string;  // ISO timestamp
  session_end: string;    // ISO timestamp
  duration_min: number;   // rounded to 1 decimal place
  completed: boolean;
  wellness_score?: number | null;   // 1–5 emoji scale (added with wellness feature)
  exercise_rpe?: ExerciseRpe[];     // per-exercise RPE (Asier Phase 1)
}

/**
 * Final app-usability questionnaire submitted after session 24.
 * All Likert scores are 1–5 (positive framing throughout).
 *   sus_scores[0..9]        — Q1–Q10  (SUS adapted, all positive)
 *   improvement_scores[0..5]— Q11–Q16 (perceived physical improvement)
 *   experience_scores[0..5] — Q17–Q22 (program & app experience)
 */
export interface AppFeedback {
  submitted_at: string;           // ISO timestamp
  sus_scores: number[];           // length 10, values 1–5
  improvement_scores: number[];   // length 6,  values 1–5
  experience_scores: number[];    // length 6,  values 1–5
  open_best: string;              // free text — what participant liked most
  open_improve: string;           // free text — suggestions
}

/**
 * Record of the researcher's endorsement of the training level and load before
 * the plan is generated. The app computes a suggestion from the SFT results;
 * this is the evidence that a professional reviewed it and took responsibility
 * for the prescription — either accepting the suggestion or changing it.
 */
export interface PlanAuthorization {
  authorized_at: string;          // ISO timestamp
  authorized_by: string;          // researcher access code, or role when unknown
  computed_level: 1 | 2 | 3;      // what the algorithm suggested
  applied_level: 1 | 2 | 3;       // what was actually prescribed
  adjusted: boolean;              // applied !== computed
}

/**
 * The PAR-Q as it was actually applied to this participant.
 *
 * The screening decides whether someone may enrol, so the parecer requires the
 * answers themselves to be on record — not merely the fact that a screen took
 * place. Everything needed to reconstruct the decision is stored together:
 * the answers, when they were given, and the outcome that followed from them.
 */
export interface ParqRecord {
  /** Which form was applied. Designation to be confirmed with the team. */
  version: string;
  answered_at: string;                       // ISO timestamp
  /** Keyed by the question id ('screening_q1' … 'screening_q5'). */
  answers: Record<string, 'yes' | 'no'>;
  /** Count of risk flags. Stored so the outcome can be audited without
   *  re-deriving it from a threshold that may change later. */
  yes_count: number;
  /** 'cleared' = proceeded to enrolment · 'referred' = sent to a professional. */
  outcome: 'cleared' | 'referred';
  /** The threshold in force when this screening ran. */
  threshold: number;
}

export interface Participant {
  study_id: string;
  name: string;
  sex: 'M' | 'F' | 'Other';
  birth_date: string; // ISO string (YYYY-MM-DD)
  site: 'Brazil' | 'Spain';
  language: Language;
  consent_date: string; // ISO string
  assessments: AssessmentRecord[];
  sessions_completed: number;
  training_plan: PersonalizedSession[];
  incidents: IncidentReport[];
  session_logs?: SessionLog[];
  app_feedback?: AppFeedback | null;
  plan_authorization?: PlanAuthorization | null;
  /** Null for participants enrolled before the PAR-Q started being recorded. */
  parq?: ParqRecord | null;
}