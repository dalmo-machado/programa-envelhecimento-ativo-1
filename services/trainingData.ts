
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
  /** Target RPE zone on the 1–10 scale (Asier Phase 1) */
  rpeZone?: [number, number];
  /** Recommended load per level — e.g. "1–2 kg", "Peso corporal" (Asier Phase 1) */
  loadRec?: [string, string, string];
}

export interface TrainingProgram {
  titleKey: keyof I18nKeys;
  exercises: Exercise[];
}

export type SessionKey = 'session1' | 'session2' | 'session3';


// ── Aquecimento / Calentamiento (PRO-Training Table 2: Warm-Up) ──────────────
export const warmupExercises: Exercise[] = [
  // --- Mobilidade articular (AQ-01 a AQ-06) ---
  {
    nameKey: 'exercise_ankle_circles',
    instructionKey: 'instruction_ankle_circles',
    safetyKey: 'safety_ankle_circles',
    levels: [
      { key: 'duration_reps', params: { count: 10 } },
      { key: 'duration_reps', params: { count: 15 } },
      { key: 'duration_reps', params: { count: 20 } },
    ],
    illustrationUrl: '/images/ankle_circles.png',
    rpeZone: [2, 4],
  },
  {
    nameKey: 'exercise_knee_flexion_extension',
    instructionKey: 'instruction_knee_flexion_extension',
    safetyKey: 'safety_knee_flexion_extension',
    levels: [
      { key: 'duration_reps_sets', params: { count: 8, sets: 1 } },
      { key: 'duration_reps_sets', params: { count: 10, sets: 1 } },
      { key: 'duration_reps_sets', params: { count: 12, sets: 1 } },
    ],
    illustrationUrl: '/images/knee_flexion_extension.png',
    rpeZone: [2, 4],
  },
  {
    nameKey: 'exercise_hip_circles',
    instructionKey: 'instruction_hip_circles',
    safetyKey: 'safety_hip_circles',
    levels: [
      { key: 'duration_reps', params: { count: 10 } },
      { key: 'duration_reps', params: { count: 15 } },
      { key: 'duration_reps', params: { count: 20 } },
    ],
    illustrationUrl: '/images/hip_circles.png',
    rpeZone: [2, 4],
  },
  {
    nameKey: 'exercise_shoulder_circles',
    instructionKey: 'instruction_shoulder_circles',
    safetyKey: 'safety_shoulder_circles',
    levels: [
      { key: 'duration_reps', params: { count: 10 } },
      { key: 'duration_reps', params: { count: 15 } },
      { key: 'duration_reps', params: { count: 20 } },
    ],
    illustrationUrl: '/images/shoulder_circles.png',
    rpeZone: [2, 4],
  },
  {
    nameKey: 'exercise_wrist_circles',
    instructionKey: 'instruction_wrist_circles',
    safetyKey: 'safety_wrist_circles',
    levels: [
      { key: 'duration_reps', params: { count: 10 } },
      { key: 'duration_reps', params: { count: 15 } },
      { key: 'duration_reps', params: { count: 20 } },
    ],
    illustrationUrl: '/images/wrist_circles.png',
    rpeZone: [2, 4],
  },
  {
    nameKey: 'exercise_neck_mobility',
    instructionKey: 'instruction_neck_mobility',
    safetyKey: 'safety_neck_mobility',
    levels: [
      { key: 'duration_seconds', params: { count: 30 } },
      { key: 'duration_seconds', params: { count: 45 } },
      { key: 'duration_seconds', params: { count: 60 } },
    ],
    illustrationUrl: '/images/neck_mobility.png',
    rpeZone: [2, 3],
  },
  // --- Ativação dinâmica / cardio leve (AQ-07 a AQ-10) ---
  {
    nameKey: 'exercise_diagonal_foot_taps',
    instructionKey: 'instruction_diagonal_foot_taps',
    safetyKey: 'safety_diagonal_foot_taps',
    levels: [
      { key: 'duration_seconds', params: { count: 30 } },
      { key: 'duration_seconds', params: { count: 45 } },
      { key: 'duration_seconds', params: { count: 60 } },
    ],
    illustrationUrl: '/images/diagonal_foot_taps.png',
    rpeZone: [3, 5],
  },
  {
    nameKey: 'exercise_heel_raises',
    instructionKey: 'instruction_heel_raises',
    safetyKey: 'safety_heel_raises',
    levels: [
      { key: 'duration_reps_sets', params: { count: 10, sets: 1 } },
      { key: 'duration_reps_sets', params: { count: 12, sets: 1 } },
      { key: 'duration_reps_sets', params: { count: 15, sets: 1 } },
    ],
    illustrationUrl: '/images/heel_raises.png',
    rpeZone: [3, 5],
  },
  {
    nameKey: 'exercise_lateral_steps',
    instructionKey: 'instruction_lateral_steps',
    safetyKey: 'safety_lateral_steps',
    levels: [
      { key: 'duration_seconds', params: { count: 30 } },
      { key: 'duration_seconds', params: { count: 45 } },
      { key: 'duration_seconds', params: { count: 60 } },
    ],
    illustrationUrl: '/images/lateral_steps.png',
    rpeZone: [3, 5],
  },
  {
    nameKey: 'exercise_v_step',
    instructionKey: 'instruction_v_step',
    safetyKey: 'safety_v_step',
    levels: [
      { key: 'duration_seconds', params: { count: 30 } },
      { key: 'duration_seconds', params: { count: 45 } },
      { key: 'duration_seconds', params: { count: 60 } },
    ],
    illustrationUrl: '/images/v_step.png',
    rpeZone: [3, 5],
  },
];

// ── Desaquecimento / Vuelta a la calma (PRO-Training Table 2: Cool-Down, 7 ex) ─
export const cooldownExercises: Exercise[] = [
  // DQ-01
  {
    nameKey: 'exercise_calf_stretch',
    instructionKey: 'instruction_calf_stretch',
    safetyKey: 'safety_calf_stretch',
    levels: [
      { key: 'duration_seconds_per_leg', params: { count: 20 } },
      { key: 'duration_seconds_per_leg', params: { count: 30 } },
      { key: 'duration_seconds_per_leg', params: { count: 45 } },
    ],
    illustrationUrl: '/images/calf_stretch.png',
    rpeZone: [2, 4],
  },
  // DQ-02
  {
    nameKey: 'exercise_hamstring_stretch',
    instructionKey: 'instruction_hamstring_stretch',
    safetyKey: 'safety_hamstring_stretch',
    levels: [
      { key: 'duration_seconds_per_leg', params: { count: 20 } },
      { key: 'duration_seconds_per_leg', params: { count: 30 } },
      { key: 'duration_seconds_per_leg', params: { count: 45 } },
    ],
    illustrationUrl: '/images/hamstring_stretch.png',
    rpeZone: [2, 4],
  },
  // DQ-03
  {
    nameKey: 'exercise_glute_stretch',
    instructionKey: 'instruction_glute_stretch',
    safetyKey: 'safety_glute_stretch',
    levels: [
      { key: 'duration_seconds_per_leg', params: { count: 20 } },
      { key: 'duration_seconds_per_leg', params: { count: 30 } },
      { key: 'duration_seconds_per_leg', params: { count: 45 } },
    ],
    illustrationUrl: '/images/glute_stretch.png',
    rpeZone: [2, 4],
  },
  // DQ-04
  {
    nameKey: 'exercise_quad_stretch',
    instructionKey: 'instruction_quad_stretch',
    safetyKey: 'safety_quad_stretch',
    levels: [
      { key: 'duration_seconds_per_leg', params: { count: 20 } },
      { key: 'duration_seconds_per_leg', params: { count: 30 } },
      { key: 'duration_seconds_per_leg', params: { count: 45 } },
    ],
    illustrationUrl: '/images/quad_stretch.png',
    rpeZone: [2, 4],
  },
  // DQ-05
  {
    nameKey: 'exercise_back_stretch',
    instructionKey: 'instruction_back_stretch',
    safetyKey: 'safety_back_stretch',
    levels: [
      { key: 'duration_seconds', params: { count: 20 } },
      { key: 'duration_seconds', params: { count: 30 } },
      { key: 'duration_seconds', params: { count: 45 } },
    ],
    illustrationUrl: '/images/back_stretch.png',
    rpeZone: [2, 4],
  },
  // DQ-06 (proxy: alongamento de peitoral na parede)
  {
    nameKey: 'exercise_chest_stretch',
    instructionKey: 'instruction_chest_stretch',
    safetyKey: 'safety_chest_stretch',
    levels: [
      { key: 'duration_seconds', params: { count: 20 } },
      { key: 'duration_seconds', params: { count: 30 } },
      { key: 'duration_seconds', params: { count: 45 } },
    ],
    illustrationUrl: '/images/chest_stretch.png',
    rpeZone: [2, 4],
  },
  // DQ-07
  {
    nameKey: 'exercise_neck_adductor_stretch',
    instructionKey: 'instruction_neck_adductor_stretch',
    safetyKey: 'safety_neck_adductor_stretch',
    levels: [
      { key: 'duration_seconds', params: { count: 20 } },
      { key: 'duration_seconds', params: { count: 30 } },
      { key: 'duration_seconds', params: { count: 45 } },
    ],
    illustrationUrl: '/images/neck_adductor_stretch.png',
    rpeZone: [2, 4],
  },
];
// ── Parte Principal — 3 sessões multicomponentes (PRO-Training) ──────────────
// Cada sessão: 2 equilíbrio + 1 empurrada + 1 puxada + 2 MMII + 2 core + 2 cardio = 10 ex.
export const trainingPrograms: Record<SessionKey, TrainingProgram> = {
  // ── Sessão A ─────────────────────────────────────────────────────────────
  session1: {
    titleKey: 'session_type_session1',
    exercises: [
      // Equilíbrio
      { nameKey: 'exercise_single_leg_stance', instructionKey: 'instruction_single_leg_stance', safetyKey: 'safety_single_leg_stance', levels: [{ key: 'duration_seconds_per_leg', params: { count: 15 } }, { key: 'duration_seconds_per_leg', params: { count: 30 } }, { key: 'duration_seconds_per_leg', params: { count: 45 } }], illustrationUrl: '/images/single_leg_stance.png', rpeZone: [3, 5] },
      { nameKey: 'exercise_heel_raises', instructionKey: 'instruction_heel_raises', safetyKey: 'safety_heel_raises', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 20, sets: 2 } }], illustrationUrl: '/images/heel_raises.png', rpeZone: [3, 5] },
      // MMSS — empurrada
      { nameKey: 'exercise_wall_push_ups', instructionKey: 'instruction_wall_push_ups', safetyKey: 'safety_wall_push_ups', levels: [{ key: 'duration_reps_sets', params: { count: 8, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 3 } }], illustrationUrl: '/images/wall_push_ups.png', rpeZone: [5, 7], loadRec: ['Peso corporal — amplitude parcial', 'Peso corporal — amplitude total', 'Peso corporal — amplitude total, mais séries'] },
      // MMSS — puxada
      { nameKey: 'exercise_bicep_curls', instructionKey: 'instruction_bicep_curls', safetyKey: 'safety_bicep_curls', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: '/images/bicep_curls.png', rpeZone: [5, 7], loadRec: ['1–2 kg por mão (garrafa d\'água)', '2–3 kg por mão', '3–5 kg por mão'] },
      // MMII
      { nameKey: 'exercise_sit_to_stand', instructionKey: 'instruction_sit_to_stand', safetyKey: 'safety_sit_to_stand', levels: [{ key: 'duration_reps_sets', params: { count: 8, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: '/images/sit_to_stand.png', rpeZone: [5, 7], loadRec: ['Peso corporal — ritmo lento', 'Peso corporal — ritmo moderado', 'Peso corporal — ritmo rápido'] },
      { nameKey: 'exercise_hip_abduction_band', instructionKey: 'instruction_hip_abduction_band', safetyKey: 'safety_hip_abduction_band', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: '/images/hip_abduction_band.png', rpeZone: [4, 6], loadRec: ['Faixa leve — amplitude parcial', 'Faixa leve — amplitude plena', 'Faixa média — amplitude plena'] },
      // Core
      { nameKey: 'exercise_bird_dog', instructionKey: 'instruction_bird_dog', safetyKey: 'safety_bird_dog', levels: [{ key: 'duration_per_side', params: { count: 6 } }, { key: 'duration_per_side', params: { count: 8 } }, { key: 'duration_per_side', params: { count: 10 } }], illustrationUrl: '/images/bird_dog.png', rpeZone: [3, 5] },
      { nameKey: 'exercise_pelvic_tilt', instructionKey: 'instruction_pelvic_tilt', safetyKey: 'safety_pelvic_tilt', levels: [{ key: 'duration_reps', params: { count: 12 } }, { key: 'duration_reps', params: { count: 15 } }, { key: 'duration_reps', params: { count: 20 } }], illustrationUrl: '/images/pelvic_tilt.png', rpeZone: [2, 4] },
      // Cardio
      { nameKey: 'exercise_marching_in_place', instructionKey: 'instruction_marching_in_place', safetyKey: 'safety_marching_in_place', levels: [{ key: 'duration_minutes', params: { count: 2 } }, { key: 'duration_minutes', params: { count: 3 } }, { key: 'duration_minutes', params: { count: 4 } }], illustrationUrl: '/images/marching_in_place.png', rpeZone: [4, 6] },
      { nameKey: 'exercise_knee_highs', instructionKey: 'instruction_knee_highs', safetyKey: 'safety_knee_highs', levels: [{ key: 'duration_minutes', params: { count: 1 } }, { key: 'duration_minutes', params: { count: 2 } }, { key: 'duration_minutes', params: { count: 3 } }], illustrationUrl: '/images/knee_highs.png', rpeZone: [5, 7] },
    ],
  },
  // ── Sessão B ─────────────────────────────────────────────────────────────
  session2: {
    titleKey: 'session_type_session2',
    exercises: [
      // Equilíbrio
      { nameKey: 'exercise_tandem_stance', instructionKey: 'instruction_tandem_stance', safetyKey: 'safety_tandem_stance', levels: [{ key: 'duration_seconds_per_leg', params: { count: 20 } }, { key: 'duration_seconds_per_leg', params: { count: 30 } }, { key: 'duration_seconds_per_leg', params: { count: 45 } }], illustrationUrl: '/images/tandem_stance.png', rpeZone: [3, 5] },
      { nameKey: 'exercise_heel_to_toe_walk', instructionKey: 'instruction_heel_to_toe_walk', safetyKey: 'safety_heel_to_toe_walk', levels: [{ key: 'duration_steps', params: { count: 10 } }, { key: 'duration_steps', params: { count: 15 } }, { key: 'duration_steps', params: { count: 20 } }], illustrationUrl: '/images/heel_to_toe_walk.png', rpeZone: [3, 5] },
      // MMSS — empurrada
      { nameKey: 'exercise_floor_push_ups', instructionKey: 'instruction_floor_push_ups', safetyKey: 'safety_floor_push_ups', levels: [{ key: 'duration_reps_sets', params: { count: 6, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 8, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 10, sets: 3 } }], illustrationUrl: '/images/floor_push_ups.png', rpeZone: [5, 7], loadRec: ['Peso corporal — joelhos apoiados', 'Peso corporal — joelhos apoiados, ritmo controlado', 'Peso corporal — posição completa'] },
      // MMSS — puxada
      { nameKey: 'exercise_rowing_with_resistance_band', instructionKey: 'instruction_rowing_with_resistance_band', safetyKey: 'safety_rowing_with_resistance_band', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: '/images/rowing_with_resistance_band.png', rpeZone: [5, 7], loadRec: ['Faixa leve', 'Faixa média', 'Faixa forte'] },
      // MMII
      { nameKey: 'exercise_step_ups', instructionKey: 'instruction_step_ups', safetyKey: 'safety_step_ups', levels: [{ key: 'duration_seconds_per_leg', params: { count: 45 } }, { key: 'duration_seconds_per_leg', params: { count: 60 } }, { key: 'duration_minutes', params: { count: 2 } }], illustrationUrl: '/images/step_ups.png', rpeZone: [5, 7], loadRec: ['Peso corporal — degrau baixo (10–15 cm)', 'Peso corporal — degrau médio (15–20 cm)', 'Peso corporal — degrau mais alto (20–25 cm)'] },
      { nameKey: 'exercise_glute_bridge_band', instructionKey: 'instruction_glute_bridge_band', safetyKey: 'safety_glute_bridge_band', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: '/images/glute_bridge_band.png', rpeZone: [4, 6], loadRec: ['Faixa leve acima dos joelhos', 'Faixa média acima dos joelhos', 'Faixa forte acima dos joelhos'] },
      // Core
      { nameKey: 'exercise_dead_bug', instructionKey: 'instruction_dead_bug', safetyKey: 'safety_dead_bug', levels: [{ key: 'duration_per_side', params: { count: 5 } }, { key: 'duration_per_side', params: { count: 8 } }, { key: 'duration_per_side', params: { count: 10 } }], illustrationUrl: '/images/dead_bug.png', rpeZone: [3, 5] },
      { nameKey: 'exercise_front_plank', instructionKey: 'instruction_front_plank', safetyKey: 'safety_front_plank', levels: [{ key: 'duration_seconds', params: { count: 20 } }, { key: 'duration_seconds', params: { count: 30 } }, { key: 'duration_seconds', params: { count: 45 } }], illustrationUrl: '/images/front_plank.png', rpeZone: [4, 6] },
      // Cardio
      { nameKey: 'exercise_skipping', instructionKey: 'instruction_skipping', safetyKey: 'safety_skipping', levels: [{ key: 'duration_seconds', params: { count: 30 } }, { key: 'duration_seconds', params: { count: 45 } }, { key: 'duration_minutes', params: { count: 1 } }], illustrationUrl: '/images/skipping.png', rpeZone: [5, 7] },
      { nameKey: 'exercise_lateral_shuffle', instructionKey: 'instruction_lateral_shuffle', safetyKey: 'safety_lateral_shuffle', levels: [{ key: 'duration_seconds', params: { count: 30 } }, { key: 'duration_seconds', params: { count: 45 } }, { key: 'duration_minutes', params: { count: 1 } }], illustrationUrl: '/images/lateral_shuffle.png', rpeZone: [5, 7] },
    ],
  },
  // ── Sessão C ─────────────────────────────────────────────────────────────
  session3: {
    titleKey: 'session_type_session3',
    exercises: [
      // Equilíbrio
      { nameKey: 'exercise_foot_taps_directions', instructionKey: 'instruction_foot_taps_directions', safetyKey: 'safety_foot_taps_directions', levels: [{ key: 'duration_reps', params: { count: 10 } }, { key: 'duration_reps', params: { count: 15 } }, { key: 'duration_reps', params: { count: 20 } }], illustrationUrl: '/images/foot_taps_directions.png', rpeZone: [3, 5] },
      { nameKey: 'exercise_heel_raises', instructionKey: 'instruction_heel_raises', safetyKey: 'safety_heel_raises', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 20, sets: 2 } }], illustrationUrl: '/images/heel_raises.png', rpeZone: [3, 5] },
      // MMSS — empurrada
      { nameKey: 'exercise_tricep_extension_band', instructionKey: 'instruction_tricep_extension_band', safetyKey: 'safety_tricep_extension_band', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: '/images/tricep_extension_band.png', rpeZone: [5, 7], loadRec: ['Faixa leve', 'Faixa média', 'Faixa forte'] },
      // MMSS — puxada
      { nameKey: 'exercise_scapular_retraction_band', instructionKey: 'instruction_scapular_retraction_band', safetyKey: 'safety_scapular_retraction_band', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: '/images/scapular_retraction_band.png', rpeZone: [5, 7], loadRec: ['Faixa leve', 'Faixa média', 'Faixa forte'] },
      // MMII
      { nameKey: 'exercise_lunge', instructionKey: 'instruction_lunge', safetyKey: 'safety_lunge', levels: [{ key: 'duration_reps_sets', params: { count: 8, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 3 } }], illustrationUrl: '/images/lunge.png', rpeZone: [5, 7], loadRec: ['Peso corporal — passada curta', 'Peso corporal — passada plena', 'Faixa elástica — passada plena'] },
      { nameKey: 'exercise_sumo_deadlift_band', instructionKey: 'instruction_sumo_deadlift_band', safetyKey: 'safety_sumo_deadlift_band', levels: [{ key: 'duration_reps_sets', params: { count: 10, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 12, sets: 2 } }, { key: 'duration_reps_sets', params: { count: 15, sets: 3 } }], illustrationUrl: '/images/sumo_deadlift_band.png', rpeZone: [5, 7], loadRec: ['Faixa leve', 'Faixa média', 'Faixa forte'] },
      // Core
      { nameKey: 'exercise_side_plank_knee', instructionKey: 'instruction_side_plank_knee', safetyKey: 'safety_side_plank_knee', levels: [{ key: 'duration_seconds_per_leg', params: { count: 15 } }, { key: 'duration_seconds_per_leg', params: { count: 25 } }, { key: 'duration_seconds_per_leg', params: { count: 40 } }], illustrationUrl: '/images/side_plank_knee.png', rpeZone: [4, 6] },
      { nameKey: 'exercise_slow_mountain_climber', instructionKey: 'instruction_slow_mountain_climber', safetyKey: 'safety_slow_mountain_climber', levels: [{ key: 'duration_per_side', params: { count: 6 } }, { key: 'duration_per_side', params: { count: 8 } }, { key: 'duration_per_side', params: { count: 10 } }], illustrationUrl: '/images/slow_mountain_climber.png', rpeZone: [4, 6] },
      // Cardio
      { nameKey: 'exercise_step_touch', instructionKey: 'instruction_step_touch', safetyKey: 'safety_step_touch', levels: [{ key: 'duration_seconds', params: { count: 30 } }, { key: 'duration_seconds', params: { count: 45 } }, { key: 'duration_minutes', params: { count: 1 } }], illustrationUrl: '/images/step_touch.png', rpeZone: [4, 6] },
      { nameKey: 'exercise_brisk_walking', instructionKey: 'instruction_brisk_walking', safetyKey: 'safety_brisk_walking', levels: [{ key: 'duration_minutes', params: { count: 3 } }, { key: 'duration_minutes', params: { count: 5 } }, { key: 'duration_minutes', params: { count: 7 } }], illustrationUrl: '/images/brisk_walking.png', rpeZone: [5, 7] },
    ],
  },
};
