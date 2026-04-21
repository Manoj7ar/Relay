import type { Urgency } from '@/types/model';

/**
 * Client-side urgency floor.
 *
 * The model can upgrade urgency but rules here can never downgrade a phrase
 * that clearly signals emergency. This protects the patient when the LLM
 * misjudges a distressed utterance as routine.
 */

const HIGH_URGENCY_PHRASES = [
  "can't breathe",
  'cannot breathe',
  'not breathing',
  'breathing',
  'chest pain',
  'heart attack',
  'dying',
  'help me',
  'emergency',
  'call 999',
  'call 911',
  'call 112',
  'pain pain',
  'very bad pain',
  'severe pain',
  'صعوبة في التنفس',
  'لا أستطيع التنفس',
  'ساعدني',
  'ألم شديد',
  'ból',
  'pomocy',
  'nie oddycham',
  'nie mogę oddychać',
];

const MEDIUM_URGENCY_PHRASES = [
  'bathroom',
  'toilet',
  'medicine',
  'medication',
  'fell',
  'fallen',
  'dizzy',
  'nauseous',
  'nausea',
  'łazienka',
  'toaleta',
  'lekarstwo',
  'الحمام',
  'دواء',
];

export function applyUrgencyGuard(
  modelUrgency: Urgency,
  sourceText: string | undefined,
): Urgency {
  if (!sourceText) return modelUrgency;

  const lower = sourceText.toLowerCase();

  const matchesHigh = HIGH_URGENCY_PHRASES.some((phrase) =>
    lower.includes(phrase),
  );
  if (matchesHigh) return 'HIGH';

  if (modelUrgency === 'HIGH') return 'HIGH';

  const matchesMedium = MEDIUM_URGENCY_PHRASES.some((phrase) =>
    lower.includes(phrase),
  );
  if (matchesMedium && modelUrgency === 'LOW') return 'NORMAL';

  return modelUrgency;
}
