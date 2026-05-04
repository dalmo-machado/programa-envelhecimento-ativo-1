import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Award } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { UserRole, Assessment } from '../types';
import { trainingPrograms } from '../services/trainingData';
import { getCurrentBelt, getBeltProgress, BeltProgress } from '../utils/gamification';
import { restoreFromBackup, BackupData, loadAllParticipants, ResearcherRecord, loadResearchers, createResearcher, toggleResearcherActive } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../utils/auth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Header from '../components/Header';

const DashboardPage: React.FC = () => {
    const { role } = useUserRole();

    return (
        <div className="bg-background min-h-screen">
            <Header />
            <main className="p-4 sm:p-6 md:p-8">
                {role === UserRole.PARTICIPANT
                    ? <ParticipantDashboard />
                    : role === UserRole.ADMIN
                    ? <ResearcherDashboard gestorMode={true} />
                    : <ResearcherDashboard />}
            </main>
        </div>
    );
};

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
    cintura_cm: 'waist_circumference',
    quadril_cm: 'hip_circumference',
};

const CustomTooltip = ({ active, payload, label, firstAssessment, selectedMetricKey, t, formatNumber }: any) => {
    if (active && payload && payload.length && firstAssessment) {
        const currentValue = payload[0].value;
        const initialValue = firstAssessment.data[selectedMetricKey];
        let percentChange = 0;
        if (initialValue !== 0) {
            percentChange = ((currentValue - initialValue) / Math.abs(initialValue)) * 100;
        }
        const metricLabel = (metricTranslationKeys[selectedMetricKey as keyof Assessment] ?? selectedMetricKey) as any;

        return (
            <div className="bg-white p-3 border border-slate-300 rounded-lg shadow-lg">
                <p className="font-bold text-primary-dark">{label}</p>
                <p>{`${t(metricLabel)}: ${formatNumber(currentValue, { maximumFractionDigits: 1 })}`}</p>
                <p className={`font-semibold ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t('percent_change')}: {percentChange > 0 ? '+' : ''}{formatNumber(percentChange, { maximumFractionDigits: 1 })}%
                </p>
            </div>
        );
    }
    return null;
};

const BeltProgressCard: React.FC<{ beltProgress: BeltProgress }> = ({ beltProgress }) => {
    const { t } = useLocalization();

    if (beltProgress.isMaxBelt) {
        return (
            <Card className="flex items-center gap-4 py-1">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 shrink-0 ${beltProgress.currentBelt.colorClass}`}>
                    <Award size={28} />
                </div>
                <div>
                    <p className="text-base font-bold text-slate-800">{t(beltProgress.currentBelt.key)}</p>
                    <p className="text-base text-yellow-700 font-semibold mt-1">{t('belt_max_reached' as any)}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card title={t('belt_progress_title' as any)} className="w-full">
            <div className="flex items-center gap-3 sm:gap-5 py-1">
                <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${beltProgress.currentBelt.colorClass}`}>
                        <Award size={22} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 text-center leading-tight w-16">{t(beltProgress.currentBelt.key)}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm text-slate-500 mb-1">
                        <span className="font-medium">{t('belt_sessions_progress' as any, { done: beltProgress.sessionsInRange, total: beltProgress.sessionsForNextBelt })}</span>
                        <span>{Math.round(beltProgress.progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-5 overflow-hidden">
                        <div
                            className={`h-5 rounded-full transition-all duration-700 ${beltProgress.nextBelt!.barColorClass}`}
                            style={{ width: `${beltProgress.progressPercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 text-center">
                        {t('belt_next_label' as any, { belt: t(beltProgress.nextBelt!.key) })}
                    </p>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0 opacity-40">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${beltProgress.nextBelt!.colorClass}`}>
                        <Award size={22} />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 text-center leading-tight w-16">{t(beltProgress.nextBelt!.key)}</span>
                </div>
            </div>
        </Card>
    );
};

const ParticipantDashboard: React.FC = () => {
    const { t, formatNumber, formatDate } = useLocalization();
    const navigate = useNavigate();
    const { participantId, setRole, setParticipantId } = useUserRole();
    const { participants } = useParticipantData();

    const handleLogout = () => {
        setRole(UserRole.NONE);
        setParticipantId(null);
        navigate('/');
    };
    const [selectedMetric, setSelectedMetric] = useState<keyof Assessment>('grip_kgf');

    const participant = participants.find(p => p.study_id === participantId);

    if (!participant) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-xl text-slate-600 mb-6">{t('participant_session_expired' as any)}</p>
                <Button onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                }}>
                    {t('back_to_start' as any)}
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
    const beltProgress = getBeltProgress(participant.sessions_completed);

    const birthDate = new Date((participant.birth_date || '1950-01-01') + 'T12:00:00Z');
    const today = new Date();
    let age = today.getFullYear() - birthDate.getUTCFullYear();
    const m = today.getMonth() - birthDate.getUTCMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getUTCDate())) {
        age--;
    }
    const isBirthday = today.getMonth() === birthDate.getUTCMonth() && today.getDate() === birthDate.getUTCDate();

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
                <Button variant="ghost" onClick={handleLogout} className="border border-slate-300 text-slate-600 hover:text-danger hover:border-danger py-2 px-4 text-base shrink-0">
                    {t('logout_button' as any)}
                </Button>
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
                                    sessionType: t((trainingPrograms[nextSessionPlan.sessionType]?.titleKey) ?? 'session_type_session1' as any),
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
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                        <div className="col-span-2">
                            <BeltProgressCard beltProgress={beltProgress} />
                        </div>
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
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip firstAssessment={firstAssessment} selectedMetricKey={selectedMetric} t={t} formatNumber={formatNumber} />} />
                            <Legend />
                            <Line type="monotone" dataKey="value" name={t((metricTranslationKeys[selectedMetric] ?? selectedMetric) as any)} stroke="#005f73" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-slate-600">{t('no_assessments_yet')}</p>
                )}
            </Card>
        </div>
    );
};

const ResearcherDashboard: React.FC<{ gestorMode?: boolean }> = ({ gestorMode = false }) => {
    const { t, formatDate, formatNumber } = useLocalization();
    const { participants } = useParticipantData();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Gestor: Zerar Dados
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Gestor: gerenciamento de pesquisadores
    const [researchers, setResearchers] = useState<ResearcherRecord[]>([]);
    const [researchersLoading, setResearchersLoading] = useState(false);
    const [showAddResearcher, setShowAddResearcher] = useState(false);
    const [newResearcher, setNewResearcher] = useState({ code: '', name: '', password: '', site: '' });
    const [addingResearcher, setAddingResearcher] = useState(false);
    const [addResearcherError, setAddResearcherError] = useState<string | null>(null);

    useEffect(() => {
        if (!gestorMode) return;
        setResearchersLoading(true);
        loadResearchers()
            .then(setResearchers)
            .catch(err => console.error('[Gestor] loadResearchers:', err))
            .finally(() => setResearchersLoading(false));
    }, [gestorMode]);

    const handleAddResearcher = async () => {
        if (!newResearcher.code.trim() || !newResearcher.name.trim() || !newResearcher.password) {
            setAddResearcherError(t('researchers_required_error' as any));
            return;
        }
        setAddingResearcher(true);
        setAddResearcherError(null);
        try {
            const hash = await hashPassword(newResearcher.password);
            await createResearcher(newResearcher.code, newResearcher.name, hash, newResearcher.site || null);
            const updated = await loadResearchers();
            setResearchers(updated);
            setNewResearcher({ code: '', name: '', password: '', site: '' });
            setShowAddResearcher(false);
        } catch (err: any) {
            setAddResearcherError(err?.message ?? 'Erro ao cadastrar pesquisador.');
        } finally {
            setAddingResearcher(false);
        }
    };

    const handleToggleResearcher = async (id: string, currentActive: boolean) => {
        try {
            await toggleResearcherActive(id, !currentActive);
            setResearchers(prev => prev.map(r => r.id === id ? { ...r, active: !currentActive } : r));
        } catch (err: any) {
            console.error('[Gestor] toggleResearcher:', err);
        }
    };

    const handleConfirmDeleteAll = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            // 1 — Exportar backup automático antes de qualquer deleção
            const allParticipants = await loadAllParticipants();
            const backup: BackupData = {
                version: 1,
                exported_at: new Date().toISOString(),
                participants: allParticipants,
            };
            const json = JSON.stringify(backup, null, 2);
            const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            link.download = `agecare_backup_${ts}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // 2 — DELETE sequencial (tabelas filhas antes da tabela pai)
            const steps: Array<{ table: string; filter: [string, string] }> = [
                { table: 'sessions',     filter: ['participant_id', ''] },
                { table: 'assessments',  filter: ['participant_id', ''] },
                { table: 'incidents',    filter: ['participant_id', ''] },
                { table: 'participants', filter: ['study_id',        ''] },
            ];
            for (const { table, filter } of steps) {
                const { error } = await (supabase as any)
                    .from(table)
                    .delete()
                    .neq(filter[0], filter[1]);
                if (error) throw new Error(`Erro ao apagar "${table}": ${error.message}`);
            }

            localStorage.clear();
            window.location.href = '/';
        } catch (err: any) {
            console.error('[Gestor] handleConfirmDeleteAll:', err);
            setDeleteError(err?.message ?? 'Erro desconhecido ao zerar dados.');
            setIsDeleting(false);
        }
    };

    const handleRestoreClick = () => {
        setRestoreStatus(null);
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Reset input so the same file can be selected again if needed
        e.target.value = '';

        setIsRestoring(true);
        setRestoreStatus(null);
        try {
            const text = await file.text();
            const backup: BackupData = JSON.parse(text);
            if (!backup.participants || !Array.isArray(backup.participants)) {
                throw new Error('Arquivo inválido: não contém lista de participantes.');
            }
            const result = await restoreFromBackup(backup);
            if (result.errors.length > 0) {
                setRestoreStatus({
                    type: 'error',
                    message: `Restaurados ${result.restored} participante(s) com ${result.errors.length} erro(s):\n${result.errors.slice(0, 5).join('\n')}`,
                });
            } else {
                setRestoreStatus({
                    type: 'success',
                    message: `✅ ${result.restored} participante(s) restaurado(s) com sucesso. Recarregando...`,
                });
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (err: any) {
            setRestoreStatus({ type: 'error', message: `Erro ao ler arquivo: ${err.message}` });
        } finally {
            setIsRestoring(false);
        }
    };

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
            // Session activity
            "avg_session_duration_min", "total_active_min",
        ];

        const csvRows = [headers.join(',')];

        const na = (val: number | undefined) => val !== undefined ? val : '';

        participants.forEach(p => {
            const adherence = (p.sessions_completed / 24) * 100;
            const logs = p.session_logs ?? [];
            const totalActive = logs.reduce((sum, l) => sum + l.duration_min, 0);
            const avgDuration = logs.length > 0
                ? (totalActive / logs.length).toFixed(1)
                : '';
            const totalActiveStr = logs.length > 0 ? totalActive.toFixed(1) : '';

            if (p.assessments.length === 0) {
                const row = [p.study_id, p.name, p.sex, p.birth_date, p.site, p.sessions_completed, adherence.toFixed(2),
                    'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A',
                    'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A',
                    avgDuration, totalActiveStr];
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
                        // Session activity
                        avgDuration, totalActiveStr,
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
            {/* Modal de confirmação — Zerar Todos os Dados (Gestor apenas) */}
            {gestorMode && showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl text-slate-800">
                        <h3 className="text-xl font-bold text-red-600 mb-3">{t('reset_data_title' as any)}</h3>
                        <p className="text-slate-600 mb-2">{t('confirm_reset_all' as any)}</p>
                        <p className="text-sm text-slate-500 mb-4">
                            {t('delete_backup_note' as any)}
                        </p>
                        {deleteError && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                ⚠️ {deleteError}
                            </p>
                        )}
                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="secondary"
                                onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                                disabled={isDeleting}
                            >
                                {t('reset_data_no' as any)}
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                                onClick={handleConfirmDeleteAll}
                                disabled={isDeleting}
                            >
                                {isDeleting ? '⏳ Apagando...' : t('reset_data_yes' as any)}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Input oculto para seleção do arquivo de backup (Gestor apenas) */}
            {gestorMode && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileSelected}
                />
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-primary-dark">{t('dashboard_researcher_title')}</h1>
                    {gestorMode && (
                        <span className="inline-block mt-1 text-xs font-bold uppercase tracking-wide bg-primary-dark text-white px-3 py-1 rounded-full">
                            {t('gestor_badge' as any)}
                        </span>
                    )}
                </div>
                <div className="flex gap-3 flex-wrap">
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
                    {gestorMode && (
                        <>
                            <Button
                                variant="ghost"
                                className="border-2 border-slate-400 text-slate-600 hover:border-primary hover:text-primary text-base py-2 px-4 disabled:opacity-50"
                                onClick={handleRestoreClick}
                                disabled={isRestoring}
                            >
                                {isRestoring ? '⏳ Restaurando...' : '↩ Restaurar Backup'}
                            </Button>
                            <Button
                                variant="ghost"
                                className="border-2 border-red-500 text-red-600 hover:bg-red-50 text-base py-2 px-4"
                                onClick={() => { setDeleteError(null); setShowDeleteConfirm(true); }}
                            >
                                🗑 Zerar Dados
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Gerenciamento de Pesquisadores (Gestor apenas) ────────────── */}
            {gestorMode && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-primary-dark">{t('researchers_section_title' as any)}</h2>
                        <Button
                            variant="ghost"
                            className="border-2 border-primary text-base py-2 px-4"
                            onClick={() => { setShowAddResearcher(v => !v); setAddResearcherError(null); }}
                        >
                            {showAddResearcher ? t('researchers_cancel_button' as any) : t('researchers_add_button' as any)}
                        </Button>
                    </div>

                    {/* Formulário de adição */}
                    {showAddResearcher && (
                        <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-3 border border-slate-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-1">{t('researchers_code_label' as any)}</label>
                                    <input
                                        type="text"
                                        value={newResearcher.code}
                                        onChange={e => setNewResearcher(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                                        placeholder={t('researchers_code_placeholder' as any)}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-1">{t('researchers_name_label' as any)}</label>
                                    <input
                                        type="text"
                                        value={newResearcher.name}
                                        onChange={e => setNewResearcher(v => ({ ...v, name: e.target.value }))}
                                        placeholder={t('researchers_name_placeholder' as any)}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-1">{t('researchers_password_label' as any)}</label>
                                    <input
                                        type="password"
                                        value={newResearcher.password}
                                        onChange={e => setNewResearcher(v => ({ ...v, password: e.target.value }))}
                                        placeholder={t('researchers_password_placeholder' as any)}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-1">{t('researchers_site_label' as any)}</label>
                                    <select
                                        value={newResearcher.site}
                                        onChange={e => setNewResearcher(v => ({ ...v, site: e.target.value }))}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:outline-none"
                                    >
                                        <option value="">{t('researchers_site_all' as any)}</option>
                                        <option value="BR">{t('researchers_site_br' as any)}</option>
                                        <option value="ES">{t('researchers_site_es' as any)}</option>
                                    </select>
                                </div>
                            </div>
                            {addResearcherError && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">⚠️ {addResearcherError}</p>
                            )}
                            <div className="flex justify-end">
                                <Button onClick={handleAddResearcher} disabled={addingResearcher} className="py-2 px-6">
                                    {addingResearcher ? t('researchers_saving' as any) : t('researchers_save_button' as any)}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Lista de pesquisadores */}
                    {researchersLoading ? (
                        <p className="text-slate-500 text-sm py-2">{t('researchers_loading' as any)}</p>
                    ) : researchers.length === 0 ? (
                        <p className="text-slate-500 text-sm py-2">{t('researchers_empty' as any)}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                                    <tr>
                                        <th className="p-3">{t('researchers_col_code' as any)}</th>
                                        <th className="p-3">{t('researchers_col_name' as any)}</th>
                                        <th className="p-3">{t('researchers_col_site' as any)}</th>
                                        <th className="p-3">{t('researchers_col_created' as any)}</th>
                                        <th className="p-3 text-center">{t('researchers_col_status' as any)}</th>
                                        <th className="p-3 text-center">{t('researchers_col_action' as any)}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {researchers.map(r => (
                                        <tr key={r.id} className={`hover:bg-slate-50 ${!r.active ? 'opacity-50' : ''}`}>
                                            <td className="p-3 font-mono font-semibold text-primary-dark">{r.code}</td>
                                            <td className="p-3">{r.name}</td>
                                            <td className="p-3">{r.site ?? '—'}</td>
                                            <td className="p-3">{formatDate(new Date(r.created_at), { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                            <td className="p-3 text-center">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                                    {r.active ? t('researchers_status_active' as any) : t('researchers_status_inactive' as any)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <Button
                                                    variant="ghost"
                                                    className={`text-xs py-1 px-3 border ${r.active ? 'border-red-400 text-red-600 hover:bg-red-50' : 'border-green-500 text-green-700 hover:bg-green-50'}`}
                                                    onClick={() => handleToggleResearcher(r.id, r.active)}
                                                >
                                                    {r.active ? t('researchers_deactivate' as any) : t('researchers_reactivate' as any)}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {/* Feedback de restauração (Gestor apenas) */}
            {gestorMode && restoreStatus && (
                <div className={`rounded-lg p-4 text-sm whitespace-pre-line border ${
                    restoreStatus.type === 'success'
                        ? 'bg-green-50 border-green-300 text-green-800'
                        : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                    {restoreStatus.message}
                </div>
            )}
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
                                <th className="p-3 text-center">{t('researcher_table_sessions')}</th>
                                <th className="p-3 text-center">{t('researcher_table_adherence')}</th>
                                <th className="p-3">{t('researcher_table_last_assessment')}</th>
                                <th className="p-3 text-center">{t('height')}</th>
                                <th className="p-3 text-center">{t('weight')}</th>
                                <th className="p-3">{t('participant_dob')}</th>
                                <th className="p-3 text-center" title={t('handgrip_strength')}>{t('researcher_table_grip')}</th>
                                <th className="p-3 text-center" title={t('balance')}>{t('researcher_table_balance')}</th>
                                <th className="p-3 text-center" title={t('bmi')}>{t('researcher_table_bmi')}</th>
                                <th className="p-3 text-center">{t('table_col_actions' as any)}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {participants.map(p => {
                                const latestAssessment = p.assessments.length > 0 ? p.assessments[p.assessments.length - 1] : null;
                                const adherence = (p.sessions_completed / 24) * 100;
                                
                                const birthDate = new Date((p.birth_date || '1950-01-01') + 'T12:00:00Z');
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getUTCFullYear();
                                const m = today.getMonth() - birthDate.getUTCMonth();
                                if (m < 0 || (m === 0 && today.getDate() < birthDate.getUTCDate())) {
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
                                        <td className="p-3 text-center">{p.sessions_completed}</td>
                                        <td className="p-3 text-center">{formatNumber(adherence, {maximumFractionDigits: 0})}%</td>
                                        <td className="p-3">{latestAssessment ? formatDate(new Date(latestAssessment.date), { day: '2-digit', month: '2-digit', year: 'numeric'}) : '-'}</td>
                                        <td className="p-3 text-center">{latestAssessment ? latestAssessment.data.height_cm : '-'}</td>
                                        <td className="p-3 text-center">{latestAssessment ? latestAssessment.data.weight_kg : '-'}</td>
                                        <td className="p-3">{formatDate(new Date((p.birth_date || '1950-01-01') + 'T12:00:00Z'), { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                        <td className="p-3 text-center">{latestAssessment ? latestAssessment.data.grip_kgf : '-'}</td>
                                        <td className="p-3 text-center">{latestAssessment ? latestAssessment.data.balance_s : '-'}</td>
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