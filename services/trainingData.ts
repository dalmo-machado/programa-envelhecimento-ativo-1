
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
      { nameKey: 'exercise_sit_to_stand', instructionKey: 'instruction_sit_to_stand', safetyKey: 'safety_sit_to_stand', levels: [{ key: 'duration_reps_sets', params: { count: 8, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: '/images/sit_to_stand.png' },
      { nameKey: 'exercise_wall_push_ups', instructionKey: 'instruction_wall_push_ups', safetyKey: 'safety_wall_push_ups', levels: [{ key: 'duration_reps_sets', params: { count: 8, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 3 } }], illustrationUrl: '/images/wall_push_ups.png' },
      { nameKey: 'exercise_step_ups', instructionKey: 'instruction_step_ups', safetyKey: 'safety_step_ups', levels: [{ key: 'duration_seconds_per_leg', params: { count: 45 } }, { key: 'duration_seconds_per_leg', params: { count: 60 } }, { key: 'duration_minutes', params: { count: 2 } }], illustrationUrl: '/images/step_ups.png' },
      { nameKey: 'exercise_bicep_curls', instructionKey: 'instruction_bicep_curls', safetyKey: 'safety_bicep_curls', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: '/images/bicep_curls.png' },
      { nameKey: 'exercise_lateral_leg_raises', instructionKey: 'instruction_lateral_leg_raises', safetyKey: 'safety_lateral_leg_raises', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 1 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 2 } }], illustrationUrl: '/images/lateral_leg_raises.png' },
    ],
  },
  balance: {
    titleKey: 'session_type_balance',
    exercises: [
      { nameKey: 'exercise_heel_raises', instructionKey: 'instruction_heel_raises', safetyKey: 'safety_heel_raises', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 20, sets: 2 } }], illustrationUrl: '/images/heel_raises.png' },
      { nameKey: 'exercise_single_leg_stance', instructionKey: 'instruction_single_leg_stance', safetyKey: 'safety_single_leg_stance', levels: [{ key: 'duration_seconds_per_leg', params: { count: 15 } }, { key: 'duration_seconds_per_leg', params: { count: 30 } }, { key: 'duration_seconds_per_leg', params: { count: 45 } }], illustrationUrl: '/images/single_leg_stance.png' },
      { nameKey: 'exercise_tandem_stance', instructionKey: 'instruction_tandem_stance', safetyKey: 'safety_tandem_stance', levels: [{ key: 'duration_seconds_per_leg', params: { count: 20 } }, { key: 'duration_seconds_per_leg', params: { count: 30 } }, { key: 'duration_seconds_per_leg', params: { count: 45 } }], illustrationUrl: '/images/tandem_stance.png' },
      { nameKey: 'exercise_heel_to_toe_walk', instructionKey: 'instruction_heel_to_toe_walk', safetyKey: 'safety_heel_to_toe_walk', levels: [{ key: 'duration_steps', params: { count: 10 } }, { key: 'duration_steps', params: { count: 15 } }, { key: 'duration_steps', params: { count: 20 } }], illustrationUrl: '/images/heel_to_toe_walk.png' },
    ],
  },
  flexibility: {
    titleKey: 'session_type_flexibility',
    exercises: [
      { nameKey: 'exercise_arm_circles', instructionKey: 'instruction_arm_circles', safetyKey: 'safety_arm_circles', levels: [{ key: 'duration_seconds', params: { count: 45 } }, { key: 'duration_minutes', params: { count: 1 } }, { key: 'duration_minutes', params: { count: 1.5 } }], illustrationUrl: '/images/arm_circles.png' },
      { nameKey: 'exercise_hamstring_stretch', instructionKey: 'instruction_hamstring_stretch', safetyKey: 'safety_hamstring_stretch', levels: [{ key: 'duration_seconds_per_leg', params: { count: 20 } }, { key: 'duration_seconds_per_leg', params: { count: 30 } }, { key: 'duration_seconds_per_leg', params: { count: 45 } }], illustrationUrl: '/images/hamstring_stretch.png' },
      { nameKey: 'exercise_calf_stretch', instructionKey: 'instruction_calf_stretch', safetyKey: 'safety_calf_stretch', levels: [{ key: 'duration_seconds_per_leg', params: { count: 20 } }, { key: 'duration_seconds_per_leg', params: { count: 30 } }, { key: 'duration_seconds_per_leg', params: { count: 45 } }], illustrationUrl: '/images/calf_stretch.png' },
      { nameKey: 'exercise_shoulder_stretch', instructionKey: 'instruction_shoulder_stretch', safetyKey: 'safety_shoulder_stretch', levels: [{ key: 'duration_seconds_per_arm', params: { count: 20 } }, { key: 'duration_seconds_per_arm', params: { count: 30 } }, { key: 'duration_seconds_per_arm', params: { count: 45 } }], illustrationUrl: '/images/shoulder_stretch.png' },
      { nameKey: 'exercise_chest_stretch', instructionKey: 'instruction_chest_stretch', safetyKey: 'safety_chest_stretch', levels: [{ key: 'duration_seconds', params: { count: 20 } }, { key: 'duration_seconds', params: { count: 30 } }, { key: 'duration_seconds', params: { count: 45 } }], illustrationUrl: '/images/chest_stretch.png' },
    ],
  },
  cardio: {
    titleKey: 'session_type_cardio',
    exercises: [
      { nameKey: 'exercise_brisk_walking', instructionKey: 'instruction_brisk_walking', safetyKey: 'safety_brisk_walking', levels: [{ key: 'duration_minutes', params: { count: 3 } }, { key: 'duration_minutes', params: { count: 5 } }, { key: 'duration_minutes', params: { count: 7 } }], illustrationUrl: '/images/brisk_walking.png' },
      { nameKey: 'exercise_marching_in_place', instructionKey: 'instruction_marching_in_place', safetyKey: 'safety_marching_in_place', levels: [{ key: 'duration_minutes', params: { count: 2 } }, { key: 'duration_minutes', params: { count: 3 } }, { key: 'duration_minutes', params: { count: 4 } }], illustrationUrl: '/images/marching_in_place.png' },
      { nameKey: 'exercise_knee_highs', instructionKey: 'instruction_knee_highs', safetyKey: 'safety_knee_highs', levels: [{ key: 'duration_minutes', params: { count: 1 } }, { key: 'duration_minutes', params: { count: 2 } }, { key: 'duration_minutes', params: { count: 3 } }], illustrationUrl: '/images/knee_highs.png' },
      { nameKey: 'exercise_seated_rowing', instructionKey: 'instruction_seated_rowing', safetyKey: 'safety_seated_rowing', levels: [{ key: 'duration_minutes', params: { count: 2 } }, { key: 'duration_minutes', params: { count: 3 } }, { key: 'duration_minutes', params: { count: 4 } }], illustrationUrl: '/images/seated_rowing.png' },
    ],
  },
  posture: {
    titleKey: 'session_type_posture',
    exercises: [
      { nameKey: 'exercise_wall_push_ups', instructionKey: 'instruction_wall_push_ups', safetyKey: 'safety_wall_push_ups', levels: [{ key: 'duration_reps_sets', params: { count: 8, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 3 } }], illustrationUrl: '/images/wall_push_ups.png' },
      { nameKey: 'exercise_cat_cow_stretch', instructionKey: 'instruction_cat_cow_stretch', safetyKey: 'safety_cat_cow_stretch', levels: [{ key: 'duration_reps', params: { count: 10 } }, { key: 'duration_reps', params: { count: 12 } }, { key: 'duration_reps', params: { count: 15 } }], illustrationUrl: '/images/cat_cow_stretch.png' },
      { nameKey: 'exercise_bird_dog', instructionKey: 'instruction_bird_dog', safetyKey: 'safety_bird_dog', levels: [{ key: 'duration_per_side', params: { count: 6 } }, { key: 'duration_per_side', params: { count: 8 } }, { key: 'duration_per_side', params: { count: 10 } }], illustrationUrl: '/images/bird_dog.png' },
      { nameKey: 'exercise_pelvic_tilt', instructionKey: 'instruction_pelvic_tilt', safetyKey: 'safety_pelvic_tilt', levels: [{ key: 'duration_reps', params: { count: 12 } }, { key: 'duration_reps', params: { count: 15 } }, { key: 'duration_reps', params: { count: 20 } }], illustrationUrl: '/images/pelvic_tilt.png' },
      { nameKey: 'exercise_chest_stretch', instructionKey: 'instruction_chest_stretch', safetyKey: 'safety_chest_stretch', levels: [{ key: 'duration_seconds', params: { count: 20 } }, { key: 'duration_seconds', params: { count: 30 } }, { key: 'duration_seconds', params: { count: 45 } }], illustrationUrl: '/images/chest_stretch.png' },
    ],
  },
};
