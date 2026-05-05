import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Award } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { useUserRole } from '../context/UserRoleContext';
import { trainingPrograms, warmupExercises, cooldownExercises } from '../services/trainingData';
import { getRandomPreSessionMessage, getRandomPostSessionMessage } from '../utils/gamification';
import { I18nKeys } from '../localization/es';
import { ExerciseRpe, IncidentReport, SessionLog } from '../types';
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
  const [wellnessScore, setWellnessScore] = useState<number | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionState, setSessionState] = useState<'pre' | 'warmup' | 'active' | 'cooldown' | 'incident' | 'post'>('pre');
  const [preMessage, setPreMessage] = useState<keyof I18nKeys>('motivational_pre_session');
  const [postMessage, setPostMessage] = useState<keyof I18nKeys>('motivational_post_session');
  const [incidentReported, setIncidentReported] = useState<boolean | null>(null);
  const [sessionStart] = useState<string>(() => new Date().toISOString());
  // Asier Phase 1 — per-exercise RPE
  const [exerciseRpeRatings, setExerciseRpeRatings] = useState<ExerciseRpe[]>([]);
  const [showRpePicker, setShowRpePicker] = useState(false);

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

  // Asier Phase 1 — RPE picker handlers
  const handleNextWithRpe = () => {
    setShowRpePicker(true);
  };

  const handleRpeSelected = (rpe: 1 | 2 | 3) => {
    setExerciseRpeRatings(prev => [...prev, { exercise_index: currentExerciseIndex, rpe }]);
    setShowRpePicker(false);
    setCurrentExerciseIndex(i => i + 1);
  };

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
      wellness_score: wellnessScore ?? null,
      exercise_rpe: exerciseRpeRatings.length > 0 ? exerciseRpeRatings : undefined,
    };

    updateParticipant(participant.study_id, {
      sessions_completed: participant.sessions_completed + 1,
      session_logs: [...(participant.session_logs ?? []), newLog],
    });

    navigate('/dashboard');
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
                <Button onClick={() => setSessionState('warmup')} className="text-lg px-8 py-4">
                    {t('start_workout')}
                </Button>
            </div>
          )}

          {sessionState === 'active' && (
            <>
              <div className="mb-8 flex flex-col items-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center">{t(currentExercise.nameKey)}</h2>
                
                <div className="w-full max-w-2xl">
                    <div className="flex items-center justify-center w-full mb-6">
                      <img
                        src={currentExercise.illustrationUrl}
                        alt={t(currentExercise.nameKey)}
                        className="w-auto h-auto max-w-full object-contain rounded-xl shadow-md"
                        style={{ maxHeight: '280px' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>

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
                        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={24} />
                        <div>
                            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">{t('safety_note_title')}</p>
                            <p className="text-amber-900">{t(currentExercise.safetyKey)}</p>
                        </div>
                    </div>

                    {/* Asier Phase 1 — load recommendation + RPE zone */}
                    <div className="flex gap-3 mt-4">
                      {currentExercise.loadRec && (
                        <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">{t('load_rec_label' as any)}</p>
                          <p className="text-blue-900 font-semibold text-sm">{currentExercise.loadRec[sessionLevel - 1]}</p>
                        </div>
                      )}
                      {currentExercise.rpeZone && (
                        <div className="flex-1 bg-violet-50 border border-violet-200 rounded-xl p-4 shadow-sm">
                          <p className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-1">{t('rpe_zone_label' as any)}</p>
                          <p className="text-violet-900 font-semibold">RPE {currentExercise.rpeZone[0]}–{currentExercise.rpeZone[1]}/10</p>
                          <p className="text-violet-600 text-xs mt-1">{t('rpe_talk_test' as any)}</p>
                        </div>
                      )}
                    </div>
                </div>
              </div>

              {/* RPE Picker modal (shown when clicking Next) */}
              {showRpePicker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                  <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl text-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 mb-5 text-center">{t('rpe_picker_title' as any)}</h3>
                    <div className="flex flex-col gap-3">
                      {([
                        { rpe: 1 as const, label: t('rpe_light' as any), desc: t('rpe_light_desc' as any), cls: 'border-green-300 bg-green-50 hover:bg-green-100 text-green-800' },
                        { rpe: 2 as const, label: t('rpe_moderate' as any), desc: t('rpe_moderate_desc' as any), cls: 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-800' },
                        { rpe: 3 as const, label: t('rpe_hard' as any), desc: t('rpe_hard_desc' as any), cls: 'border-red-300 bg-red-50 hover:bg-red-100 text-red-800' },
                      ]).map(({ rpe, label, desc, cls }) => (
                        <button
                          key={rpe}
                          onClick={() => handleRpeSelected(rpe)}
                          className={`w-full border-2 rounded-xl p-4 text-left transition-all ${cls}`}
                        >
                          <p className="font-bold text-base">{label}</p>
                          <p className="text-xs opacity-80">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!isLastExercise && (
                 <div className="flex justify-between mt-8">
                    <Button onClick={() => setCurrentExerciseIndex(i => Math.max(0, i - 1))} disabled={currentExerciseIndex === 0} variant="ghost">{t('previous')}</Button>
                    <Button onClick={handleNextWithRpe} variant="secondary">{t('next')}</Button>
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse sm:flex-row gap-4">
                  <Button onClick={() => navigate(-1)} variant="ghost" className="w-full sm:w-auto">
                    {t('back_button')}
                  </Button>
                  {isLastExercise && (
                    <Button
                      onClick={() => setSessionState('cooldown')}
                      className="w-full"
                    >
                      {t('go_to_cooldown' as any)}
                    </Button>
                  )}
              </div>
            </>
          )}


          {sessionState === 'warmup' && (
            <div>
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-center">
                <p className="text-sm font-bold text-orange-800 uppercase tracking-wider">{t('warmup_phase_label' as any)}</p>
                <p className="text-orange-800 text-sm">{t('warmup_phase_desc' as any)}</p>
              </div>
              {warmupExercises.map((ex, idx) => (
                <div key={idx} className="mb-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <img src={ex.illustrationUrl} alt={t(ex.nameKey)} className="w-full h-48 object-contain bg-slate-50 p-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div className="p-4">
                    <p className="font-bold text-slate-800 text-xl">{t(ex.nameKey)}</p>
                    <p className="text-primary-dark font-semibold text-lg mt-1">{t(ex.levels[sessionLevel - 1].key, ex.levels[sessionLevel - 1].params)}</p>
                    <p className="text-base text-slate-500 mt-1">{t(ex.instructionKey)}</p>
                  </div>
                </div>
              ))}
              <Button onClick={() => setSessionState('active')} className="w-full mt-4">
                {t('start_main_activity' as any)}
              </Button>
            </div>
          )}

          {sessionState === 'cooldown' && (
            <div>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">{t('cooldown_phase_label' as any)}</p>
                <p className="text-blue-600 text-sm">{t('cooldown_phase_desc' as any)}</p>
              </div>
              {cooldownExercises.map((ex, idx) => (
                <div key={idx} className="mb-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <img src={ex.illustrationUrl} alt={t(ex.nameKey)} className="w-full h-48 object-contain bg-slate-50 p-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div className="p-4">
                    <p className="font-bold text-slate-800 text-xl">{t(ex.nameKey)}</p>
                    <p className="text-primary-dark font-semibold text-lg mt-1">{t(ex.levels[sessionLevel - 1].key, ex.levels[sessionLevel - 1].params)}</p>
                    <p className="text-base text-slate-500 mt-1">{t(ex.instructionKey)}</p>
                  </div>
                </div>
              ))}
              <Button onClick={() => setSessionState('incident')} className="w-full mt-4">
                {t('finish_cooldown' as any)}
              </Button>
            </div>
          )}
          {sessionState === 'post' && (
            <div className="flex flex-col items-center justify-center py-8 text-center max-w-lg mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 w-full">
                <p className="text-lg font-bold text-green-800">{t(postMessage)}</p>
              </div>
              <div className="mb-8 w-full">
                <h3 className="text-xl font-bold text-primary mb-4">{t('wellness_question' as any)}</h3>
                <div className="flex justify-center gap-3">
                  {[
                    { score: 1, emoji: '😞' },
                    { score: 2, emoji: '😟' },
                    { score: 3, emoji: '😐' },
                    { score: 4, emoji: '🙂' },
                    { score: 5, emoji: '😄' },
                  ].map(({ score, emoji }) => (
                    <button
                      key={score}
                      onClick={() => setWellnessScore(score)}
                      className={`text-4xl p-3 rounded-xl border-2 transition-all ${
                        wellnessScore === score
                          ? 'border-teal-500 bg-teal-50 scale-110 shadow-md'
                          : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full mb-8">
                <h3 className="text-xl font-bold text-primary mb-4">{t('difficulty_feedback')}</h3>
                <div className="flex flex-col sm:flex-row gap-4">
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
              <Button
                onClick={handleCompleteSession}
                className="w-full"
                disabled={!difficulty}
              >
                {t('complete_session')}
              </Button>
            </div>
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
                            className="w-full border-2 border-amber-500 text-amber-900 bg-amber-50 hover:bg-amber-100"
                        >
                            {t('incident_yes')}
                        </Button>
                        <Button
                            onClick={() => {
                                setIncidentReported(false);
                                setSessionState('post');
                            }}
                            className="w-full"
                        >
                            {t('incident_no')}
                        </Button>
                    </div>
                ) : (
                    <div className="w-full">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
                            <p className="text-amber-900 font-medium">{t('incident_reported')}</p>
                        </div>
                        <Button onClick={() => setSessionState('post')} className="w-full">
                            {t('continue')}
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