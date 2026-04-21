import { uid } from '@/lib/id';
import type { Interpretation } from '@/types/model';

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  language: string;
  direction: 'ltr' | 'rtl';
  interpretation: Omit<Interpretation, 'id' | 'ts'>;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'breakfast',
    title: 'Breakfast request',
    description: 'Morning routine, low urgency, E4B fine-tuned.',
    language: 'en-US',
    direction: 'ltr',
    interpretation: {
      primary: 'I am ready for breakfast.',
      alternates: ['I would like to eat.', 'Please bring my meal.'],
      confidence: 0.9,
      urgency: 'LOW',
      mood: 'calm',
      detectedLanguage: 'en-US',
      translation: 'Estoy listo para desayunar.',
      model: 'E4B',
      latencyMs: 820,
      inputType: 'speech',
      visionUsed: false,
      sourceFragment: 'bre... bek..',
    },
  },
  {
    id: 'toilet',
    title: 'Bathroom / Toilet',
    description: 'Common phrase, symbol-driven, E4B.',
    language: 'en-US',
    direction: 'ltr',
    interpretation: {
      primary: 'I need to use the bathroom.',
      alternates: ['I need the toilet.', 'Please help me to the washroom.'],
      confidence: 0.86,
      urgency: 'NORMAL',
      mood: 'calm',
      detectedLanguage: 'en-US',
      translation: 'Necesito ir al baño.',
      model: 'E4B',
      latencyMs: 760,
      inputType: 'symbols',
      visionUsed: false,
      sourceFragment: 'Toilet',
    },
  },
  {
    id: 'cold',
    title: 'Cold / adjust temperature',
    description: 'SmartThings action candidate, E2B.',
    language: 'en-US',
    direction: 'ltr',
    interpretation: {
      primary: 'I feel cold. Please raise the temperature.',
      alternates: ['I am cold.', 'Please bring a blanket.'],
      confidence: 0.83,
      urgency: 'LOW',
      mood: 'calm',
      detectedLanguage: 'en-US',
      translation: 'Tengo frío. Por favor suba la temperatura.',
      model: 'E2B',
      latencyMs: 480,
      inputType: 'speech',
      visionUsed: false,
      sourceFragment: 'c..cold',
      actionTaken: 'SmartThings: thermostat +2°',
    },
  },
  {
    id: 'respiratory',
    title: 'Respiratory distress (Arabic)',
    description: 'RTL, vision + voice, HIGH urgency → 27B.',
    language: 'ar-EG',
    direction: 'rtl',
    interpretation: {
      primary: 'لا أستطيع التنفس. أحتاج إلى مساعدة الآن.',
      alternates: [
        'أحتاج إلى الطبيب.',
        'اتصل بسيارة الإسعاف من فضلك.',
      ],
      confidence: 0.71,
      urgency: 'HIGH',
      mood: 'distressed',
      detectedLanguage: 'ar-EG',
      translation: "I can't breathe. I need help right now.",
      model: '27B',
      latencyMs: 8200,
      inputType: 'vision+speech',
      visionUsed: true,
      sourceFragment: 'لا ... أستطيع ...',
    },
  },
];

export function instantiateScenario(scenario: DemoScenario): Interpretation {
  return {
    ...scenario.interpretation,
    id: uid('demo'),
    ts: Date.now(),
  };
}
