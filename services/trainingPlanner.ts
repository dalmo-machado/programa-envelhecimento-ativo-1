
import { Assessment, PersonalizedSession } from '../types';
import { SessionKey } from './trainingData';

// --- Thresholds for Personalization ---

// Lower is worse for these metrics
const BALANCE_THRESHOLDS_S: [number, number] = [10, 20]; // <10 is level 1, 10-20 is level 2, >20 is level 3
const GRIP_THRESHOLDS_KGF: [number, number] = [20, 30];   // <20 is level 1, 20-30 is level 2, >30 is level 3

// Higher is worse for this metric (less negative is better)
const FLEXIBILITY_THRESHOLDS_CM: [number, number] = [-10, -2]; // <-10 is level 1, -10 to -2 is level 2, >-2 is level 3

const TOTAL_SESSIONS = 24;

const getLevel = (value: number, thresholds: [number, number]): 1 | 2 | 3 => {
    if (value < thresholds[0]) return 1;
    if (value <= thresholds[1]) return 2;
    return 3;
};

// PRO-Training: sessões multicomponentes (A/B/C) em rotação fixa.
// O nível inicial é determinado pela avaliação; progressão a cada 8 sessões.
const SESSION_ROTATION: SessionKey[] = ['session1', 'session2', 'session3'];

export const generateTrainingPlan = (assessment: Assessment): PersonalizedSession[] => {
    const plan: PersonalizedSession[] = [];

    // 1. Determinar nível inicial pela média de equilíbrio, força e flexibilidade
    const balanceLevel   = getLevel(assessment.balance_s,       BALANCE_THRESHOLDS_S);
    const strengthLevel  = getLevel(assessment.grip_kgf,        GRIP_THRESHOLDS_KGF);
    const flexLevel      = getLevel(assessment.back_scratch_cm, FLEXIBILITY_THRESHOLDS_CM);
    const avgLevel       = Math.round((balanceLevel + strengthLevel + flexLevel) / 3);
    let currentLevel     = Math.max(1, Math.min(3, avgLevel)) as 1 | 2 | 3;

    // 2. Montar as 24 sessões em rotação A→B→C com progressão de nível a cada 8
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