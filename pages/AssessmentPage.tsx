
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { useUserRole } from '../context/UserRoleContext';
import { Assessment, AssessmentMoment, AssessmentRecord, Participant } from '../types';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Header from '../components/Header';

interface FormData {
    // Station 1 — Body Composition
    weight_kg: string;
    height_cm: string;
    calf_circum_cm: string;
    cintura_cm: string;
    quadril_cm: string;
    gordura_percent: string;
    // Station 2 — Force and Agility
    grip_kgf: string;
    handgrip_nondominant_kgf: string;
    chair_stand_reps: string;
    arm_curl_reps: string;
    chair_sit_reach_cm: string;
    up_and_go_seconds: string;
    balance_s: string;
    back_scratch_cm: string;
    // Station 3 — Aerobic Capacity
    six_min_walk_meters: string;
}

// ─── Physiological range limits ───────────────────────────────────────────────
// Values outside these ranges block saving and highlight the offending field.
// Ranges are intentionally generous — they only catch obvious data-entry errors
// (e.g. sit-and-reach = 1000 cm, TUG = 0.5 s).
const FIELD_RANGES: Record<string, { min: number; max: number; label: string }> = {
    weight_kg:                 { min: 30,  max: 200,  label: 'Peso' },
    height_cm:                 { min: 100, max: 220,  label: 'Altura' },
    calf_circum_cm:            { min: 15,  max: 65,   label: 'Panturrilha' },
    cintura_cm:                { min: 40,  max: 200,  label: 'Cintura' },
    quadril_cm:                { min: 50,  max: 200,  label: 'Quadril' },
    gordura_percent:           { min: 3,   max: 70,   label: '% Gordura' },
    grip_kgf:                  { min: 1,   max: 100,  label: 'Preensão dominante' },
    handgrip_nondominant_kgf:  { min: 1,   max: 100,  label: 'Preensão não-dominante' },
    chair_stand_reps:          { min: 0,   max: 50,   label: 'Sentar e Levantar (reps)' },
    arm_curl_reps:             { min: 0,   max: 50,   label: 'Rosca Bíceps (reps)' },
    chair_sit_reach_cm:        { min: -60, max: 60,   label: 'Chair Sit-and-Reach (cm)' },
    up_and_go_seconds:         { min: 3,   max: 300,  label: 'TUG (s)' },
    balance_s:                 { min: 0,   max: 120,  label: 'Equilíbrio (s)' },
    back_scratch_cm:           { min: -80, max: 50,   label: 'Back Scratch (cm)' },
    six_min_walk_meters:       { min: 0,   max: 1000, label: 'TC6 (m)' },
};

const InputField: React.FC<{
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    unit: string;
    step?: string;
    hasError?: boolean;
}> = ({ label, name, value, onChange, type = 'number', unit, step = '0.1', hasError = false }) => (
    <div>
        <label className="block text-lg font-semibold text-slate-700 mb-2">{label}</label>
        <div className="flex items-center">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full text-lg p-3 border bg-white rounded-lg focus:ring-2 focus:outline-none ${
                    hasError
                        ? 'border-red-500 focus:ring-red-300 bg-red-50'
                        : 'border-slate-300 focus:ring-primary'
                }`}
                step={step}
            />
            <span className="ml-3 text-lg text-slate-500">{unit}</span>
        </div>
    </div>
);

const CalculatedField: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div>
        <label className="block text-lg font-semibold text-slate-700 mb-2">{label}</label>
        <div className="w-full text-lg p-3 border bg-slate-100 border-slate-300 rounded-lg">
            {value}
        </div>
    </div>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="col-span-full mt-4 mb-2">
        <h3 className="text-xl font-bold text-primary-dark border-b-2 border-primary pb-2">{title}</h3>
    </div>
);

const AssessmentPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, formatNumber } = useLocalization();
    const { participants, updateParticipant } = useParticipantData();
    const { participantId } = useUserRole();

    const preselectedId: string | undefined = (location.state as any)?.participantId;
    const effectiveParticipantId = preselectedId ?? participantId;

    const participant = participants.find(p => p.study_id === effectiveParticipantId);

    const participantAge = useMemo(() => {
        if (!participant?.birth_date) return 0;
        const birth = new Date(participant.birth_date);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    }, [participant?.birth_date]);

    const [formData, setFormData] = useState<FormData>({
        weight_kg: '',
        height_cm: '',
        calf_circum_cm: '',
        cintura_cm: '',
        quadril_cm: '',
        gordura_percent: '',
        grip_kgf: '',
        handgrip_nondominant_kgf: '',
        chair_stand_reps: '',
        arm_curl_reps: '',
        chair_sit_reach_cm: '',
        up_and_go_seconds: '',
        balance_s: '',
        back_scratch_cm: '',
        six_min_walk_meters: '',
    });

    const [bmi, setBmi] = useState<number | null>(null);
    const [ccBmiIndex, setCcBmiIndex] = useState<number | null>(null);
    const [rcq, setRcq] = useState<number | null>(null);
    const [sixMinWalkPredicted, setSixMinWalkPredicted] = useState<number | null>(null);
    const [sixMinWalkPercent, setSixMinWalkPercent] = useState<number | null>(null);
    const [rangeErrors, setRangeErrors] = useState<Record<string, string>>({});
    // Measurement point. Required: without it the assessment cannot be paired
    // pre/post later, and the date alone does not resolve it.
    const [moment, setMoment] = useState<AssessmentMoment | ''>('');

    useEffect(() => {
        const weight = parseFloat(formData.weight_kg);
        const height = parseFloat(formData.height_cm);
        const calf = parseFloat(formData.calf_circum_cm);
        const cintura = parseFloat(formData.cintura_cm);
        const quadril = parseFloat(formData.quadril_cm);

        if (weight > 0 && height > 0) {
            const h = height / 100;
            const calculatedBmi = weight / (h * h);
            setBmi(calculatedBmi);
            setCcBmiIndex(calf > 0 ? calf / calculatedBmi : null);
        } else {
            setBmi(null);
            setCcBmiIndex(null);
        }

        setRcq(cintura > 0 && quadril > 0 ? cintura / quadril : null);
    }, [formData.weight_kg, formData.height_cm, formData.calf_circum_cm, formData.cintura_cm, formData.quadril_cm]);

    useEffect(() => {
        const sixMinWalk = parseFloat(formData.six_min_walk_meters);
        const weight = parseFloat(formData.weight_kg);
        const height = parseFloat(formData.height_cm);

        if (sixMinWalk > 0 && weight > 0 && height > 0 && participantAge > 0 && participant) {
            let predicted: number;
            if (participant.sex === 'M') {
                predicted = (7.57 * height) - (5.02 * participantAge) - (1.76 * weight) - 309;
            } else {
                predicted = (2.11 * height) - (2.29 * weight) - (5.78 * participantAge) + 667;
            }
            if (predicted > 0) {
                setSixMinWalkPredicted(predicted);
                setSixMinWalkPercent((sixMinWalk / predicted) * 100);
            } else {
                setSixMinWalkPredicted(null);
                setSixMinWalkPercent(null);
            }
        } else {
            setSixMinWalkPredicted(null);
            setSixMinWalkPercent(null);
        }
    }, [formData.six_min_walk_meters, formData.weight_kg, formData.height_cm, participantAge, participant]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field as soon as the user starts correcting it
        if (rangeErrors[name]) {
            setRangeErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
        }
    };

    /** Returns a map of { fieldName → errorMessage } for values outside physiological ranges. */
    const validateRanges = (): Record<string, string> => {
        const errors: Record<string, string> = {};
        for (const [field, range] of Object.entries(FIELD_RANGES)) {
            const raw = (formData as Record<string, string>)[field];
            if (!raw || raw.trim() === '') continue; // empty handled by isFormValid
            const num = parseFloat(raw);
            if (isNaN(num)) continue;
            if (num < range.min || num > range.max) {
                errors[field] = `${range.label}: ${num} fora do intervalo [${range.min}, ${range.max}]`;
            }
        }
        return errors;
    };

    const handleSubmit = () => {
        if (!effectiveParticipantId || !participant || !moment) return;

        // Range validation — block save if any field is physiologically impossible
        const errors = validateRanges();
        setRangeErrors(errors);
        if (Object.keys(errors).length > 0) return;

        const assessmentData: Assessment = {
            // Station 1
            weight_kg: parseFloat(formData.weight_kg) || 0,
            height_cm: parseFloat(formData.height_cm) || 0,
            calf_circum_cm: parseFloat(formData.calf_circum_cm) || 0,
            bmi: bmi || 0,
            cc_bmi_index: ccBmiIndex || 0,
            cintura_cm: parseFloat(formData.cintura_cm) || 0,
            quadril_cm: parseFloat(formData.quadril_cm) || 0,
            gordura_percent: parseFloat(formData.gordura_percent) || 0,
            rcq: rcq || 0,
            // Station 2
            grip_kgf: parseFloat(formData.grip_kgf) || 0,
            handgrip_nondominant_kgf: parseFloat(formData.handgrip_nondominant_kgf) || 0,
            chair_stand_reps: parseInt(formData.chair_stand_reps) || 0,
            arm_curl_reps: parseInt(formData.arm_curl_reps) || 0,
            chair_sit_reach_cm: parseFloat(formData.chair_sit_reach_cm) || 0,
            up_and_go_seconds: parseFloat(formData.up_and_go_seconds) || 0,
            balance_s: parseFloat(formData.balance_s) || 0,
            back_scratch_cm: parseFloat(formData.back_scratch_cm) || 0,
            // Station 3
            six_min_walk_meters: parseFloat(formData.six_min_walk_meters) || 0,
            six_min_walk_predicted: sixMinWalkPredicted || 0,
            six_min_walk_percent: sixMinWalkPercent || 0,
        };

        const newRecord: AssessmentRecord = {
            date: new Date().toISOString(),
            moment,
            data: assessmentData,
        };

        const updatedAssessments = [...participant.assessments, newRecord];

        // Training plan is now generated on AssessmentSummaryPage after the
        // assessor reviews the fitness profile. Auto-regeneration in
        // ParticipantDataContext acts as a safety-net for participants who
        // leave the summary page before confirming.
        const participantUpdate: Partial<Participant> = { assessments: updatedAssessments };

        updateParticipant(effectiveParticipantId, participantUpdate);
        alert(t('assessment_saved_success'));
        navigate('/assessment/summary', preselectedId ? { state: { participantId: preselectedId } } : undefined);
    };

    const isFormValid = moment !== ''
        && Object.values(formData).every(value => typeof value === 'string' && value.trim() !== '');

    return (
        <div className="bg-background min-h-screen">
            <Header />
            <main className="p-4 sm:p-6 md:p-8 flex justify-center">
                <Card className="max-w-3xl w-full" title={t('assessment_title')}>
                    {/* ── Momento da avaliação — obrigatório ── */}
                    <div className="mb-6 p-4 rounded-lg border-2 border-secondary bg-secondary/5">
                        <p className="text-sm font-bold text-primary-dark mb-1">
                            {t('assessment_moment_label' as any)}
                        </p>
                        <p className="text-xs text-slate-600 mb-3">{t('assessment_moment_help' as any)}</p>
                        <div className="flex flex-wrap gap-2">
                            {(['PRE', 'POS', 'SEG'] as const).map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMoment(m)}
                                    className={`flex-1 min-w-[8rem] py-2 px-3 rounded-lg font-bold text-sm border-2 transition-all ${
                                        moment === m
                                            ? 'bg-secondary text-white border-secondary shadow'
                                            : 'bg-white text-slate-600 border-slate-300 hover:border-secondary'
                                    }`}
                                >
                                    {t(`assessment_moment_${m.toLowerCase()}` as any)}
                                </button>
                            ))}
                        </div>
                        {moment === '' && (
                            <p className="text-xs text-amber-700 font-medium mt-2">
                                {t('assessment_moment_required' as any)}
                            </p>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">

                        {/* ── ESTAÇÃO 1 ── */}
                        <SectionHeader title={t('assessment_station1' as any)} />
                        <InputField label={t('weight')} name="weight_kg" value={formData.weight_kg} onChange={handleChange} unit="kg" hasError={!!rangeErrors.weight_kg} />
                        <InputField label={t('height')} name="height_cm" value={formData.height_cm} onChange={handleChange} unit="cm" hasError={!!rangeErrors.height_cm} />
                        <InputField label={t('calf_circumference')} name="calf_circum_cm" value={formData.calf_circum_cm} onChange={handleChange} unit="cm" hasError={!!rangeErrors.calf_circum_cm} />
                        <InputField label={t('waist_circumference' as any)} name="cintura_cm" value={formData.cintura_cm} onChange={handleChange} unit="cm" hasError={!!rangeErrors.cintura_cm} />
                        <InputField label={t('hip_circumference' as any)} name="quadril_cm" value={formData.quadril_cm} onChange={handleChange} unit="cm" hasError={!!rangeErrors.quadril_cm} />
                        <InputField label={t('body_fat_percent' as any)} name="gordura_percent" value={formData.gordura_percent} onChange={handleChange} unit="%" hasError={!!rangeErrors.gordura_percent} />
                        <CalculatedField label={t('bmi')} value={bmi ? formatNumber(bmi, { maximumFractionDigits: 2 }) : '-'} />
                        <CalculatedField label={t('cc_bmi_index')} value={ccBmiIndex ? formatNumber(ccBmiIndex, { maximumFractionDigits: 2 }) : '-'} />
                        <CalculatedField label={t('waist_hip_ratio' as any)} value={rcq ? formatNumber(rcq, { maximumFractionDigits: 3 }) : '-'} />

                        {/* ── ESTAÇÃO 2 ── */}
                        <SectionHeader title={t('assessment_station2' as any)} />
                        <InputField label={t('handgrip_dominant' as any)} name="grip_kgf" value={formData.grip_kgf} onChange={handleChange} unit="kgf" hasError={!!rangeErrors.grip_kgf} />
                        <InputField label={t('handgrip_nondominant' as any)} name="handgrip_nondominant_kgf" value={formData.handgrip_nondominant_kgf} onChange={handleChange} unit="kgf" hasError={!!rangeErrors.handgrip_nondominant_kgf} />
                        <InputField label={t('chair_stand_test' as any)} name="chair_stand_reps" value={formData.chair_stand_reps} onChange={handleChange} unit="rep" step="1" hasError={!!rangeErrors.chair_stand_reps} />
                        <InputField label={t('arm_curl_test' as any)} name="arm_curl_reps" value={formData.arm_curl_reps} onChange={handleChange} unit="rep" step="1" hasError={!!rangeErrors.arm_curl_reps} />
                        <InputField label={t('chair_sit_reach' as any)} name="chair_sit_reach_cm" value={formData.chair_sit_reach_cm} onChange={handleChange} unit="cm" hasError={!!rangeErrors.chair_sit_reach_cm} />
                        <InputField label={t('up_and_go' as any)} name="up_and_go_seconds" value={formData.up_and_go_seconds} onChange={handleChange} unit="s" hasError={!!rangeErrors.up_and_go_seconds} />
                        <InputField label={t('balance')} name="balance_s" value={formData.balance_s} onChange={handleChange} unit="s" hasError={!!rangeErrors.balance_s} />
                        <InputField label={t('flexibility')} name="back_scratch_cm" value={formData.back_scratch_cm} onChange={handleChange} unit="cm" hasError={!!rangeErrors.back_scratch_cm} />

                        {/* ── ESTAÇÃO 3 ── */}
                        <SectionHeader title={t('assessment_station3' as any)} />
                        <InputField label={t('six_min_walk' as any)} name="six_min_walk_meters" value={formData.six_min_walk_meters} onChange={handleChange} unit="m" hasError={!!rangeErrors.six_min_walk_meters} />
                        <CalculatedField
                            label={t('six_min_walk_predicted' as any)}
                            value={sixMinWalkPredicted ? formatNumber(sixMinWalkPredicted, { maximumFractionDigits: 1 }) + ' m' : '-'}
                        />
                        <CalculatedField
                            label={t('six_min_walk_percent' as any)}
                            value={sixMinWalkPercent ? formatNumber(sixMinWalkPercent, { maximumFractionDigits: 1 }) + ' %' : '-'}
                        />
                    </div>

                    {/* Range validation errors */}
                    {Object.keys(rangeErrors).length > 0 && (
                        <div className="mt-6 bg-red-50 border border-red-300 rounded-lg p-4">
                            <p className="font-bold text-red-800 mb-2">⚠ Valores fora do intervalo fisiológico — corrija antes de salvar:</p>
                            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                {Object.values(rangeErrors).map((msg, i) => (
                                    <li key={i}>{msg}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-8 flex flex-col-reverse sm:flex-row gap-4">
                        <Button onClick={() => navigate(-1)} variant="ghost" className="w-full sm:w-auto">
                            {t('back_button')}
                        </Button>
                        <Button onClick={handleSubmit} className="w-full" disabled={!isFormValid}>
                            {t('save_assessment')}
                        </Button>
                    </div>
                </Card>
            </main>
        </div>
    );
};

export default AssessmentPage;
