import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Award } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { useUserRole } from '../context/UserRoleContext';
import { trainingPrograms } from '../services/trainingData';
import { getRandomPreSessionMessage, getRandomPostSessionMessage } from '../utils/gamification';
import { I18nKeys } from '../localization/es';
import { IncidentReport, SessionLog } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Header from '../components/Header';

type Difficulty = 'easy' | 'adequate' | 'hard';

const SessionPage: React.FC = () => {
  const { sessionIndex: sessionIndexStr } = useParams<{ sessionIndex: string }>();
  const sessionIndex = parseInt(sessionIndexStr || '0');
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { participants, updateParticipant } = useParticipantData();
  const { participantId } = useUserRole();

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionState, setSessionState] = useState<'pre' | 'active' | 'incident' | 'post'>('pre');
  const [preMessage, setPreMessage] = useState<keyof I18nKeys>('motivational_pre_session');
  const [postMessage, setPostMessage] = useState<keyof I18nKeys>('motivational_post_session');
  const [incidentReported, setIncidentReported] = useState<boolean | null>(null);
  const [sessionStart] = useState<string>(() => new Date().toISOString());

  useEffect(() => {
    setPreMessage(getRandomPreSessionMessage());
    setPostMessage(getRandomPostSessionMessage());
  }, []);

  const participant = participants.find(p => p.study_id === participantId);
  const sessionPlan = participant?.training_plan?.[sessionIndex];
  const sessionType = sessionPlan?.sessionType;
  const sessionLevel = sessionPlan?.level;
  const program = sessionType ? trainingPrograms[sessionType] : null;

  if (!program || !participant || !sessionLevel) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="p-4 sm:p-6 md:p-8 flex justify-center">
            <Card>
                <p>{t('program_not_found')}</p>
                <Button onClick={() => navigate('/dashboard')} className="mt-4">{t('back_button')}</Button>
            </Card>
        </main>
      </div>
    );
  }

  const handleCompleteSession = () => {
    if (!difficulty || !participant) return;

    const sessionEnd = new Date().toISOString();
    const durationMs = new Date(sessionEnd).getTime() - new Date(sessionStart).getTime();
    const duration_min = Math.round(durationMs / 60000 * 10) / 10;

    const newLog: SessionLog = {
      session_index: sessionIndex,
      session_start: sessionStart,
      session_end: sessionEnd,
      duration_min,
      completed: true,
    };

    updateParticipant(participant.study_id, {
      sessions_completed: participant.sessions_completed + 1,
      session_logs: [...(participant.session_logs ?? []), newLog],
    });

    setSessionState('incident');
  }

  const handleFinish = () => {
    navigate('/dashboard');
  };

  const handleReportIncident = () => {
    setIncidentReported(true);
    if (participant) {
      const newIncident: IncidentReport = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        session_index: sessionIndex,
        reported_date: new Date().toISOString(),
        reviewed: false,
      };
      updateParticipant(participant.study_id, {
        incidents: [...(participant.incidents || []), newIncident],
      });
    }
  };

  const exercises = program.exercises;
  const currentExercise = exercises[currentExerciseIndex];
  const exerciseDuration = currentExercise.levels[sessionLevel - 1]; // level is 1-based, array is 0-based
  const isLastExercise = currentExerciseIndex === exercises.length - 1;
  const showFeedback = isLastExercise && difficulty !== null;

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 md:p-8 flex justify-center">
        <Card className="max-w-4xl w-full" title={t('session_title', { sessionType: t(program.titleKey) })}>
          
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-primary self-start">
              {sessionState === 'active' ? `${t('exercise_x_of_y', { current: currentExerciseIndex + 1, total: exercises.length })} - ${t('level')} ${sessionLevel}` : ''}
            </h3>
            <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-slate-500 hover:text-danger">
              {t('exit_session')}
            </Button>
          </div>

          {sessionState === 'pre' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center mb-6">
                    <Award size={48} className="text-primary-dark" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">{t('ready_to_start' as any)}</h2>
                <p className="text-xl text-slate-600 mb-10 max-w-lg">{t(preMessage)}</p>
                <Button onClick={() => setSessionState('active')} className="text-lg px-8 py-4">
                    {t('start_workout')}
                </Button>
            </div>
          )}

          {sessionState === 'active' && (
            <>
              <div className="mb-8 flex flex-col items-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center">{t(currentExercise.nameKey)}</h2>
                
                <div className="w-full max-w-2xl">
                    <img
                      src={currentExercise.illustrationUrl}
                      alt={t(currentExercise.nameKey)}
                      className="block w-full max-h-80 object-contain rounded-xl shadow-md mb-6 bg-primary-light"
                    />

                    <div className="flex gap-4 mb-6">
                        {exerciseDuration.params.sets ? (
                            <>
                                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('series_label')}</p>
                                    <p className="text-2xl font-bold text-primary-dark">{exerciseDuration.params.sets}</p>
                                </div>
                                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('repetitions_label')}</p>
                                    <p className="text-2xl font-bold text-primary-dark">{t(exerciseDuration.key, exerciseDuration.params).split('×')[0].trim()}</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('duration_label')}</p>
                                <p className="text-2xl font-bold text-primary-dark">{t(exerciseDuration.key, exerciseDuration.params)}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
                        <p className="text-lg text-slate-700">{t(currentExercise.instructionKey)}</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4 items-start shadow-sm">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={24} />
                        <div>
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">{t('safety_note_title')}</p>
                            <p className="text-amber-900">{t(currentExercise.safetyKey)}</p>
                        </div>
                    </div>
                </div>
              </div>
              
              {!isLastExercise && (
                 <div className="flex justify-between mt-8">
                    <Button onClick={() => setCurrentExerciseIndex(i => Math.max(0, i - 1))} disabled={currentExerciseIndex === 0} variant="ghost">{t('previous')}</Button>
                    <Button onClick={() => setCurrentExerciseIndex(i => Math.min(exercises.length - 1, i + 1))} variant="secondary">{t('next')}</Button>
                </div>
              )}

              {isLastExercise && (
                <div className="mt-10 pt-6 border-t">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-center">
                      <p className="text-lg font-bold text-green-800">{t(postMessage)}</p>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-4">{t('difficulty_feedback')}</h3>
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                      {(['easy', 'adequate', 'hard'] as Difficulty[]).map(level => (
                        <Button 
                          key={level}
                          onClick={() => setDifficulty(level)}
                          variant={difficulty === level ? 'primary' : 'ghost'}
                          className="flex-1 border-2 border-primary"
                        >
                          {t(level)}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
              
              <div className="mt-8 flex flex-col-reverse sm:flex-row gap-4">
                  <Button onClick={() => navigate(-1)} variant="ghost" className="w-full sm:w-auto">
                    {t('back_button')}
                  </Button>
                  {isLastExercise && (
                    <Button 
                      onClick={handleCompleteSession} 
                      className="w-full"
                      disabled={!difficulty}
                    >
                      {t('complete_session')}
                    </Button>
                  )}
              </div>
            </>
          )}

          {sessionState === 'incident' && (
            <div className="flex flex-col items-center justify-center py-8 text-center max-w-lg mx-auto">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle size={40} className="text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('incident_title')}</h2>
                <p className="text-lg text-slate-600 mb-8">{t('incident_desc')}</p>
                
                {incidentReported === null ? (
                    <div className="flex flex-col gap-4 w-full">
                        <Button
                            onClick={handleReportIncident}
                            variant="secondary"
                            className="w-full border-2 border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100"
                        >
                            {t('incident_yes')}
                        </Button>
                        <Button 
                            onClick={() => {
                                setIncidentReported(false);
                                handleFinish();
                            }} 
                            className="w-full"
                        >
                            {t('incident_no')}
                        </Button>
                    </div>
                ) : (
                    <div className="w-full">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
                            <p className="text-amber-800 font-medium">{t('incident_reported')}</p>
                        </div>
                        <Button onClick={handleFinish} className="w-full">
                            {t('back_button')}
                        </Button>
                    </div>
                )}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default SessionPage;