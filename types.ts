
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
  grip_kgf: number;
  balance_s: number;
  back_scratch_cm: number;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  calf_circum_cm: number;
  cc_bmi_index: number;
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
}