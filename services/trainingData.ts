
import { I18nKeys } from '../localization/es';

type DurationKey = 'duration_reps' | 'duration_reps_sets' | 'duration_seconds' | 'duration_minutes' | 'duration_seconds_per_leg' | 'duration_seconds_per_arm' | 'duration_steps' | 'duration_per_side';

export interface ExerciseDuration {
  key: DurationKey;
  params: Record<string, number>;
}

export interface Exercise {
  nameKey: keyof I18nKeys;
  instructionKey: keyof I18nKeys;
  safetyKey: keyof I18nKeys;
  levels: [ExerciseDuration, ExerciseDuration, ExerciseDuration]; // Levels 1, 2, 3
  illustrationUrl: string;
}

export interface TrainingProgram {
  titleKey: keyof I18nKeys;
  exercises: Exercise[];
}

export type SessionKey = 'strength' | 'balance' | 'flexibility' | 'cardio' | 'posture';

export const trainingPrograms: Record<SessionKey, TrainingProgram> = {
  strength: {
    titleKey: 'session_type_strength',
    exercises: [
      { nameKey: 'exercise_sit_to_stand', instructionKey: 'instruction_sit_to_stand', safetyKey: 'safety_sit_to_stand', levels: [{ key: 'duration_reps_sets', params: { count: 8, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: 'https://i.imgur.com/8l8eA07.png' },
      { nameKey: 'exercise_wall_push_ups', instructionKey: 'instruction_wall_push_ups', safetyKey: 'safety_wall_push_ups', levels: [{ key: 'duration_reps_sets', params: { count: 8, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 3 } }], illustrationUrl: 'https://i.imgur.com/1iHk3bM.png' },
      { nameKey: 'exercise_step_ups', instructionKey: 'instruction_step_ups', safetyKey: 'safety_step_ups', levels: [{ key: 'duration_seconds_per_leg', params: { count: 45 } }, { key: 'duration_seconds_per_leg', params: { count: 60 } }, { key: 'duration_minutes', params: { count: 2 } }], illustrationUrl: 'https://i.imgur.com/gY9zN6T.png' },
      { nameKey: 'exercise_bicep_curls', instructionKey: 'instruction_bicep_curls', safetyKey: 'safety_bicep_curls', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: 'https://i.imgur.com/W2hC3N1.png' },
      { nameKey: 'exercise_lateral_leg_raises', instructionKey: 'instruction_lateral_leg_raises', safetyKey: 'safety_lateral_leg_raises', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 1 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 2 } }], illustrationUrl: 'https://i.imgur.com/B9P35E4.png' },
    ],
  },
  balance: {
    titleKey: 'session_type_balance',
    exercises: [
      { nameKey: 'exercise_heel_raises', instructionKey: 'instruction_heel_raises', safetyKey: 'safety_heel_raises', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 20, sets: 2 } }], illustrationUrl: 'https://i.imgur.com/o2z3X1o.png' },
      { nameKey: 'exercise_single_leg_stance', instructionKey: 'instruction_single_leg_stance', safetyKey: 'safety_single_leg_stance', levels: [{ key: 'duration_seconds_per_leg', params: { count: 15 } }, { key: 'duration_seconds_per_leg', params: { count: 30 } }, { key: 'duration_seconds_per_leg', params: { count: 45 } }], illustrationUrl: 'https://i.imgur.com/CugC24J.png' },
      { nameKey: 'exercise_tandem_stance', instructionKey: 'instruction_tandem_stance', safetyKey: 'safety_tandem_stance', levels: [{ key: 'duration_seconds_per_leg', params: { count: 20 } }, { key: 'duration_seconds_per_leg', params: { count: 30 } }, { key: 'duration_seconds_per_leg', params: { count: 45 } }], illustrationUrl: 'https://i.imgur.com/6Jj6A4s.png' },
      { nameKey: 'exercise_heel_to_toe_walk', instructionKey: 'instruction_heel_to_toe_walk', safetyKey: 'safety_heel_to_toe_walk', levels: [{ key: 'duration_steps', params: { count: 10 } }, { key: 'duration_steps', params: { count: 15 } }, { key: 'duration_steps', params: { count: 20 } }], illustrationUrl: 'https://i.imgur.com/dZ1kF6x.png' },
    ],
  },
  flexibility: {
    titleKey: 'session_type_flexibility',
    exercises: [
      { nameKey: 'exercise_arm_circles', instructionKey: 'instruction_arm_circles', safetyKey: 'safety_arm_circles', levels: [{ key: 'duration_seconds', params: { count: 45 } }, { key: 'duration_minutes', params: { count: 1 } }, { key: 'duration_minutes', params: { count: 1.5 } }], illustrationUrl: 'https://i.imgur.com/pY8kF3q.png' },
      { nameKey: 'exercise_hamstring_stretch', instructionKey: 'instruction_hamstring_stretch', safetyKey: 'safety_hamstring_stretch', levels: [{ key: 'duration_seconds_per_leg', params: { count: 20 } }, { key: 'duration_seconds_per_leg', params: { count: 30 } }, { key: 'duration_seconds_per_leg', params: { count: 45 } }], illustrationUrl: 'https://i.imgur.com/tHqgL1g.png' },
      { nameKey: 'exercise_calf_stretch', instructionKey: 'instruction_calf_stretch', safetyKey: 'safety_calf_stretch', levels: [{ key: 'duration_seconds_per_leg', params: { count: 20 } }, { key: 'duration_seconds_per_leg', params: { count: 30 } }, { key: 'duration_seconds_per_leg', params: { count: 45 } }], illustrationUrl: 'https://i.imgur.com/9xX6B1n.png' },
      { nameKey: 'exercise_shoulder_stretch', instructionKey: 'instruction_shoulder_stretch', safetyKey: 'safety_shoulder_stretch', levels: [{ key: 'duration_seconds_per_arm', params: { count: 20 } }, { key: 'duration_seconds_per_arm', params: { count: 30 } }, { key: 'duration_seconds_per_arm', params: { count: 45 } }], illustrationUrl: 'https://i.imgur.com/rQ0jA1g.png' },
      { nameKey: 'exercise_chest_stretch', instructionKey: 'instruction_chest_stretch', safetyKey: 'safety_chest_stretch', levels: [{ key: 'duration_seconds', params: { count: 20 } }, { key: 'duration_seconds', params: { count: 30 } }, { key: 'duration_seconds', params: { count: 45 } }], illustrationUrl: 'https://i.imgur.com/fL3sK4D.png' },
    ],
  },
  cardio: {
    titleKey: 'session_type_cardio',
    exercises: [
      { nameKey: 'exercise_brisk_walking', instructionKey: 'instruction_brisk_walking', safetyKey: 'safety_brisk_walking', levels: [{ key: 'duration_minutes', params: { count: 3 } }, { key: 'duration_minutes', params: { count: 5 } }, { key: 'duration_minutes', params: { count: 7 } }], illustrationUrl: 'https://i.imgur.com/8zJ3V1p.png' },
      { nameKey: 'exercise_marching_in_place', instructionKey: 'instruction_marching_in_place', safetyKey: 'safety_marching_in_place', levels: [{ key: 'duration_minutes', params: { count: 2 } }, { key: 'duration_minutes', params: { count: 3 } }, { key: 'duration_minutes', params: { count: 4 } }], illustrationUrl: 'https://i.imgur.com/8zJ3V1p.png' },
      { nameKey: 'exercise_knee_highs', instructionKey: 'instruction_knee_highs', safetyKey: 'safety_knee_highs', levels: [{ key: 'duration_minutes', params: { count: 1 } }, { key: 'duration_minutes', params: { count: 2 } }, { key: 'duration_minutes', params: { count: 3 } }], illustrationUrl: 'https://i.imgur.com/jG5eX3e.png' },
      { nameKey: 'exercise_seated_rowing', instructionKey: 'instruction_seated_rowing', safetyKey: 'safety_seated_rowing', levels: [{ key: 'duration_minutes', params: { count: 2 } }, { key: 'duration_minutes', params: { count: 3 } }, { key: 'duration_minutes', params: { count: 4 } }], illustrationUrl: 'https://i.imgur.com/s6wY7Tf.png' },
    ],
  },
  posture: {
    titleKey: 'session_type_posture',
    exercises: [
      { nameKey: 'exercise_wall_push_ups', instructionKey: 'instruction_wall_push_ups', safetyKey: 'safety_wall_push_ups', levels: [{ key: 'duration_reps_sets', params: { count: 8, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 3 } }], illustrationUrl: 'https://i.imgur.com/1iHk3bM.png' },
      { nameKey: 'exercise_cat_cow_stretch', instructionKey: 'instruction_cat_cow_stretch', safetyKey: 'safety_cat_cow_stretch', levels: [{ key: 'duration_reps', params: { count: 10 } }, { key: 'duration_reps', params: { count: 12 } }, { key: 'duration_reps', params: { count: 15 } }], illustrationUrl: 'https://i.imgur.com/y3B4E3w.png' },
      { nameKey: 'exercise_bird_dog', instructionKey: 'instruction_bird_dog', safetyKey: 'safety_bird_dog', levels: [{ key: 'duration_per_side', params: { count: 6 } }, { key: 'duration_per_side', params: { count: 8 } }, { key: 'duration_per_side', params: { count: 10 } }], illustrationUrl: 'https://i.imgur.com/a9oP1kQ.png' },
      { nameKey: 'exercise_pelvic_tilt', instructionKey: 'instruction_pelvic_tilt', safetyKey: 'safety_pelvic_tilt', levels: [{ key: 'duration_reps', params: { count: 12 } }, { key: 'duration_reps', params: { count: 15 } }, { key: 'duration_reps', params: { count: 20 } }], illustrationUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800' },
      { nameKey: 'exercise_chest_stretch', instructionKey: 'instruction_chest_stretch', safetyKey: 'safety_chest_stretch', levels: [{ key: 'duration_seconds', params: { count: 20 } }, { key: 'duration_seconds', params: { count: 30 } }, { key: 'duration_seconds', params: { count: 45 } }], illustrationUrl: 'https://i.imgur.com/fL3sK4D.png' },
    ],
  },
};