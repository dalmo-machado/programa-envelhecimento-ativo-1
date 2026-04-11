
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { useUserRole } from '../context/UserRoleContext';
import { Assessment, AssessmentRecord, Participant } from '../types';
import { generateTrainingPlan } from '../services/trainingPlanner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Header from '../components/Header';

interface FormData {
    grip_kgf: string;
    balance_s: string;
    back_scratch_cm: string;
    weight_kg: string;
    height_cm: string;
    calf_circum_cm: string;
}

const InputField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, unit: string}> = ({label, name, value, onChange, type = "number", unit}) => (
    <div>
        <label className="block text-lg font-semibold text-slate-700 mb-2">{label}</label>
        <div className="flex items-center">
            <input 
                type={type} 
                name={name}
                value={value}
                onChange={onChange}
                className="w-full text-lg p-3 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-primary"
                step="0.1"
            />
            <span className="ml-3 text-lg text-slate-500">{unit}</span>
        </div>
    </div>
);

const CalculatedField: React.FC<{label: string, value: string | number}> = ({label, value}) => (
     <div>
        <label className="block text-lg font-semibold text-slate-700 mb-2">{label}</label>
        <div className="w-full text-lg p-3 border bg-slate-100 border-slate-300 rounded-lg">
            {value}
        </div>
    </div>
);

const AssessmentPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, formatNumber } = useLocalization();
    const { participants, updateParticipant } = useParticipantData();
    const { participantId } = useUserRole();

    // When navigated from ResearcherParticipantView, a participantId is passed via
    // router state so the researcher can register an assessment for a specific participant.
    const preselectedId: string | undefined = (location.state as any)?.participantId;
    const effectiveParticipantId = preselectedId ?? participantId;

    const [formData, setFormData] = useState<FormData>({
        grip_kgf: '', balance_s: '', back_scratch_cm: '', weight_kg: '', height_cm: '', calf_circum_cm: ''
    });
    const [bmi, setBmi] = useState<number | null>(null);
    const [ccBmiIndex, setCcBmiIndex] = useState<number | null>(null);

    useEffect(() => {
        const weight = parseFloat(formData.weight_kg);
        const height = parseFloat(formData.height_cm);
        const calf = parseFloat(formData.calf_circum_cm);

        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const calculatedBmi = weight / (heightInMeters * heightInMeters);
            setBmi(calculatedBmi);

            if (calf > 0) {
                setCcBmiIndex(calf / calculatedBmi);
            } else {
                setCcBmiIndex(null);
            }
        } else {
            setBmi(null);
            setCcBmiIndex(null);
        }
    }, [formData.weight_kg, formData.height_cm, formData.calf_circum_cm]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = () => {
        if (!effectiveParticipantId) return;

        const participant = participants.find(p => p.study_id === effectiveParticipantId);
        if (!participant) return;

        const assessmentData: Assessment = {
            grip_kgf: parseFloat(formData.grip_kgf) || 0,
            balance_s: parseFloat(formData.balance_s) || 0,
            back_scratch_cm: parseFloat(formData.back_scratch_cm) || 0,
            weight_kg: parseFloat(formData.weight_kg) || 0,
            height_cm: parseFloat(formData.height_cm) || 0,
            calf_circum_cm: parseFloat(formData.calf_circum_cm) || 0,
            bmi: bmi || 0,
            cc_bmi_index: ccBmiIndex || 0,
            whoqol_total: 0, // Placeholder for WHOQOL
        };
        
        const newRecord: AssessmentRecord = {
            date: new Date().toISOString(),
            data: assessmentData
        };

        const updatedAssessments = [...participant.assessments, newRecord];
        
        let participantUpdate: Partial<Participant> = {
            assessments: updatedAssessments,
        };

        // If this is the first assessment, generate the training plan
        if (participant.assessments.length === 0) {
            participantUpdate.training_plan = generateTrainingPlan(assessmentData);
        }
        
        updateParticipant(effectiveParticipantId, participantUpdate);

        alert(t('assessment_saved_success'));
        navigate('/assessment/summary', preselectedId ? { state: { participantId: preselectedId } } : undefined);
    }

    const isFormValid = Object.values(formData).every(value => typeof value === 'string' && value.trim() !== '');

    return (
        <div className="bg-background min-h-screen">
            <Header />
            <main className="p-4 sm:p-6 md:p-8 flex justify-center">
                <Card className="max-w-3xl w-full" title={t('assessment_title')}>
                     <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                        <InputField label={t('handgrip_strength')} name="grip_kgf" value={formData.grip_kgf} onChange={handleChange} unit="kgf" />
                        <InputField label={t('balance')} name="balance_s" value={formData.balance_s} onChange={handleChange} unit="s" />
                        <InputField label={t('flexibility')} name="back_scratch_cm" value={formData.back_scratch_cm} onChange={handleChange} unit="cm" />
                        <InputField label={t('weight')} name="weight_kg" value={formData.weight_kg} onChange={handleChange} unit="kg" />
                        <InputField label={t('height')} name="height_cm" value={formData.height_cm} onChange={handleChange} unit="cm" />
                        <InputField label={t('calf_circumference')} name="calf_circum_cm" value={formData.calf_circum_cm} onChange={handleChange} unit="cm" />

                        <CalculatedField label={t('bmi')} value={bmi ? formatNumber(bmi, {maximumFractionDigits: 2}) : '-'} />
                        <CalculatedField label={t('cc_bmi_index')} value={ccBmiIndex ? formatNumber(ccBmiIndex, {maximumFractionDigits: 2}) : '-'} />
                    </div>
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