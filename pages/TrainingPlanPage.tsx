
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { useUserRole } from '../context/UserRoleContext';
import { trainingPrograms } from '../services/trainingData';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Header from '../components/Header';
import SessionModal from '../components/SessionModal';

const TrainingPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { participants } = useParticipantData();
  const { participantId } = useUserRole();
  const [modalSessionIndex, setModalSessionIndex] = useState<number | null>(null);

  const participant = participants.find(p => p.study_id === participantId);

  if (!participant || !participant.training_plan || participant.training_plan.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="p-8">
          <Card>
            <p>{t('training_plan_not_generated')}</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">{t('back_button')}</Button>
          </Card>
        </main>
      </div>
    );
  }

  const plan = participant.training_plan;
  const weeks: typeof plan[] = [];
  for (let i = 0; i < plan.length; i += 3) {
    weeks.push(plan.slice(i, i + 3));
  }

  const modalSession = modalSessionIndex !== null ? plan[modalSessionIndex] : null;

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 md:p-8 flex justify-center">
        <Card className="max-w-4xl w-full">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">{t('my_training_plan_title')}</h1>
          <p className="text-lg text-slate-600 mb-2">{t('training_plan_desc')}</p>
          <p className="text-sm text-slate-500 mb-8">{t('click_session_hint' as any)}</p>

          <div className="space-y-8">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex}>
                <h2 className="text-2xl font-bold text-primary mb-4 border-b-2 border-accent pb-2">
                  {t('week')} {weekIndex + 1}
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {week.map((session, sessionIndex) => {
                    const overallIndex = weekIndex * 3 + sessionIndex;
                    const isCompleted = overallIndex < participant.sessions_completed;
                    const isNext = overallIndex === participant.sessions_completed;

                    return (
                      <button
                        key={sessionIndex}
                        onClick={() => setModalSessionIndex(overallIndex)}
                        className={`p-4 rounded-lg border-2 text-left w-full transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary
                          ${isNext ? 'bg-secondary/10 border-secondary' : 'bg-slate-50 border-slate-200'}
                          ${isCompleted ? 'opacity-60' : ''}
                        `}
                      >
                        <p className="font-bold text-slate-500">{t('day')} {sessionIndex + 1}</p>
                        <p className="text-xl font-bold text-primary-dark mt-1">
                          {t(trainingPrograms[session.sessionType].titleKey)}
                        </p>
                        <p className="text-md text-slate-600">{t('level')} {session.level}</p>
                        {isCompleted && <p className="text-xs font-bold text-green-600 mt-2">{t('completed')}</p>}
                        {isNext && <p className="text-xs font-bold text-secondary mt-2">{t('next_session')}</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="w-full sm:w-auto mt-10">
            {t('back_button')}
          </Button>
        </Card>
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

export default TrainingPlanPage;
