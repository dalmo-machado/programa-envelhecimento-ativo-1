import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { useUserRole } from '../context/UserRoleContext';
import { Assessment } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Header from '../components/Header';
import { I18nKeys } from '../localization/es';

type ClassificationKey = 'classification_good' | 'classification_average' | 'classification_attention';

const getClassification = (metric: keyof Assessment, value: number): ClassificationKey => {
  switch (metric) {
    case 'grip_kgf':
      if (value >= 30) return 'classification_good';
      if (value >= 20) return 'classification_average';
      return 'classification_attention';
    case 'balance_s':
      if (value >= 20) return 'classification_good';
      if (value >= 10) return 'classification_average';
      return 'classification_attention';
    case 'back_scratch_cm':
      if (value > -2) return 'classification_good';
      if (value > -10) return 'classification_average';
      return 'classification_attention';
    case 'bmi':
        if (value >= 18.5 && value < 25) return 'classification_good';
        if (value >= 25 && value < 30) return 'classification_average';
        return 'classification_attention';
    case 'cc_bmi_index':
        if (value >= 1.35) return 'classification_good';
        if (value >= 1.20) return 'classification_average';
        return 'classification_attention';
    // FIX: Add classification logic for calf circumference.
    case 'calf_circum_cm':
        if (value >= 34) return 'classification_good';
        if (value >= 31) return 'classification_average';
        return 'classification_attention';
    default:
      return 'classification_average';
  }
};

const classificationColors: Record<ClassificationKey, string> = {
    'classification_good': 'bg-green-100 text-green-800',
    'classification_average': 'bg-yellow-100 text-yellow-800',
    'classification_attention': 'bg-red-100 text-red-800',
}

interface ResultDisplay {
    labelKey: keyof I18nKeys;
    value: string;
    unit: string;
    classification: ClassificationKey;
}

const AssessmentSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, formatNumber } = useLocalization();
  const { participants } = useParticipantData();
  const { participantId } = useUserRole();

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
  const results: ResultDisplay[] = [
      { labelKey: 'handgrip_strength', value: formatNumber(data.grip_kgf, {maximumFractionDigits: 1}), unit: 'kgf', classification: getClassification('grip_kgf', data.grip_kgf) },
      { labelKey: 'balance', value: formatNumber(data.balance_s, {maximumFractionDigits: 1}), unit: 's', classification: getClassification('balance_s', data.balance_s) },
      { labelKey: 'flexibility', value: formatNumber(data.back_scratch_cm, {maximumFractionDigits: 1}), unit: 'cm', classification: getClassification('back_scratch_cm', data.back_scratch_cm) },
      { labelKey: 'weight', value: formatNumber(data.weight_kg, {maximumFractionDigits: 1}), unit: 'kg', classification: getClassification('weight_kg', data.weight_kg) },
      { labelKey: 'height', value: formatNumber(data.height_cm, {maximumFractionDigits: 0}), unit: 'cm', classification: getClassification('height_cm', data.height_cm) },
      { labelKey: 'bmi', value: formatNumber(data.bmi, {maximumFractionDigits: 1}), unit: '', classification: getClassification('bmi', data.bmi) },
      // FIX: Use 'calf_circum_cm' (a valid key of Assessment) instead of 'calf_circumference'.
      { labelKey: 'calf_circumference', value: formatNumber(data.calf_circum_cm, {maximumFractionDigits: 1}), unit: 'cm', classification: getClassification('calf_circum_cm', data.calf_circum_cm) },
      { labelKey: 'cc_bmi_index', value: formatNumber(data.cc_bmi_index, {maximumFractionDigits: 2}), unit: '', classification: getClassification('cc_bmi_index', data.cc_bmi_index) },
  ];

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 md:p-8 flex justify-center">
        <Card className="max-w-4xl w-full">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">{t('assessment_summary_title')}</h1>
          <p className="text-lg text-slate-600 mb-8">{t('assessment_summary_subtitle')}</p>

          <div className="grid md:grid-cols-2 gap-4">
            {results.map(result => (
                <div key={result.labelKey} className="grid grid-cols-3 items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <span className="text-md font-semibold text-slate-700 col-span-1">{t(result.labelKey)}</span>
                    <span className="text-xl font-bold text-primary-dark text-center col-span-1">{result.value} <span className="text-sm font-normal text-slate-500">{result.unit}</span></span>
                    <span className={`text-center font-semibold py-1 px-2 rounded-full text-xs ${classificationColors[result.classification]} col-span-1`}>
                        {t(result.classification)}
                    </span>
                </div>
            ))}
          </div>

          <Button onClick={() => navigate(returnPath)} className="w-full mt-10">
            {t('continue_to_dashboard')}
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default AssessmentSummaryPage;
