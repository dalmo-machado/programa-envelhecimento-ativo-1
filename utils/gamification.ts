import { I18nKeys } from '../localization/es';

export interface Belt {
  key: keyof I18nKeys;
  colorClass: string;
  barColorClass: string;
  minSessions: number;
}

export const belts: Belt[] = [
  { key: 'belt_white',  colorClass: 'bg-slate-100 text-slate-800 border-slate-300',   barColorClass: 'bg-slate-400',  minSessions: 0  },
  { key: 'belt_yellow', colorClass: 'bg-yellow-400 text-slate-900 border-yellow-600', barColorClass: 'bg-yellow-400', minSessions: 4  },
  { key: 'belt_orange', colorClass: 'bg-orange-500 text-white border-orange-600',      barColorClass: 'bg-orange-500', minSessions: 8  },
  { key: 'belt_green',  colorClass: 'bg-green-500 text-white border-green-600',        barColorClass: 'bg-green-500',  minSessions: 12 },
  { key: 'belt_blue',   colorClass: 'bg-blue-500 text-white border-blue-600',          barColorClass: 'bg-blue-500',   minSessions: 16 },
  { key: 'belt_black',  colorClass: 'bg-slate-900 text-white border-slate-950',        barColorClass: 'bg-slate-800',  minSessions: 20 },
];

export const getCurrentBelt = (sessionsCompleted: number): Belt => {
  return [...belts].reverse().find(b => sessionsCompleted >= b.minSessions) || belts[0];
};

export const getNextBelt = (sessionsCompleted: number): Belt | null => {
  const current = getCurrentBelt(sessionsCompleted);
  const currentIndex = belts.findIndex(b => b.key === current.key);
  return currentIndex < belts.length - 1 ? belts[currentIndex + 1] : null;
};

export interface BeltProgress {
  currentBelt: Belt;
  nextBelt: Belt | null;
  sessionsInRange: number;
  sessionsForNextBelt: number;
  progressPercent: number;
  isMaxBelt: boolean;
}

export const getBeltProgress = (sessionsCompleted: number): BeltProgress => {
  const currentBelt = getCurrentBelt(sessionsCompleted);
  const nextBelt = getNextBelt(sessionsCompleted);
  const isMaxBelt = nextBelt === null;

  if (isMaxBelt) {
    return {
      currentBelt,
      nextBelt: null,
      sessionsInRange: sessionsCompleted - currentBelt.minSessions,
      sessionsForNextBelt: 0,
      progressPercent: 100,
      isMaxBelt: true,
    };
  }

  const sessionsInRange = sessionsCompleted - currentBelt.minSessions;
  const sessionsForNextBelt = nextBelt.minSessions - currentBelt.minSessions;
  const progressPercent = Math.min(100, (sessionsInRange / sessionsForNextBelt) * 100);

  return {
    currentBelt,
    nextBelt,
    sessionsInRange,
    sessionsForNextBelt,
    progressPercent,
    isMaxBelt: false,
  };
};

const preSessionMessages: (keyof I18nKeys)[] = [
  'motivational_pre_session',
  'motivational_pre_1',
  'motivational_pre_2',
  'motivational_pre_3',
];

const postSessionMessages: (keyof I18nKeys)[] = [
  'motivational_post_session',
  'motivational_post_1',
  'motivational_post_2',
  'motivational_post_3',
];

export const getRandomPreSessionMessage = (): keyof I18nKeys => {
  const randomIndex = Math.floor(Math.random() * preSessionMessages.length);
  return preSessionMessages[randomIndex];
};

export const getRandomPostSessionMessage = (): keyof I18nKeys => {
  const randomIndex = Math.floor(Math.random() * postSessionMessages.length);
  return postSessionMessages[randomIndex];
};