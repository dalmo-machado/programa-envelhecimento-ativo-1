
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

export const generateTrainingPlan = (assessment: Assessment): PersonalizedSession[] => {
    const plan: PersonalizedSession[] = [];
    
    // 1. Determine overall starting level based on an average of key scores
    const balanceLevel = getLevel(assessment.balance_s, BALANCE_THRESHOLDS_S);
    const strengthLevel = getLevel(assessment.grip_kgf, GRIP_THRESHOLDS_KGF);
    const flexibilityLevel = getLevel(assessment.back_scratch_cm, FLEXIBILITY_THRESHOLDS_CM);

    const avgLevel = Math.round((balanceLevel + strengthLevel + flexibilityLevel) / 3);
    const startingLevel = Math.max(1, Math.min(3, avgLevel)) as 1 | 2 | 3;

    // 2. Determine priority areas (sessions that should appear more often)
    const priorities: SessionKey[] = [];
    if (balanceLevel === 1) priorities.push('balance');
    if (strengthLevel === 1) priorities.push('strength');
    if (flexibilityLevel === 1) priorities.push('flexibility');

    // If no specific low scores, ensure a balanced plan
    if (priorities.length === 0) {
        priorities.push('strength', 'balance');
    }

    // 3. Build the 24-session plan with progression
    const baseSchedule: SessionKey[] = ['strength', 'balance', 'flexibility', 'cardio', 'posture'];
    let currentLevel = startingLevel;

    for (let i = 0; i < TOTAL_SESSIONS; i++) {
        // Simple progression: increase level after every 8 sessions
        if (i === 8 && currentLevel < 3) {
            currentLevel = (currentLevel + 1) as 2 | 3;
        } else if (i === 16 && currentLevel < 3) {
            currentLevel = (currentLevel + 1) as 2 | 3;
        }
        
        let sessionType: SessionKey;
        // Prioritize weak areas
        if (priorities.length > 0 && i % 2 === 0) { // Every other session is a priority
             sessionType = priorities[i % priorities.length];
        } else {
             sessionType = baseSchedule[i % baseSchedule.length];
        }

        plan.push({
            sessionType,
            level: currentLevel,
        });
    }

    // Ensure variety by swapping some sessions around but keeping the level progression
    for (let i = 0; i < 5; i++) {
        const idx1 = Math.floor(Math.random() * TOTAL_SESSIONS);
        const idx2 = Math.floor(Math.random() * TOTAL_SESSIONS);
        const type1 = plan[idx1].sessionType;
        const type2 = plan[idx2].sessionType;
        // Swap only the session type, not the level, to maintain progression
        plan[idx1].sessionType = type2;
        plan[idx2].sessionType = type1;
    }

    return plan;
};