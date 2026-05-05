
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { Language, Participant } from '../types';
import { I18nKeys } from '../localization/es';
import { newParticipant } from '../services/mockData';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Header from '../components/Header';

/**
 * Generates the next sequential study_id for a given site.
 * Format: BR-001, BR-002 … / ES-001, ES-002 …
 * Looks at existing participants for that site and increments the highest number found.
 * Falls back to 001 if no participants exist yet.
 */
function generateStudyId(site: string, participants: Participant[]): string {
    const prefix = site === 'Spain' ? 'ES' : 'BR';
    const pattern = new RegExp(`^${prefix}-(\\d+)$`);
    const numbers = participants
        .filter(p => p.site === site)
        .map(p => {
            const m = p.study_id.match(pattern);
            return m ? parseInt(m[1], 10) : 0;
        })
        .filter(n => n > 0);
    const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `${prefix}-${String(next).padStart(3, '0')}`;
}

const questions: (keyof I18nKeys)[] = [
    'screening_q1', 'screening_q2', 'screening_q3', 'screening_q4', 'screening_q5',
];

type Answers = Record<string, 'yes' | 'no' | null>;

interface RegistrationForm {
    name: string;
    sex: string;
    birth_date: string;
    site: string;
}

const ScreeningPage: React.FC = () => {
    const { t } = useLocalization();
    const navigate = useNavigate();
    const { addParticipant, participants } = useParticipantData();

    const [status, setStatus] = useState<'registration' | 'screening' | 'risk' | 'success'>('registration');
    const [formData, setFormData] = useState<RegistrationForm>({
        name: '',
        sex: 'M',
        birth_date: '',
        site: 'Brazil',
    });

    // Preview the ID that will be assigned — updates live when site changes.
    const previewId = useMemo(
        () => generateStudyId(formData.site, participants),
        [formData.site, participants],
    );

    const initialAnswers = questions.reduce((acc, q) => ({ ...acc, [q]: null }), {});
    const [answers, setAnswers] = useState<Answers>(initialAnswers);

    const handleAnswer = (question: keyof I18nKeys, answer: 'yes' | 'no') => {
        setAnswers(prev => ({ ...prev, [question]: answer }));
    };

    const allAnswered = Object.values(answers).every(a => a !== null);

    const handleSubmit = () => {
        const hasRisk = Object.values(answers).some(a => a === 'yes');
        if (hasRisk) {
            setStatus('risk');
        } else {
            setStatus('success');
        }
    };

    const handleContinue = () => {
        // Generate sequential study_id based on existing participants for this site.
        const study_id = generateStudyId(formData.site, participants);

        // Normalise birth_date to YYYY-MM-DD via string manipulation only.
        // Using new Date() would shift the date by the browser's UTC offset.
        const rawBirthDate = formData.birth_date.trim();
        const isoDate = /^\d{2}\/\d{2}\/\d{4}$/.test(rawBirthDate)
          ? (() => { const [d, m, y] = rawBirthDate.split('/'); return `${y}-${m}-${d}`; })()
          : rawBirthDate; // already YYYY-MM-DD when coming from <input type="date">

        const participantToSave = {
            ...newParticipant,
            study_id,
            name: formData.name,
            sex: formData.sex as 'M' | 'F' | 'Other',
            birth_date: isoDate,
            site: formData.site as 'Brazil' | 'Spain',
            language: formData.site === 'Spain' ? Language.ES_ES : Language.PT_BR,
            consent_date: new Date().toISOString(),
        };

        addParticipant(participantToSave);
        // Researcher stays as RESEARCHER — do not change role or participantId.
        navigate('/dashboard');
    };

    const handleRegistrationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.birth_date) {
            setStatus('screening');
        }
    };

    return (
        <div className="bg-background min-h-screen">
            <Header />
            <main className="p-4 sm:p-6 md:p-8 flex justify-center">
                <Card className="max-w-3xl w-full">

                    {/* Back button (visible on all steps) */}
                    <div className="mb-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-slate-600 hover:text-primary-dark py-2 px-3 text-base"
                        >
                            <ChevronLeft size={18} />
                            {t('back_to_dashboard')}
                        </Button>
                    </div>

                    <h1 className="text-3xl font-bold text-primary-dark mb-4">{t('register_participant_title')}</h1>

                    {status === 'risk' && (
                        <div className="text-center p-6 bg-red-100 border-l-4 border-danger text-danger rounded-md">
                            <p className="text-xl font-semibold">{t('contact_professional')}</p>
                            <Button onClick={() => navigate('/dashboard')} variant="ghost" className="mt-6">
                                {t('back_to_dashboard')}
                            </Button>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center p-6 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-md">
                            <h2 className="text-2xl font-bold mb-2">{t('screening_success_title')}</h2>
                            <p className="text-xl">{t('screening_success_message')}</p>
                            <p className="mt-4 text-base">
                                {t('study_id_label')}: <strong className="text-2xl tracking-widest">{previewId}</strong>
                            </p>
                            <Button onClick={handleContinue} className="mt-6">{t('enrollment_save_and_return')}</Button>
                        </div>
                    )}

                    {status === 'registration' && (
                        <form onSubmit={handleRegistrationSubmit} className="space-y-6">
                            <p className="text-lg text-slate-600">{t('register_participant_intro')}</p>

                            {/* Auto-generated ID preview */}
                            <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
                                <span className="text-sm font-medium text-slate-600">{t('study_id_label')}:</span>
                                <span className="text-lg font-bold text-primary-dark tracking-widest">{previewId}</span>
                                <span className="text-xs text-slate-400 ml-auto">{t('study_id_auto_hint' as any)}</span>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('participant_name' as any)}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                        placeholder={t('full_name_placeholder' as any)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('participant_sex' as any)}
                                    </label>
                                    <select
                                        value={formData.sex}
                                        onChange={e => setFormData({ ...formData, sex: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                    >
                                        <option value="M">{t('sex_m' as any)}</option>
                                        <option value="F">{t('sex_f' as any)}</option>
                                        <option value="Other">{t('sex_other' as any)}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('participant_dob' as any)}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.birth_date}
                                        onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">{t('birth_date_password_hint')}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {t('site_label')}
                                    </label>
                                    <select
                                        value={formData.site}
                                        onChange={e => setFormData({ ...formData, site: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                    >
                                        <option value="Brazil">{t('site_brazil')}</option>
                                        <option value="Spain">{t('site_spain')}</option>
                                    </select>
                                </div>
                            </div>

                            <Button type="submit" className="w-full mt-4">{t('continue')}</Button>
                        </form>
                    )}

                    {status === 'screening' && (
                        <>
                            <p className="text-lg text-slate-600 mb-8">{t('screening_intro')}</p>
                            <div className="space-y-8">
                                {questions.map((q_key, index) => (
                                    <div key={q_key}>
                                        <p className="text-xl font-semibold text-slate-800 mb-4">{index + 1}. {t(q_key)}</p>
                                        <div className="flex gap-4">
                                            <Button
                                                onClick={() => handleAnswer(q_key, 'yes')}
                                                variant={answers[q_key] === 'yes' ? 'primary' : 'ghost'}
                                                className="flex-1"
                                            >{t('yes')}</Button>
                                            <Button
                                                onClick={() => handleAnswer(q_key, 'no')}
                                                variant={answers[q_key] === 'no' ? 'primary' : 'ghost'}
                                                className="flex-1"
                                            >{t('no')}</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleSubmit} disabled={!allAnswered} className="w-full mt-10">
                                {t('screening_submit')}
                            </Button>
                        </>
                    )}

                </Card>
            </main>
        </div>
    );
};

export default ScreeningPage;
