
import React from 'react';
import { X } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { PersonalizedSession } from '../types';
import { trainingPrograms } from '../services/trainingData';

interface SessionModalProps {
  sessionIndex: number;
  session: PersonalizedSession;
  onClose: () => void;
}

const SessionModal: React.FC<SessionModalProps> = ({ sessionIndex, session, onClose }) => {
  const { t } = useLocalization();
  const program = trainingPrograms[session.sessionType];
  const levelIdx = session.level - 1;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mt-10 mb-10">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-primary-dark">
              {t('session_number_label', { number: sessionIndex + 1 })} — {t(program.titleKey)}
            </h2>
            <p className="text-slate-500 mt-1">
              {t('session_modal_level' as any, { level: session.level })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-lg transition-colors ml-4 shrink-0"
          >
            <X size={14} />
            {t('close_modal' as any)}
          </button>
        </div>

        {/* Exercise list */}
        <div className="divide-y divide-slate-100">
          {program.exercises.map((exercise, i) => {
            const duration = exercise.levels[levelIdx];
            return (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <span className="font-semibold text-slate-700">{t(exercise.nameKey)}</span>
                <span className="ml-4 text-secondary font-bold whitespace-nowrap">
                  {t(duration.key, duration.params)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
