import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Award } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { UserRole, Assessment } from '../types';
import { trainingPrograms } from '../services/trainingData';
import { getCurrentBelt } from '../utils/gamification';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Header from '../components/Header';

const DashboardPage: React.FC = () => {
    const { role } = useUserRole();

    return (
        <div className="bg-background min-h-screen">
            <Header />
            <main className="p-4 sm:p-6 md:p-8">
                {role === UserRole.PARTICIPANT ? <ParticipantDashboard /> : <ResearcherDashboard />}
            </main>
        </div>
    );
};

const metrics: (keyof Assessment)[] = ['grip_kgf', 'balance_s', 'back_scratch_cm', 'bmi', 'cc_bmi_index', 'calf_circum_cm'];

const metricTranslationKeys: Partial<Record<keyof Assessment, string>> = {
    grip_kgf: 'handgrip_strength',
    balance_s: 'balance',
    back_scratch_cm: 'flexibility',
    bmi: 'bmi',
    cc_bmi_index: 'cc_bmi_index',
    calf_circum_cm: 'calf_circumference',
    weight_kg: 'weight',
    height_cm: 'height',
    cintura_cm: 'waist_circumference',
    quadril_cm: 'hip_circumference',
    gordura_percent: 'body_fat_percent',
    rcq: 'waist_hip_ratio',
    handgrip_nondominant_kgf: 'handgrip_nondominant',
    chair_stand_reps: 'chair_stand_test',
    arm_curl_reps: 'arm_curl_test',
    chair_sit_reach_cm: 'chair_sit_reach',
    up_and_go_seconds: 'up_and_go',
    six_min_walk_meters: 'six_min_walk',
    six_min_walk_predicted: 'six_min_walk_predicted',
    six_min_walk_percent: 'six_min_walk_percent',
};

const CustomTooltip = ({ active, payload, label, firstAssessment, selectedMetricKey, t, formatNumber }: any) => {
    if (active && payload && payload.length && firstAssessment) {
        const currentValue = payload[0].value;
        const initialValue = firstAssessment.data[selectedMetricKey];
        let percentChange = 0;
        if (initialValue !== 0) {
            percentChange = ((currentValue - initialValue) / Math.abs(initialValue)) * 100;
        }

        return (
            <div className="bg-white p-3 border border-slate-300 rounded-lg shadow-lg">
                <p className="font-bold text-primary-dark">{label}</p>
                <p>{`${t(metricTranslationKeys[selectedMetricKey as keyof Assessment] as any)}: ${formatNumber(currentValue, { maximumFractionDigits: 1 })}`}</p>
                <p className={`font-semibold ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t('percent_change')}: {percentChange > 0 ? '+' : ''}{formatNumber(percentChange, { maximumFractionDigits: 1 })}%
                </p>
            </div>
        );
    }
    return null;
};

const ParticipantDashboard: React.FC = () => {
    const { t, formatNumber, formatDate } = useLocalization();
    const navigate = useNavigate();
    const { participantId } = useUserRole();
    const { participants } = useParticipantData();
    const [selectedMetric, setSelectedMetric] = useState<keyof Assessment>('grip_kgf');

    const participant = participants.find(p => p.study_id === participantId);

    if (!participant) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-xl text-slate-600 mb-6">Participante não encontrado ou sessão expirada.</p>
                <Button onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                }}>
                    Voltar ao Início
                </Button>
            </div>
        );
    }

    const totalSessions = 24;
    const adherence = participant.sessions_completed > 0 ? (participant.sessions_completed / totalSessions) * 100 : 0;
    
    const nextSessionIndex = participant.sessions_completed;
    const nextSessionPlan = participant.training_plan?.[nextSessionIndex];
    const isTrainingComplete = nextSessionIndex >= totalSessions;

    const chartData = participant.assessments.map(assessment => ({
        date: formatDate(new Date(assessment.date), { month: 'short', day: 'numeric' }),
        value: assessment.data[selectedMetric],
    }));
    
    const firstAssessment = participant.assessments[0];
    const currentBelt = getCurrentBelt(participant.sessions_completed);

    const birthDate = new Date(participant.birth_date || '1950-01-01');
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    const isBirthday = today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();

    const getSexLabel = (sex: string) => {
        if (sex === 'M') return t('sex_m' as any);
        if (sex === 'F') return t('sex_f' as any);
        return t('sex_other' as any);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-4xl font-bold text-primary-dark">{t('dashboard_participant_title')}</h1>
                    </div>
                    <p className="text-lg text-slate-600">
                        <span className="font-semibold">{participant.name}</span> • {age} {t('years_old' as any)} • {getSexLabel(participant.sex)}
                    </p>
                </div>
            </div>

            {isBirthday && (
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-l-4 border-yellow-500 p-6 rounded-r-xl shadow-sm">
                    <h2 className="text-2xl font-bold text-yellow-800 mb-2">{t('happy_birthday' as any)}</h2>
                    <p className="text-yellow-700">{t('happy_birthday_msg' as any)}</p>
                </div>
            )}
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                 <Card title={t('next_session_title')} className="flex flex-col lg:col-span-1">
                    <div className="flex-grow">
                        {isTrainingComplete ? (
                            <p className="text-xl text-slate-600 my-4">{t('training_complete')}</p>
                        ) : nextSessionPlan ? (
                            <>
                                <h3 className="text-2xl font-bold text-primary-dark">{t('next_session_info_with_level', {
                                    sessionNumber: nextSessionIndex + 1,
                                    sessionType: t(trainingPrograms[nextSessionPlan.sessionType].titleKey),
                                    level: nextSessionPlan.level
                                })}</h3>
                                <p className="text-slate-600 my-2">{t('next_session_personalized_hint')}</p>
                            </>
                        ) : (
                            <p className="text-slate-600 my-4">{t('awaiting_first_assessment')}</p>
                        )}
                    </div>
                    <Button 
                        variant="secondary" 
                        onClick={() => navigate(`/session/${nextSessionIndex}`)} 
                        className="w-full mt-4" 
                        disabled={isTrainingComplete || !nextSessionPlan}
                    >
                        {t('start_session')}
                    </Button>
                </Card>

                <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className="grid sm:grid-cols-3 gap-8">
                        <Card title={t('current_belt')} className="flex flex-col items-center justify-center text-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 mb-2 ${currentBelt.colorClass}`}>
                                <Award size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">{t(currentBelt.key)}</h3>
                        </Card>
                        <Card title={t('sessions_completed')} className="flex flex-col justify-center">
                            <p className="text-5xl font-bold text-secondary">{participant.sessions_completed} <span className="text-2xl text-slate-500">/ {totalSessions}</span></p>
                        </Card>
                        <Card title={t('adherence_rate')} className="flex flex-col justify-center">
                            <p className="text-5xl font-bold text-secondary">{formatNumber(adherence, { maximumFractionDigits: 0 })}<span className="text-2xl text-slate-500">%</span></p>
                        </Card>
                    </div>
                     <Card title={t('my_training_plan_title')} className="flex flex-col">
                        <div className="flex-grow">
                            <p className="text-slate-600 mb-4">{t('my_training_plan_desc')}</p>
                        </div>
                        <Button onClick={() => navigate('/training-plan')} variant="ghost" className="w-full border-2 border-primary">
                            {t('view_full_plan')}
                        </Button>
                    </Card>
                </div>
            </div>

            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-primary-dark">{t('my_progress_title')}</h2>
                    {chartData.length > 0 && (
                        <select
                            id="metric-select-progress"
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value as keyof Assessment)}
                            className="p-2 rounded-md border-slate-300 border bg-white text-slate-700 shadow-sm"
                            aria-label={t('select_metric')}
                        >
                            {metrics.map(metric => (
                                <option key={metric} value={metric}>{t(metricTranslationKeys[metric] as any)}</option>
                            ))}
                        </select>
                    )}
                </div>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip firstAssessment={firstAssessment} selectedMetricKey={selectedMetric} t={t} formatNumber={formatNumber} />} />
                            <Legend />
                            <Line type="monotone" dataKey="value" name={t(metricTranslationKeys[selectedMetric] as any)} stroke="#005f73" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-slate-600">{t('no_assessments_yet')}</p>
                )}
            </Card>
        </div>
    );
};

const ResearcherDashboard: React.FC = () => {
    const { t, formatDate, formatNumber } = useLocalization();
    const { participants } = useParticipantData();
    const navigate = useNavigate();

    const unreviewedAlerts = participants.reduce(
        (sum, p) => sum + (p.incidents || []).filter(inc => !inc.reviewed).length,
        0
    );

    const handleExport = () => {
        const headers = [
            "study_id", "name", "sex", "birth_date", "site", "sessions_completed", "adherence_rate_percent",
            "assessment_date",
            // Station 1
            "weight_kg", "height_cm", "bmi", "calf_circum_cm", "cc_bmi_index",
            "cintura_cm", "quadril_cm", "gordura_percent", "rcq",
            // Station 2
            "grip_kgf", "handgrip_nondominant_kgf",
            "chair_stand_reps", "arm_curl_reps", "chair_sit_reach_cm", "up_and_go_seconds",
            "balance_s", "back_scratch_cm",
            // Station 3
            "six_min_walk_meters", "six_min_walk_predicted", "six_min_walk_percent",
        ];

        const csvRows = [headers.join(',')];

        const na = (val: number | undefined) => val !== undefined ? val : '';

        participants.forEach(p => {
            const adherence = (p.sessions_completed / 24) * 100;
            if (p.assessments.length === 0) {
                const row = [p.study_id, p.name, p.sex, p.birth_date, p.site, p.sessions_completed, adherence.toFixed(2),
                    'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A',
                    'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'];
                csvRows.push(row.join(','));
            } else {
                p.assessments.forEach(assessment => {
                    const d = assessment.data;
                    const row = [
                        p.study_id, p.name, p.sex, p.birth_date, p.site,
                        p.sessions_completed, adherence.toFixed(2), assessment.date,
                        // Station 1
                        d.weight_kg, d.height_cm, d.bmi.toFixed(2), d.calf_circum_cm, d.cc_bmi_index.toFixed(2),
                        na(d.cintura_cm), na(d.quadril_cm), na(d.gordura_percent),
                        d.rcq !== undefined ? d.rcq.toFixed(3) : '',
                        // Station 2
                        d.grip_kgf, na(d.handgrip_nondominant_kgf),
                        na(d.chair_stand_reps), na(d.arm_curl_reps), na(d.chair_sit_reach_cm), na(d.up_and_go_seconds),
                        d.balance_s, d.back_scratch_cm,
                        // Station 3
                        na(d.six_min_walk_meters),
                        d.six_min_walk_predicted !== undefined ? d.six_min_walk_predicted.toFixed(1) : '',
                        d.six_min_walk_percent !== undefined ? d.six_min_walk_percent.toFixed(1) : '',
                    ];
                    csvRows.push(row.join(','));
                });
            }
        });
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `active_aging_study_data_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-4xl font-bold text-primary-dark">{t('dashboard_researcher_title')}</h1>
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        className="border-2 border-primary text-base py-2 px-4"
                        onClick={() => navigate('/consent')}
                    >
                        + {t('new_participant')}
                    </Button>
                    <Button
                        variant="ghost"
                        className={`border-2 text-base py-2 px-4 flex items-center gap-2 ${unreviewedAlerts > 0 ? 'border-amber-500 text-amber-700' : 'border-slate-300 text-slate-600'}`}
                        onClick={() => navigate('/researcher/alerts')}
                    >
                        {t('alerts_title')}
                        {unreviewedAlerts > 0 && (
                            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {unreviewedAlerts}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-primary-dark">{t('participants')}</h2>
                    <Button onClick={handleExport} variant="secondary">{t('export_csv')}</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-100 text-slate-600 uppercase">
                            <tr>
                                <th className="p-3">{t('researcher_table_id')}</th>
                                <th className="p-3">{t('researcher_table_name' as any)}</th>
                                <th className="p-3">{t('researcher_table_sex' as any)}</th>
                                <th className="p-3">{t('researcher_table_age' as any)}</th>
                                <th className="p-3">{t('researcher_table_site')}</th>
                                <th className="p-3 text-center">{t('researcher_table_sessions')}</th>
                                <th className="p-3 text-center">{t('researcher_table_adherence')}</th>
                                <th className="p-3">{t('researcher_table_last_assessment')}</th>
                                <th className="p-3 text-center" title="Força de Preensão (kgf)">{t('researcher_table_grip')}</th>
                                <th className="p-3 text-center" title="Equilíbrio (s)">{t('researcher_table_balance')}</th>
                                <th className="p-3 text-center" title="Flexibilidade (cm)">{t('researcher_table_flexibility')}</th>
                                <th className="p-3 text-center" title="Índice de Massa Corporal">{t('researcher_table_bmi')}</th>
                                <th className="p-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {participants.map(p => {
                                const latestAssessment = p.assessments.length > 0 ? p.assessments[p.assessments.length - 1] : null;
                                const adherence = (p.sessions_completed / 24) * 100;
                                
                                const birthDate = new Date(p.birth_date || '1950-01-01');
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const m = today.getMonth() - birthDate.getMonth();
                                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                    age--;
                                }

                                const getSexLabel = (sex: string) => {
                                    if (sex === 'M') return t('sex_m' as any);
                                    if (sex === 'F') return t('sex_f' as any);
                                    return t('sex_other' as any);
                                };

                                return (
                                    <tr key={p.study_id} className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-primary-dark">{p.study_id}</td>
                                        <td className="p-3">{p.name}</td>
                                        <td className="p-3">{getSexLabel(p.sex)}</td>
                                        <td className="p-3">{age}</td>
                                        <td className="p-3">{p.site}</td>
                                        <td className="p-3 text-center">{p.sessions_completed}</td>
                                        <td className="p-3 text-center">{formatNumber(adherence, {maximumFractionDigits: 0})}%</td>
                                        <td className="p-3">{latestAssessment ? formatDate(new Date(latestAssessment.date), { day: '2-digit', month: '2-digit', year: 'numeric'}) : '-'}</td>
                                        <td className="p-3 text-center">{latestAssessment ? latestAssessment.data.grip_kgf : '-'}</td>
                                        <td className="p-3 text-center">{latestAssessment ? latestAssessment.data.balance_s : '-'}</td>
                                        <td className="p-3 text-center">{latestAssessment ? latestAssessment.data.back_scratch_cm : '-'}</td>
                                        <td className="p-3 text-center">{latestAssessment ? formatNumber(latestAssessment.data.bmi, {maximumFractionDigits: 1}) : '-'}</td>
                                        <td className="p-3 text-center">
                                            <Button
                                                variant="ghost"
                                                className="text-primary text-sm py-1 px-3"
                                                onClick={() => navigate(`/researcher/participant/${p.study_id}`)}
                                            >
                                                {t('view_participant_panel')}
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default DashboardPage;