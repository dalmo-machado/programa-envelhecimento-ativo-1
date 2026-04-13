
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
  // Other
  whoqol_total: number;
}

export interface AssessmentRecord {
  date: string; // ISO string for easier serialization
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

export interface SessionLog {
  session_index: number;
  session_start: string;  // ISO timestamp
  session_end: string;    // ISO timestamp
  duration_min: number;   // rounded to 1 decimal place
  completed: boolean;
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
}