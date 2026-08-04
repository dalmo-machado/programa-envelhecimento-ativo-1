
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { useUserRole } from '../context/UserRoleContext';
import { AppFeedback } from '../types';
import Header from '../components/Header';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { I18nKeys } from '../localization/es';

// ─── Question definitions ────────────────────────────────────────────────────

type QuestionType = 'likert' | 'open';

interface Question {
  id: string;
  block: 1 | 2 | 3 | 4;
  type: QuestionType;
  textKey: keyof I18nKeys;
  /** Label shown in the progress section header */
  blockLabelKey: keyof I18nKeys;
}

const QUESTIONS: Question[] = [
  // ── Block 1 — SUS adapted (all positive framing) ──────────────────────────
  { id: 'sus_1',  block: 1, type: 'likert', textKey: 'fb_sus_1',  blockLabelKey: 'fb_block1_label' },
  { id: 'sus_2',  block: 1, type: 'likert', textKey: 'fb_sus_2',  blockLabelKey: 'fb_block1_label' },
  { id: 'sus_3',  block: 1, type: 'likert', textKey: 'fb_sus_3',  blockLabelKey: 'fb_block1_label' },
  { id: 'sus_4',  block: 1, type: 'likert', textKey: 'fb_sus_4',  blockLabelKey: 'fb_block1_label' },
  { id: 'sus_5',  block: 1, type: 'likert', textKey: 'fb_sus_5',  blockLabelKey: 'fb_block1_label' },
  { id: 'sus_6',  block: 1, type: 'likert', textKey: 'fb_sus_6',  blockLabelKey: 'fb_block1_label' },
  { id: 'sus_7',  block: 1, type: 'likert', textKey: 'fb_sus_7',  blockLabelKey: 'fb_block1_label' },
  { id: 'sus_8',  block: 1, type: 'likert', textKey: 'fb_sus_8',  blockLabelKey: 'fb_block1_label' },
  { id: 'sus_9',  block: 1, type: 'likert', textKey: 'fb_sus_9',  blockLabelKey: 'fb_block1_label' },
  { id: 'sus_10', block: 1, type: 'likert', textKey: 'fb_sus_10', blockLabelKey: 'fb_block1_label' },
  // ── Block 2 — Perceived physical improvement ──────────────────────────────
  { id: 'imp_1', block: 2, type: 'likert', textKey: 'fb_imp_1', blockLabelKey: 'fb_block2_label' },
  { id: 'imp_2', block: 2, type: 'likert', textKey: 'fb_imp_2', blockLabelKey: 'fb_block2_label' },
  { id: 'imp_3', block: 2, type: 'likert', textKey: 'fb_imp_3', blockLabelKey: 'fb_block2_label' },
  { id: 'imp_4', block: 2, type: 'likert', textKey: 'fb_imp_4', blockLabelKey: 'fb_block2_label' },
  { id: 'imp_5', block: 2, type: 'likert', textKey: 'fb_imp_5', blockLabelKey: 'fb_block2_label' },
  { id: 'imp_6', block: 2, type: 'likert', textKey: 'fb_imp_6', blockLabelKey: 'fb_block2_label' },
  // ── Block 3 — Program & app experience ───────────────────────────────────
  { id: 'exp_1', block: 3, type: 'likert', textKey: 'fb_exp_1', blockLabelKey: 'fb_block3_label' },
  { id: 'exp_2', block: 3, type: 'likert', textKey: 'fb_exp_2', blockLabelKey: 'fb_block3_label' },
  { id: 'exp_3', block: 3, type: 'likert', textKey: 'fb_exp_3', blockLabelKey: 'fb_block3_label' },
  { id: 'exp_4', block: 3, type: 'likert', textKey: 'fb_exp_4', blockLabelKey: 'fb_block3_label' },
  { id: 'exp_5', block: 3, type: 'likert', textKey: 'fb_exp_5', blockLabelKey: 'fb_block3_label' },
  { id: 'exp_6', block: 3, type: 'likert', textKey: 'fb_exp_6', blockLabelKey: 'fb_block3_label' },
  // ── Block 4 — Open questions ──────────────────────────────────────────────
  { id: 'open_best',    block: 4, type: 'open', textKey: 'fb_open_best',    blockLabelKey: 'fb_block4_label' },
  { id: 'open_improve', block: 4, type: 'open', textKey: 'fb_open_improve', blockLabelKey: 'fb_block4_label' },
];

const TOTAL = QUESTIONS.length; // 24

// Likert scale labels (index 0 = value 1, index 4 = value 5)
const LIKERT_LABEL_KEYS: (keyof I18nKeys)[] = [
  'fb_likert_1', 'fb_likert_2', 'fb_likert_3', 'fb_likert_4', 'fb_likert_5',
];
const LIKERT_COLORS = [
  'bg-red-100 border-red-400 text-red-800',
  'bg-orange-100 border-orange-400 text-orange-800',
  'bg-yellow-100 border-yellow-400 text-yellow-800',
  'bg-lime-100 border-lime-400 text-lime-800',
  'bg-green-100 border-green-400 text-green-800',
];
const LIKERT_SELECTED = [
  'bg-red-500 border-red-600 text-white shadow-lg',
  'bg-orange-500 border-orange-600 text-white shadow-lg',
  'bg-yellow-500 border-yellow-600 text-white shadow-lg',
  'bg-lime-500 border-lime-600 text-white shadow-lg',
  'bg-green-500 border-green-600 text-white shadow-lg',
];

// ─── Component ───────────────────────────────────────────────────────────────

const AppFeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { participants, updateParticipant } = useParticipantData();
  const { participantId } = useUserRole();

  const participant = participants.find(p => p.study_id === participantId);

  // Answers: key = question id, value = number (1–5) | string
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const q = QUESTIONS[currentIndex];
  const answered = answers[q.id] !== undefined && answers[q.id] !== '';
  const pct = Math.round(((currentIndex) / TOTAL) * 100);

  const setAnswer = (val: number | string) => {
    setAnswers(prev => ({ ...prev, [q.id]: val }));
  };

  const goNext = () => {
    if (currentIndex < TOTAL - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const handleSubmit = async () => {
    if (!participantId) return;
    setSubmitting(true);

    const susIds  = ['sus_1','sus_2','sus_3','sus_4','sus_5','sus_6','sus_7','sus_8','sus_9','sus_10'];
    const impIds  = ['imp_1','imp_2','imp_3','imp_4','imp_5','imp_6'];
    const expIds  = ['exp_1','exp_2','exp_3','exp_4','exp_5','exp_6'];

    const feedback: AppFeedback = {
      submitted_at: new Date().toISOString(),
      sus_scores:          susIds.map(id => Number(answers[id] ?? 0)),
      improvement_scores:  impIds.map(id => Number(answers[id] ?? 0)),
      experience_scores:   expIds.map(id => Number(answers[id] ?? 0)),
      open_best:    String(answers['open_best']    ?? ''),
      open_improve: String(answers['open_improve'] ?? ''),
    };

    await updateParticipant(participantId, { app_feedback: feedback });
    navigate('/dashboard');
  };

  // ── Submitted already ────────────────────────────────────────────────────
  if (participant?.app_feedback) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="p-6 flex justify-center">
          <Card className="max-w-lg w-full text-center">
            <p className="text-5xl mb-4">✅</p>
            <h1 className="text-2xl font-bold text-primary-dark mb-2">
              {t('fb_already_submitted' as any)}
            </h1>
            <p className="text-slate-600 mb-6">{t('fb_already_submitted_desc' as any)}</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              {t('back_to_dashboard' as any)}
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  const isLast = currentIndex === TOTAL - 1;

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 flex justify-center">
        <div className="max-w-xl w-full">

          {/* ── Progress ─────────────────────────────────────────────────── */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{t(q.blockLabelKey as any)}</span>
              <span>{currentIndex + 1} / {TOTAL}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* ── Question card ─────────────────────────────────────────────── */}
          <Card className="mb-6">
            <p className="text-lg font-semibold text-slate-800 leading-snug mb-6">
              {t(q.textKey as any)}
            </p>

            {q.type === 'likert' ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((val, idx) => {
                  const selected = answers[q.id] === val;
                  return (
                    <button
                      key={val}
                      onClick={() => setAnswer(val)}
                      className={`flex items-center gap-4 w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                        selected ? LIKERT_SELECTED[idx] : LIKERT_COLORS[idx]
                      }`}
                    >
                      <span className="text-xl font-bold w-6 text-center shrink-0">{val}</span>
                      <span className="text-sm leading-tight">{t(LIKERT_LABEL_KEYS[idx] as any)}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                className="w-full border-2 border-slate-200 rounded-xl p-4 text-slate-700 text-base resize-none focus:outline-none focus:border-primary min-h-[120px]"
                placeholder={t('fb_open_placeholder' as any)}
                value={String(answers[q.id] ?? '')}
                onChange={e => setAnswer(e.target.value)}
              />
            )}
          </Card>

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <div className="flex gap-3">
            {currentIndex > 0 && (
              <Button variant="ghost" onClick={goPrev} className="flex-1">
                {t('fb_prev' as any)}
              </Button>
            )}

            {isLast ? (
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={!answered || submitting}
              >
                {submitting ? t('fb_submitting' as any) : t('fb_submit' as any)}
              </Button>
            ) : (
              <Button
                onClick={goNext}
                className="flex-1"
                disabled={q.type === 'likert' && !answered}
              >
                {t('fb_next' as any)}
              </Button>
            )}
          </div>

          {/* Allow skipping open questions */}
          {q.type === 'open' && !isLast && (
            <button
              onClick={goNext}
              className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600"
            >
              {t('fb_skip' as any)}
            </button>
          )}
          {q.type === 'open' && isLast && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600"
            >
              {t('fb_skip' as any)}
            </button>
          )}

        </div>
      </main>
    </div>
  );
};

export default AppFeedbackPage;
