
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useUserRole } from '../context/UserRoleContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { UserRole } from '../types';
import { I18nKeys } from '../localization/es';
import { newParticipant } from '../services/mockData';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const questions: (keyof I18nKeys)[] = ['screening_q1', 'screening_q2', 'screening_q3', 'screening_q4', 'screening_q5'];

type Answers = Record<string, 'yes' | 'no' | null>;

const ScreeningPage: React.FC = () => {
    const { t } = useLocalization();
    const navigate = useNavigate();
    const { setRole, setParticipantId } = useUserRole();
    const { addParticipant } = useParticipantData();
    const [status, setStatus] = useState<'registration' | 'screening' | 'risk' | 'success'>('registration');
    const [formData, setFormData] = useState({
        name: '',
        sex: 'M',
        birth_date: ''
    });
    
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
        const participantToSave = {
            ...newParticipant,
            name: formData.name || newParticipant.name,
            sex: formData.sex as 'M' | 'F' | 'Other',
            birth_date: formData.birth_date || newParticipant.birth_date,
            study_id: `NEW-${Math.floor(Math.random() * 10000)}`
        };
        setRole(UserRole.PARTICIPANT);
        setParticipantId(participantToSave.study_id);
        addParticipant(participantToSave);
        navigate('/dashboard');
    }

    const handleRegistrationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.birth_date) {
            setStatus('screening');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="max-w-3xl w-full">
                <h1 className="text-3xl font-bold text-primary-dark mb-4">{t('screening_title')}</h1>
                
                {status === 'risk' && (
                    <div className="text-center p-6 bg-red-100 border-l-4 border-danger text-danger rounded-md">
                        <p className="text-xl font-semibold">{t('contact_professional')}</p>
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="text-center p-6 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-md">
                         <h2 className="text-2xl font-bold mb-2">{t('screening_success_title')}</h2>
                        <p className="text-xl">{t('screening_success_message')}</p>
                        <Button onClick={handleContinue} className="mt-6">{t('continue')}</Button>
                    </div>
                )}

                {status === 'registration' && (
                    <form onSubmit={handleRegistrationSubmit} className="space-y-6">
                        <p className="text-lg text-slate-600 mb-8">Por favor, preencha seus dados antes de iniciar a triagem de segurança.</p>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('participant_name' as any)}</label>
                            <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full p-3 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                placeholder="Seu nome completo"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('participant_sex' as any)}</label>
                            <select 
                                value={formData.sex}
                                onChange={e => setFormData({...formData, sex: e.target.value})}
                                className="w-full p-3 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                            >
                                <option value="M">{t('sex_m' as any)}</option>
                                <option value="F">{t('sex_f' as any)}</option>
                                <option value="Other">{t('sex_other' as any)}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('participant_dob' as any)}</label>
                            <input 
                                type="date" 
                                required
                                value={formData.birth_date}
                                onChange={e => setFormData({...formData, birth_date: e.target.value})}
                                className="w-full p-3 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <Button type="submit" className="w-full mt-8">{t('continue')}</Button>
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
                        <Button onClick={handleSubmit} disabled={!allAnswered} className="w-full mt-10">{t('screening_submit')}</Button>
                    </>
                )}
            </Card>
        </div>
    );
};

export default ScreeningPage;