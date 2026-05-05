
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Award, ChevronLeft, Shield, Pencil } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { Assessment, Language } from '../types';
import { trainingPrograms } from '../services/trainingData';
import { getCurrentBelt } from '../utils/gamification';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Header from '../components/Header';
import SessionModal from '../components/SessionModal';

// ── Grouped metric dropdown ──────────────────────────────────────────────────

const metricGroups: { labelKey: string; metrics: (keyof Assessment)[] }[] = [
  {
    labelKey: 'metric_group_body_comp',
    metrics: ['bmi', 'rcq', 'gordura_percent', 'calf_circum_cm'],
  },
  {
    labelKey: 'metric_group_strength',
    metrics: ['chair_stand_reps', 'arm_curl_reps', 'grip_kgf', 'handgrip_nondominant_kgf'],
  },
  {
    labelKey: 'metric_group_mobility',
    metrics: ['up_and_go_seconds', 'chair_sit_reach_cm'],
  },
  {
    labelKey: 'metric_group_aerobic',
    metrics: ['six_min_walk_meters', 'six_min_walk_percent'],
  },
];

const metricTranslationKeys: Partial<Record<keyof Assessment, string>> = {
  bmi: 'bmi',
  rcq: 'waist_hip_ratio',
  gordura_percent: 'body_fat_percent',
  calf_circum_cm: 'calf_circumference',
  chair_stand_reps: 'chair_stand_test',
  arm_curl_reps: 'arm_curl_test',
  grip_kgf: 'handgrip_dominant',
  handgrip_nondominant_kgf: 'handgrip_nondominant',
  up_and_go_seconds: 'up_and_go',
  chair_sit_reach_cm: 'chair_sit_reach',
  six_min_walk_meters: 'six_min_walk',
  six_min_walk_percent: 'six_min_walk_percent',
  balance_s: 'balance',
  back_scratch_cm: 'flexibility',
  weight_kg: 'weight',
  height_cm: 'height',
  cc_bmi_index: 'cc_bmi_index',
};

// ── Main component ───────────────────────────────────────────────────────────

const ResearcherParticipantView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, formatNumber, formatDate } = useLocalization();
  const { participants, updateParticipant } = useParticipantData();
  const [selectedMetric, setSelectedMetric] = useState<keyof Assessment>('grip_kgf');
  const [modalSessionIndex, setModalSessionIndex] = useState<number | null>(null);

  // ── Edit participant state ──────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', sex: '', birth_date: '', site: '' });
  const [isSaving, setIsSaving] = useState(false);

  const participant = participants.find(p => p.study_id === id);

  if (!participant) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="p-8">
          <Card>
            <p className="text-slate-600 mb-4">{t('participant_not_found' as any)}</p>
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

  const birthDate = new Date((participant.birth_date || '1950-01-01') + 'T12:00:00Z');
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

  const getSexLabel = (sex: string) => {
    if (sex === 'M') return t('sex_m' as any);
    if (sex === 'F') return t('sex_f' as any);
    return t('sex_other' as any);
  };

  const getSiteLabel = (site: string) => {
    if (site === 'Brazil' || site === 'Brasil' || site === 'BR') return t('country_brazil' as any);
    if (site === 'Spain' || site === 'España' || site === 'ES') return t('country_spain' as any);
    return site;
  };

  const handleEditOpen = () => {
    setEditForm({
      name: participant.name,
      sex: participant.sex,
      birth_date: participant.birth_date,
      site: participant.site,
    });
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim() || !editForm.birth_date) return;
    setIsSaving(true);
    try {
      await updateParticipant(participant.study_id, {
        name: editForm.name.trim(),
        sex: editForm.sex as 'M' | 'F' | 'Other',
        birth_date: editForm.birth_date,
        site: editForm.site as 'Brazil' | 'Spain',
        language: editForm.site === 'Spain' ? Language.ES_ES : Language.PT_BR,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const chartData = participant.assessments.map(a => ({
    date: formatDate(new Date(a.date), { month: 'short', day: 'numeric' }),
    value: a.data[selectedMetric],
  }));

  const modalSession = modalSessionIndex !== null ? participant.training_plan[modalSessionIndex] : null;

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 md:p-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-primary-dark py-2 px-3 text-base"
          >
            <ChevronLeft size={18} />
            {t('back_to_dashboard')}
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="ghost"
              className="flex items-center gap-2 py-2 px-4 text-base text-slate-600"
              onClick={handleEditOpen}
            >
              <Pencil size={16} />
              {t('edit_participant' as any)}
            </Button>
            {participant.assessments.length > 0 && (
              <Button
                variant="ghost"
                className="py-2 px-4 text-base border-2 border-secondary text-secondary hover:bg-secondary/10"
                onClick={() => navigate('/assessment/summary', { state: { participantId: participant.study_id } })}
              >
                {t('view_performance_summary' as any)}
              </Button>
            )}
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
              {participant.study_id} • {age} {t('years_old' as any)} • {getSexLabel(participant.sex)} • {getSiteLabel(participant.site)}
            </p>
          </div>

          {/* Edit participant modal */}
          {isEditing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
              <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl text-slate-800">
                <h3 className="text-xl font-bold mb-5">{t('edit_participant' as any)}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('participant_name' as any)}</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{t('participant_sex' as any)}</label>
                      <select
                        value={editForm.sex}
                        onChange={e => setEditForm(f => ({ ...f, sex: e.target.value }))}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                      >
                        <option value="M">{t('sex_m' as any)}</option>
                        <option value="F">{t('sex_f' as any)}</option>
                        <option value="Other">{t('sex_other' as any)}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{t('site_label' as any)}</label>
                      <select
                        value={editForm.site}
                        onChange={e => setEditForm(f => ({ ...f, site: e.target.value }))}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                      >
                        <option value="Brazil">{t('site_brazil' as any)}</option>
                        <option value="Spain">{t('site_spain' as any)}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t('participant_dob' as any)}</label>
                    <input
                      type="date"
                      value={editForm.birth_date}
                      onChange={e => setEditForm(f => ({ ...f, birth_date: e.target.value }))}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-slate-400 mt-1">{t('birth_date_password_hint' as any)}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    {t('cancel' as any)}
                  </Button>
                  <Button onClick={handleEditSave} disabled={isSaving || !editForm.name.trim()}>
                    {isSaving ? t('saving' as any) : t('save' as any)}
                  </Button>
                </div>
              </div>
            </div>
          )}

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

          {/* Progress chart with grouped dropdown */}
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
                  {metricGroups.map(group => (
                    <optgroup key={group.labelKey} label={t(group.labelKey as any)}>
                      {group.metrics.map(mk => (
                        <option key={mk} value={mk}>
                          {t((metricTranslationKeys[mk] ?? mk) as any)}
                        </option>
                      ))}
                    </optgroup>
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
                      t((metricTranslationKeys[selectedMetric] ?? selectedMetric) as any),
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={t((metricTranslationKeys[selectedMetric] ?? selectedMetric) as any)}
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
                      <th className="p-3 text-center">{t('researcher_table_tc6' as any)}</th>
                      <th className="p-3 text-center">{t('researcher_table_tc6_percent' as any)}</th>
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
                        <td className="p-3 text-center">{assessment.data.six_min_walk_meters ?? '—'}</td>
                        <td className="p-3 text-center">
                          {assessment.data.six_min_walk_percent != null
                            ? formatNumber(assessment.data.six_min_walk_percent, { maximumFractionDigits: 1 }) + ' %'
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Session history */}
          {(participant.session_logs ?? []).length > 0 && (
            <Card title={t('session_history_title' as any)}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 uppercase">
                    <tr>
                      <th className="p-3">{t('session_history_col_session' as any)}</th>
                      <th className="p-3">{t('session_history_col_date' as any)}</th>
                      <th className="p-3">{t('session_history_col_start' as any)}</th>
                      <th className="p-3">{t('session_history_col_end' as any)}</th>
                      <th className="p-3 text-center">{t('session_history_col_duration' as any)}</th>
                      <th className="p-3 text-center">{t('session_history_col_completed' as any)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(participant.session_logs ?? []).map((log, i) => {
                      const startDate = new Date(log.session_start);
                      const endDate = new Date(log.session_end);
                      const formatTime = (d: Date) =>
                        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-primary-dark">{log.session_index + 1}</td>
                          <td className="p-3">
                            {formatDate(startDate, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="p-3">{formatTime(startDate)}</td>
                          <td className="p-3">{formatTime(endDate)}</td>
                          <td className="p-3 text-center">{formatNumber(log.duration_min, { maximumFractionDigits: 1 })}</td>
                          <td className="p-3 text-center">
                            {log.completed
                              ? t('session_history_completed_yes' as any)
                              : t('session_history_completed_no' as any)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Training plan grid — cards are clickable */}
          {participant.training_plan.length > 0 && (
            <Card title={t('my_training_plan_title')}>
              <p className="text-slate-500 text-sm mb-3">{t('click_session_hint' as any)}</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {participant.training_plan.map((session, i) => {
                  const isCompleted = i < participant.sessions_completed;
                  const isNext = i === participant.sessions_completed;
                  return (
                    <button
                      key={i}
                      onClick={() => setModalSessionIndex(i)}
                      className={`p-2 rounded-lg text-center text-xs border transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary ${
                        isCompleted
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : isNext
                          ? 'bg-secondary/10 border-secondary text-secondary font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <p className="font-bold">{i + 1}</p>
                      <p className="truncate">{t((trainingPrograms[session.sessionType]?.titleKey) ?? 'session_type_session1' as any)}</p>
                      <p>{t('level_abbr' as any)} {session.level}</p>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

        </div>
      </main>

      {/* Session detail modal */}
      {modalSessionIndex !== null && modalSession && (
        <SessionModal
          sessionIndex={modalSessionIndex}
          session={modalSession}
          onClose={() => setModalSessionIndex(null)}
        />
      )}
    </div>
  );
};

export default ResearcherParticipantView;
