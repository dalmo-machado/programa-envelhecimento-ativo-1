
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { useUserRole } from '../context/UserRoleContext';
import { Assessment, UserRole } from '../types';
import { classifyMetric, computeFitnessProfile, generateTrainingPlan } from '../services/trainingPlanner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Header from '../components/Header';
import { I18nKeys } from '../localization/es';

type ClassificationKey = 'classification_good' | 'classification_average' | 'classification_attention';

// ─── Classification helpers ───────────────────────────────────────────────────

/**
 * Wraps classifyMetric for always-present SFT tests.
 * Falls back to 'classification_average' if the metric is not handled
 * (e.g. weight, height — shown for info only, not classified for profile).
 */
const getClassification = (metric: keyof Assessment, value: number): ClassificationKey => {
    const result = classifyMetric(metric, value);
    return result ?? 'classification_average';
};

const classificationColors: Record<ClassificationKey, string> = {
    'classification_good':       'bg-green-100 text-green-800',
    'classification_average':    'bg-yellow-100 text-yellow-800',
    'classification_attention':  'bg-red-100 text-red-800',
};

/** % of base load per training level — used in profile badge and override note */
const LEVEL_LOAD_PCT: Record<1 | 2 | 3, number> = { 1: 60, 2: 80, 3: 100 };

const profileColors: Record<string, string> = {
    'profile_beginner':     'bg-red-50 border-red-300 text-red-800',
    'profile_intermediate': 'bg-yellow-50 border-yellow-300 text-yellow-800',
    'profile_advanced':     'bg-green-50 border-green-300 text-green-800',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultDisplay {
    labelKey: keyof I18nKeys;
    value: string;
    unit: string;
    classification: ClassificationKey;
    /** If true, this row counts toward the fitness profile badge */
    countForProfile?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AssessmentSummaryPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, formatNumber } = useLocalization();
    const { participants, updateParticipant } = useParticipantData();
    const { participantId, role } = useUserRole();

    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [overrideLevel, setOverrideLevel] = useState<1 | 2 | 3 | null>(null);

    // If the assessment was registered by a researcher for a specific participant,
    // the participantId is forwarded via router state so we can return there.
    const preselectedId: string | undefined = (location.state as any)?.participantId;
    const returnPath = preselectedId
        ? `/researcher/participant/${preselectedId}`
        : '/dashboard';
    const effectiveParticipantId = preselectedId ?? participantId;

    const participant = participants.find(p => p.study_id === effectiveParticipantId);
    const lastAssessment = participant?.assessments?.[participant.assessments.length - 1];

    if (!lastAssessment) {
        return (
            <div className="bg-background min-h-screen">
                <Header />
                <main className="p-8">
                    <Card>
                        <p>{t('no_assessment_data' as any)}</p>
                        <Button onClick={() => navigate('/dashboard')} className="mt-4">{t('back_button')}</Button>
                    </Card>
                </main>
            </div>
        );
    }

    const data = lastAssessment.data;
    const isResearcher = role === UserRole.RESEARCHER || role === UserRole.ADMIN;
    const hasPlan = (participant?.training_plan ?? []).length > 0;

    // ── Compute fitness profile ───────────────────────────────────────────────
    const profile = computeFitnessProfile(data);

    // ── Build result rows ─────────────────────────────────────────────────────

    // Always-shown tests (body composition — info only, not profile metrics)
    const bodyResults: ResultDisplay[] = [
        { labelKey: 'weight',           value: formatNumber(data.weight_kg,      { maximumFractionDigits: 1 }), unit: 'kg',  classification: 'classification_average' },
        { labelKey: 'height',           value: formatNumber(data.height_cm,      { maximumFractionDigits: 0 }), unit: 'cm',  classification: 'classification_average' },
        { labelKey: 'bmi',              value: formatNumber(data.bmi,            { maximumFractionDigits: 1 }), unit: '',    classification: getClassification('bmi', data.bmi) },
        { labelKey: 'calf_circumference', value: formatNumber(data.calf_circum_cm, { maximumFractionDigits: 1 }), unit: 'cm', classification: getClassification('calf_circum_cm', data.calf_circum_cm) },
        { labelKey: 'cc_bmi_index',     value: formatNumber(data.cc_bmi_index,   { maximumFractionDigits: 2 }), unit: '',   classification: getClassification('cc_bmi_index', data.cc_bmi_index) },
    ];

    // SFT tests — always present
    const sftCore: ResultDisplay[] = [
        { labelKey: 'handgrip_strength', value: formatNumber(data.grip_kgf,       { maximumFractionDigits: 1 }), unit: 'kgf', classification: getClassification('grip_kgf', data.grip_kgf),             countForProfile: true },
        { labelKey: 'balance',           value: formatNumber(data.balance_s,      { maximumFractionDigits: 1 }), unit: 's',   classification: getClassification('balance_s', data.balance_s),           countForProfile: true },
        { labelKey: 'flexibility',       value: formatNumber(data.back_scratch_cm, { maximumFractionDigits: 1 }), unit: 'cm', classification: getClassification('back_scratch_cm', data.back_scratch_cm), countForProfile: true },
    ];

    // SFT tests — optional (only shown when value was entered)
    const optionalRows: ResultDisplay[] = [];

    if ((data.up_and_go_seconds ?? 0) > 0) {
        optionalRows.push({
            labelKey: 'up_and_go',
            value: formatNumber(data.up_and_go_seconds!, { maximumFractionDigits: 1 }),
            unit: 's',
            classification: classifyMetric('up_and_go_seconds', data.up_and_go_seconds) ?? 'classification_average',
            countForProfile: true,
        });
    }

    if ((data.six_min_walk_meters ?? 0) > 0) {
        optionalRows.push({
            labelKey: 'six_min_walk',
            value: formatNumber(data.six_min_walk_meters!, { maximumFractionDigits: 0 }),
            unit: 'm',
            classification: classifyMetric('six_min_walk_meters', data.six_min_walk_meters) ?? 'classification_average',
            countForProfile: true,
        });
    }

    if ((data.chair_stand_reps ?? 0) > 0) {
        optionalRows.push({
            labelKey: 'chair_stand_test',
            value: formatNumber(data.chair_stand_reps!, { maximumFractionDigits: 0 }),
            unit: 'rep',
            classification: classifyMetric('chair_stand_reps', data.chair_stand_reps) ?? 'classification_average',
            countForProfile: true,
        });
    }

    if ((data.arm_curl_reps ?? 0) > 0) {
        optionalRows.push({
            labelKey: 'arm_curl_test',
            value: formatNumber(data.arm_curl_reps!, { maximumFractionDigits: 0 }),
            unit: 'rep',
            classification: classifyMetric('arm_curl_reps', data.arm_curl_reps) ?? 'classification_average',
            countForProfile: true,
        });
    }

    // chair_sit_reach_cm: 0 IS a valid score, so always include if the field is present
    if (data.chair_sit_reach_cm !== undefined && data.chair_sit_reach_cm !== null) {
        optionalRows.push({
            labelKey: 'chair_sit_reach',
            value: formatNumber(data.chair_sit_reach_cm, { maximumFractionDigits: 1 }),
            unit: 'cm',
            classification: classifyMetric('chair_sit_reach_cm', data.chair_sit_reach_cm) ?? 'classification_average',
            countForProfile: true,
        });
    }

    // ── Profile badge ─────────────────────────────────────────────────────────

    const profileDescKey = `profile_desc_${profile.profileKey.replace('profile_', '')}` as keyof I18nKeys;

    // ── Generate plan ─────────────────────────────────────────────────────────

    const effectiveLevel = overrideLevel ?? profile.level;

    const handleGeneratePlan = () => {
        if (!effectiveParticipantId) return;
        setGeneratingPlan(true);
        const plan = generateTrainingPlan(data, overrideLevel ?? undefined);
        updateParticipant(effectiveParticipantId, { training_plan: plan });
        navigate(returnPath);
    };

    // ─────────────────────────────────────────────────────────────────────────

    const ResultRow: React.FC<{ result: ResultDisplay }> = ({ result }) => (
        <div className="grid grid-cols-3 items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <span className="text-md font-semibold text-slate-700 col-span-1">{t(result.labelKey)}</span>
            <span className="text-xl font-bold text-primary-dark text-center col-span-1">
                {result.value} <span className="text-sm font-normal text-slate-500">{result.unit}</span>
            </span>
            <span className={`text-center font-semibold py-1 px-2 rounded-full text-xs ${classificationColors[result.classification]} col-span-1`}>
                {t(result.classification)}
            </span>
        </div>
    );

    return (
        <div className="bg-background min-h-screen">
            <Header />
            <main className="p-4 sm:p-6 md:p-8 flex justify-center">
                <Card className="max-w-4xl w-full">
                    <h1 className="text-3xl font-bold text-primary-dark mb-2">{t('assessment_summary_title')}</h1>
                    <p className="text-lg text-slate-600 mb-6">{t('assessment_summary_subtitle')}</p>

                    {/* ── Fitness Profile Badge ──────────────────────────────── */}
                    <div className={`border-2 rounded-xl p-5 mb-8 ${profileColors[profile.profileKey]}`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">
                                    {t('fitness_profile_title' as any)}
                                </p>
                                <p className="text-2xl font-bold">
                                    {t(profile.profileKey as any)} — {t('level' as any)} {effectiveLevel}
                                    <span className="text-base font-normal opacity-75 ml-2">
                                        ({(t('load_pct_label' as any) as string).replace('{pct}', String(LEVEL_LOAD_PCT[effectiveLevel]))})
                                    </span>
                                </p>
                            </div>
                            <div className="text-right text-sm">
                                <p>{(t('profile_good_count' as any) as string).replace('{count}', String(profile.goodCount))}</p>
                                <p>{(t('profile_attention_count' as any) as string).replace('{count}', String(profile.attentionCount))}</p>
                                <p className="opacity-60">{(t('profile_tests_evaluated' as any) as string).replace('{count}', String(profile.totalTests))}</p>
                            </div>
                        </div>
                        <p className="mt-3 text-sm opacity-80">{t(profileDescKey as any)}</p>

                        {/* Level override — researcher/admin only, only when plan not yet generated */}
                        {isResearcher && !hasPlan && (
                            <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                                <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">
                                    {t('override_level_label' as any)}
                                </p>
                                <div className="flex gap-2">
                                    {([1, 2, 3] as const).map(lvl => (
                                        <button
                                            key={lvl}
                                            onClick={() => setOverrideLevel(lvl === profile.level && overrideLevel === null ? null : lvl)}
                                            className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-all ${
                                                effectiveLevel === lvl
                                                    ? 'bg-white bg-opacity-80 border-current shadow'
                                                    : 'bg-transparent border-current border-opacity-30 opacity-50 hover:opacity-80'
                                            }`}
                                        >
                                            {t('level' as any)} {lvl}
                                        </button>
                                    ))}
                                </div>
                                {overrideLevel !== null && overrideLevel !== profile.level && (
                                    <p className="text-xs mt-2 font-medium opacity-80">
                                        {(t('override_level_note' as any) as string)
                                            .replace('{selected}',     String(overrideLevel))
                                            .replace('{selectedPct}',  String(LEVEL_LOAD_PCT[overrideLevel]))
                                            .replace('{computed}',     String(profile.level))
                                            .replace('{computedPct}',  String(LEVEL_LOAD_PCT[profile.level]))}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── SFT Results ────────────────────────────────────────── */}
                    <h2 className="text-lg font-bold text-slate-700 mb-3">{t('classification')}</h2>

                    {/* Core SFT tests */}
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                        {sftCore.map(r => <ResultRow key={r.labelKey} result={r} />)}
                        {optionalRows.map(r => <ResultRow key={r.labelKey} result={r} />)}
                    </div>

                    {/* Body composition — info only */}
                    <details className="mt-2 mb-6">
                        <summary className="text-sm text-slate-500 cursor-pointer select-none hover:text-slate-700">
                            {t('weight')} / {t('bmi')} / {t('calf_circumference')}
                        </summary>
                        <div className="grid md:grid-cols-2 gap-3 mt-3">
                            {bodyResults.map(r => <ResultRow key={r.labelKey} result={r} />)}
                        </div>
                    </details>

                    {/* ── Action buttons ─────────────────────────────────────── */}
                    {isResearcher ? (
                        hasPlan ? (
                            <div className="mt-6">
                                <p className="text-sm text-slate-500 text-center mb-4">
                                    {(() => {
                                        const planLevel = (participant?.training_plan?.[0]?.level ?? profile.level) as 1 | 2 | 3;
                                        return (t('plan_already_generated' as any) as string)
                                            .replace('{level}', String(planLevel))
                                            .replace('{pct}',   String(LEVEL_LOAD_PCT[planLevel]));
                                    })()}
                                </p>
                                <Button onClick={() => navigate(returnPath)} className="w-full">
                                    {t('continue_to_dashboard')}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={handleGeneratePlan}
                                className="w-full mt-6"
                                disabled={generatingPlan}
                            >
                                {t('generate_plan_button' as any)}
                            </Button>
                        )
                    ) : (
                        <Button onClick={() => navigate(returnPath)} className="w-full mt-6">
                            {t('continue_to_dashboard')}
                        </Button>
                    )}
                </Card>
            </main>
        </div>
    );
};

export default AssessmentSummaryPage;
