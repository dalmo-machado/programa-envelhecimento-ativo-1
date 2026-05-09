import { Participant } from '../types';

export const INACTIVITY_THRESHOLD_DAYS = 7;

/**
 * Retorna o número de dias inteiros desde a última sessão concluída do participante.
 * Retorna null se não houver nenhuma sessão concluída registrada.
 */
export function getDaysSinceLastSession(participant: Participant): number | null {
  const completedLogs = (participant.session_logs ?? []).filter(l => l.completed);
  if (completedLogs.length === 0) return null;

  const lastMs = completedLogs
    .map(l => new Date(l.session_end).getTime())
    .reduce((max, t) => Math.max(max, t), 0);

  return Math.floor((Date.now() - lastMs) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna true se o participante estiver inativo por mais de `threshold` dias.
 * Participantes que concluíram o programa completo (24 sessões) são excluídos.
 */
export function isInactiveParticipant(
  participant: Participant,
  threshold = INACTIVITY_THRESHOLD_DAYS,
): boolean {
  if (participant.sessions_completed >= 24) return false;
  const days = getDaysSinceLastSession(participant);
  if (days === null) return false;
  return days > threshold;
}
