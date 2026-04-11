
import { Participant, Language, PersonalizedSession } from '../types';
import { SessionKey } from './trainingData';

// A sample pre-generated plan. In a real scenario, this would be empty
// until the first assessment is completed.
const samplePlan: PersonalizedSession[] = [ 
    { sessionType: 'balance', level: 1 }, { sessionType: 'strength', level: 1 }, { sessionType: 'flexibility', level: 1 }, 
    { sessionType: 'balance', level: 1 }, { sessionType: 'strength', level: 1 }, { sessionType: 'cardio', level: 1 }, 
    { sessionType: 'balance', level: 2 }, { sessionType: 'strength', level: 2 }, { sessionType: 'posture', level: 1 }, 
    { sessionType: 'flexibility', level: 1 }, { sessionType: 'balance', level: 2 }, { sessionType: 'strength', level: 2 }, 
    { sessionType: 'cardio', level: 2 }, { sessionType: 'balance', level: 2 }, { sessionType: 'strength', level: 2 }, 
    { sessionType: 'posture', level: 2 }, { sessionType: 'balance', level: 3 }, { sessionType: 'strength', level: 3 }, 
    { sessionType: 'flexibility', level: 2 }, { sessionType: 'cardio', level: 2 }, { sessionType: 'balance', level: 3 }, 
    { sessionType: 'strength', level: 3 }, { sessionType: 'posture', level: 2 }, { sessionType: 'flexibility', level: 2 }
];

export const newParticipant: Participant = {
  study_id: 'new_user',
  name: 'Novo Participante',
  sex: 'M',
  birth_date: '1950-01-01',
  site: 'Brazil',
  language: Language.PT_BR,
  consent_date: new Date().toISOString(),
  sessions_completed: 0,
  assessments: [],
  training_plan: [],
  incidents: [],
};

export const mockParticipants: Participant[] = [
  {
    study_id: 'BR-001',
    name: 'João Silva',
    sex: 'M',
    birth_date: '1945-05-12',
    site: 'Brazil',
    language: Language.PT_BR,
    consent_date: new Date('2023-10-01').toISOString(),
    sessions_completed: 22,
    assessments: [
        { 
            date: new Date('2023-10-01').toISOString(),
            data: {
                grip_kgf: 25, balance_s: 15, back_scratch_cm: -5, weight_kg: 70, height_cm: 165,
                bmi: 25.7, calf_circum_cm: 35, cc_bmi_index: 1.36, whoqol_total: 75,
            }
        },
        { 
            date: new Date('2023-12-15').toISOString(),
            data: {
                grip_kgf: 28, balance_s: 20, back_scratch_cm: -2, weight_kg: 69, height_cm: 165,
                bmi: 25.3, calf_circum_cm: 36, cc_bmi_index: 1.42, whoqol_total: 82,
            }
        },
    ],
    training_plan: samplePlan,
    incidents: [],
  },
  {
    study_id: 'BR-002',
    name: 'Maria Oliveira',
    sex: 'F',
    birth_date: '1952-08-23',
    site: 'Brazil',
    language: Language.PT_BR,
    consent_date: new Date('2023-10-02').toISOString(),
    sessions_completed: 18,
    assessments: [
        { 
            date: new Date('2023-10-02').toISOString(),
            data: {
                grip_kgf: 20, balance_s: 10, back_scratch_cm: -10, weight_kg: 80, height_cm: 170,
                bmi: 27.7, calf_circum_cm: 33, cc_bmi_index: 1.19, whoqol_total: 68,
            }
        },
    ],
    training_plan: samplePlan,
    incidents: [],
  },
  {
    study_id: 'ES-001',
    name: 'Carlos García',
    sex: 'M',
    birth_date: '1948-11-05',
    site: 'Spain',
    language: Language.ES_ES,
    consent_date: new Date('2023-10-05').toISOString(),
    sessions_completed: 24,
    assessments: [
         { 
            date: new Date('2023-10-05').toISOString(),
            data: {
                grip_kgf: 30, balance_s: 22, back_scratch_cm: 0, weight_kg: 75, height_cm: 175,
                bmi: 24.5, calf_circum_cm: 38, cc_bmi_index: 1.55, whoqol_total: 80,
            }
        },
        { 
            date: new Date('2024-01-10').toISOString(),
            data: {
                grip_kgf: 34, balance_s: 28, back_scratch_cm: 2, weight_kg: 74, height_cm: 175,
                bmi: 24.2, calf_circum_cm: 39, cc_bmi_index: 1.61, whoqol_total: 88,
            }
        },
    ],
    training_plan: samplePlan,
    incidents: [],
  },
];