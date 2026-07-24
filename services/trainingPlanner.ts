
import { Assessment, PersonalizedSession } from '../types';
import { SessionKey } from './trainingData';

// ─── SFT Classification (Rikli & Jones norms, sex-neutral, ages 60–69) ────────

export type ClassificationResult = 'classification_good' | 'classification_average' | 'classification_attention';

/**
 * Classifies a single SFT metric against normative cut-points.
 * Returns null when the value indicates the test was not performed
 * (value ≤ 0 for metrics where zero is physiologically impossible).
 */
export function classifyMetric(
    metric: keyof Assessment | string,
    value: number | undefined | null,
): ClassificationResult | null {
    if (value === undefined || value === null) return null;

    switch (metric) {
        // ── Always-present tests ──────────────────────────────────────────────

        case 'grip_kgf':
            if (value >= 30) return 'classification_good';
            if (value >= 20) return 'classification_average';
            return 'classification_attention';

        case 'balance_s':
            if (value >= 20) return 'classification_good';
            if (value >= 10) return 'classification_average';
            return 'classification_attention';

        case 'back_scratch_cm':
            if (value > -2)  return 'classification_good';
            if (value > -10) return 'classification_average';
            return 'classification_attention';

        // ── Optional tests — skip if zero (not entered) ───────────────────────

        case 'up_and_go_seconds':   // lower = better
            if (value <= 0)  return null;
            if (value <= 9)  return 'classification_good';
            if (value <= 12) return 'classification_average';
            return 'classification_attention';

        case 'six_min_walk_meters': // higher = better
            if (value <= 0)   return null;
            if (value >= 500) return 'classification_good';
            if (value >= 350) return 'classification_average';
            return 'classification_attention';

        case 'chair_stand_reps':    // higher = better
            if (value <= 0)  return null;
            if (value >= 12) return 'classification_good';
            if (value >= 9)  return 'classification_average';
            return 'classification_attention';

        case 'arm_curl_reps':       // higher = better
            if (value <= 0)  return null;
            if (value >= 16) return 'classification_good';
            if (value >= 13) return 'classification_average';
            return 'classification_attention';

        case 'chair_sit_reach_cm':  // higher = better; 0 IS a valid score
            if (value >= 2.5)  return 'classification_good';
            if (value >= -2.5) return 'classification_average';
            return 'classification_attention';

        default:
            return null;
    }
}

// ─── Fitness profile ──────────────────────────────────────────────────────────

export type ProfileKey = 'profile_beginner' | 'profile_intermediate' | 'profile_advanced';

export interface FitnessProfile {
    /** Training plan initial level: 1 = Iniciante, 2 = Intermediário, 3 = Avançado */
    level: 1 | 2 | 3;
    /** i18n key for the profile name */
    profileKey: ProfileKey;
    goodCount: number;
    attentionCount: number;
    totalTests: number;
}

/** All SFT metrics evaluated for profiling. */
const SFT_METRICS: (keyof Assessment)[] = [
    'grip_kgf',
    'balance_s',
    'back_scratch_cm',
    'up_and_go_seconds',
    'six_min_walk_meters',
    'chair_stand_reps',
    'arm_curl_reps',
    'chair_sit_reach_cm',
];

/**
 * Computes the fitness profile from all available SFT results.
 *
 * Rules (SPEC_Individualizacion_App_AGECARE):
 * - Iniciante  (level 1): ≥ 2 tests classified as "Necessita atenção"
 * - Avançado   (level 3): ≥ 5 tests classified as "Bom"
 * - Intermediário (level 2): all other cases
 *
 * Iniciante is checked first to prioritise safety.
 */
export function computeFitnessProfile(assessment: Assessment): FitnessProfile {
    let goodCount = 0;
    let attentionCount = 0;
    let totalTests = 0;

    for (const metric of SFT_METRICS) {
        const value = assessment[metric] as number | undefined;
        const cls = classifyMetric(metric, value);
        if (cls === null) continue; // test not performed / zero sentinel
        totalTests++;
        if (cls === 'classification_good') goodCount++;
        else if (cls === 'classification_attention') attentionCount++;
    }

    if (attentionCount >= 2) {
        return { level: 1, profileKey: 'profile_beginner',      goodCount, attentionCount, totalTests };
    }
    if (goodCount >= 5) {
        return { level: 3, profileKey: 'profile_advanced',     goodCount, attentionCount, totalTests };
    }
    return     { level: 2, profileKey: 'profile_intermediate', goodCount, attentionCount, totalTests };
}

// ─── Training plan generation ─────────────────────────────────────────────────

const TOTAL_SESSIONS = 24;

// PRO-Training: sessões multicomponentes (A/B/C) em rotação fixa.
const SESSION_ROTATION: SessionKey[] = ['session1', 'session2', 'session3'];

/**
 * Generates a 24-session personalised training plan.
 *
 * Initial level is derived from computeFitnessProfile() using all available
 * SFT metrics. Level advances automatically at sessions 8 and 16 (weeks 3–4
 * and 5–6 of the 8-week programme).
 *
 * @param forcedLevel — when provided by the researcher, overrides the computed
 *   profile level. The automatic progression (sessions 9 and 17) still applies
 *   relative to this starting level.
 */
export const generateTrainingPlan = (assessment: Assessment, forcedLevel?: 1 | 2 | 3): PersonalizedSession[] => {
    const plan: PersonalizedSession[] = [];
    const { level } = computeFitnessProfile(assessment);
    let currentLevel: 1 | 2 | 3 = forcedLevel ?? level;

    for (let i = 0; i < TOTAL_SESSIONS; i++) {
        if (i === 8  && currentLevel < 3) currentLevel = (currentLevel + 1) as 2 | 3;
        if (i === 16 && currentLevel < 3) currentLevel = (currentLevel + 1) as 2 | 3;

        plan.push({
            sessionType: SESSION_ROTATION[i % SESSION_ROTATION.length],
            level: currentLevel,
        });
    }

    return plan;
};
