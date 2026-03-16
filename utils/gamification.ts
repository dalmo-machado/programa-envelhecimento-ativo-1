import { I18nKeys } from '../localization/es';

export interface Belt {
  key: keyof I18nKeys;
  colorClass: string;
  minSessions: number;
}

export const belts: Belt[] = [
  { key: 'belt_white', colorClass: 'bg-slate-100 text-slate-800 border-slate-300', minSessions: 0 },
  { key: 'belt_yellow', colorClass: 'bg-yellow-400 text-yellow-900 border-yellow-500', minSessions: 4 },
  { key: 'belt_orange', colorClass: 'bg-orange-500 text-white border-orange-600', minSessions: 8 },
  { key: 'belt_green', colorClass: 'bg-green-500 text-white border-green-600', minSessions: 12 },
  { key: 'belt_blue', colorClass: 'bg-blue-500 text-white border-blue-600', minSessions: 16 },
  { key: 'belt_black', colorClass: 'bg-slate-900 text-white border-slate-950', minSessions: 20 },
];

export const getCurrentBelt = (sessionsCompleted: number): Belt => {
  return [...belts].reverse().find(b => sessionsCompleted >= b.minSessions) || belts[0];
};

const preSessionMessages: (keyof I18nKeys)[] = [
  'motivational_pre_session',
  'motivational_pre_1',
  'motivational_pre_2',
  'motivational_pre_3'
];

const postSessionMessages: (keyof I18nKeys)[] = [
  'motivational_post_session',
  'motivational_post_1',
  'motivational_post_2',
  'motivational_post_3'
];

export const getRandomPreSessionMessage = (): keyof I18nKeys => {
  const randomIndex = Math.floor(Math.random() * preSessionMessages.length);
  return preSessionMessages[randomIndex];
};

export const getRandomPostSessionMessage = (): keyof I18nKeys => {
  const randomIndex = Math.floor(Math.random() * postSessionMessages.length);
  return postSessionMessages[randomIndex];
};
