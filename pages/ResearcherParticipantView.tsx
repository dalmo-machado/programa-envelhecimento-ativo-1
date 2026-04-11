
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Award, ChevronLeft, Shield } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { Assessment } from '../types';
import { trainingPrograms } from '../services/trainingData';
import { getCurrentBelt } from '../utils/gamification';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Header from '../components/Header';

const metrics: (keyof Assessment)[] = [
  'grip_kgf', 'balance_s', 'back_scratch_cm', 'bmi', 'cc_bmi_index', 'calf_circum_cm',
];

const metricTranslationKeys: Record<string, string> = {
  grip_kgf: 'handgrip_strength',
  balance_s: 'balance',
  back_scratch_cm: 'flexibility',
  bmi: 'bmi',
  cc_bmi_index: 'cc_bmi_index',
  calf_circum_cm: 'calf_circumference',
  weight_kg: 'weight',
  height_cm: 'height',
};

const ResearcherParticipantView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, formatNumber, formatDate } = useLocalization();
  const { participants } = useParticipantData();
  const [selectedMetric, setSelectedMetric] = useState<keyof Assessment>('grip_kgf');

  const participant = participants.find(p => p.study_id === id);

  if (!participant) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="p-8">
          <Card>
            <p className="text-slate-600 mb-4">Participante não encontrado.</p>
            <Button onClick={() => navigate('/dashboard')} variant="ghost">
              {t('back_to_dashboard')}
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  const totalSessions = 24;
  const adherence = (participant.sessions_completed / totalSessions) * 100;
  const currentBelt = getCurrentBelt(participant.sessions_completed);

  const birthDate = new Date(participant.birth_date || '1950-01-01');
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

  const getSexLabel = (sex: string) => {
    if (sex === 'M') return t('sex_m' as any);
    if (sex === 'F') return t('sex_f' as any);
    return t('sex_other' as any);
  };

  const chartData = participant.assessments.map(a => ({
    date: formatDate(new Date(a.date), { month: 'short', day: 'numeric' }),
    value: a.data[selectedMetric],
  }));
  const firstAssessment = participant.assessments[0];

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 md:p-8">

        {/* Top bar: back button | action buttons | read-only badge */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-primary-dark py-2 px-3 text-base"
          >
            <ChevronLeft size={18} />
            {t('back_to_dashboard')}
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="py-2 px-4 text-base"
              onClick={() => navigate('/assessment/new', { state: { participantId: participant.study_id } })}
            >
              {t('register_assessment')}
            </Button>
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
              <Shield size={12} />
              {t('readonly_badge')}
            </span>
          </div>
        </div>

        <div className="space-y-8">

          {/* Participant identity */}
          <div>
            <h1 className="text-4xl font-bold text-primary-dark">{participant.name}</h1>
            <p className="text-lg text-slate-600 mt-1">
              {participant.study_id} • {age} {t('years_old' as any)} • {getSexLabel(participant.sex)} • {participant.site}
            </p>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-6">
            <Card title={t('current_belt')} className="flex flex-col items-center justify-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 mb-2 ${currentBelt.colorClass}`}>
                <Award size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{t(currentBelt.key)}</h3>
            </Card>
            <Card title={t('sessions_completed')} className="flex flex-col justify-center">
              <p className="text-5xl font-bold text-secondary">
                {participant.sessions_completed}
                <span className="text-2xl text-slate-500"> / {totalSessions}</span>
              </p>
            </Card>
            <Card title={t('adherence_rate')} className="flex flex-col justify-center">
              <p className="text-5xl font-bold text-secondary">
                {formatNumber(adherence, { maximumFractionDigits: 0 })}
                <span className="text-2xl text-slate-500">%</span>
              </p>
            </Card>
          </div>

          {/* Progress chart */}
          <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-2xl font-bold text-primary-dark">{t('my_progress_title')}</h2>
              {chartData.length > 0 && (
                <select
                  value={selectedMetric}
                  onChange={e => setSelectedMetric(e.target.value as keyof Assessment)}
                  className="p-2 rounded-md border-slate-300 border bg-white text-slate-700 shadow-sm"
                  aria-label={t('select_metric')}
                >
                  {metrics.map(mk => (
                    <option key={mk} value={mk}>{t(metricTranslationKeys[mk] as any)}</option>
                  ))}
                </select>
              )}
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      formatNumber(value, { maximumFractionDigits: 1 }),
                      t(metricTranslationKeys[selectedMetric] as any),
                    ]}
                    labelFormatter={(label) => {
                      if (!firstAssessment) return label;
                      const initialValue = firstAssessment.data[selectedMetric];
                      return label;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={t(metricTranslationKeys[selectedMetric] as any)}
                    stroke="#005f73"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 py-8 text-center">{t('no_assessments_yet')}</p>
            )}
          </Card>

          {/* Assessment history */}
          {participant.assessments.length > 0 && (
            <Card title={t('assessment_history_title')}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 uppercase">
                    <tr>
                      <th className="p-3">{t('researcher_table_last_assessment')}</th>
                      <th className="p-3 text-center">{t('researcher_table_grip')}</th>
                      <th className="p-3 text-center">{t('researcher_table_balance')}</th>
                      <th className="p-3 text-center">{t('researcher_table_flexibility')}</th>
                      <th className="p-3 text-center">{t('researcher_table_bmi')}</th>
                      <th className="p-3 text-center">{t('weight')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {participant.assessments.map((assessment, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-primary-dark">
                          {formatDate(new Date(assessment.date), { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="p-3 text-center">{assessment.data.grip_kgf}</td>
                        <td className="p-3 text-center">{assessment.data.balance_s}</td>
                        <td className="p-3 text-center">{assessment.data.back_scratch_cm}</td>
                        <td className="p-3 text-center">{formatNumber(assessment.data.bmi, { maximumFractionDigits: 1 })}</td>
                        <td className="p-3 text-center">{assessment.data.weight_kg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Training plan grid */}
          {participant.training_plan.length > 0 && (
            <Card title={t('my_training_plan_title')}>
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {participant.training_plan.map((session, i) => {
                  const isCompleted = i < participant.sessions_completed;
                  const isNext = i === participant.sessions_completed;
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-center text-xs border ${
                        isCompleted
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : isNext
                          ? 'bg-secondary/10 border-secondary text-secondary font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <p className="font-bold">{i + 1}</p>
                      <p className="truncate">{t(trainingPrograms[session.sessionType].titleKey)}</p>
                      <p>Nv {session.level}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
};

export default ResearcherParticipantView;
