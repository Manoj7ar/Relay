import { uid } from '@/lib/id';
import type { Interpretation } from '@/types/model';

/** Hackathon judge categories (one scenario each in the default set). */
export type JudgeCategory =
  | 'fragmented'
  | 'multilingual'
  | 'smarthome'
  | 'emergency';

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  /** Judge helper: what the demo will show step-by-step */
  whatYouWillSee: string;
  judgeCategory: JudgeCategory;
  /** Log line; should align with `chooseModel` rules for this input */
  routingReasonExplicit: string;
  language: string;
  direction: 'ltr' | 'rtl';
  interpretation: Omit<Interpretation, 'id' | 'ts'>;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'breakfast',
    title: 'Breakfast request',
    description: 'Morning routine, low urgency, E4B fine-tuned.',
    whatYouWillSee:
      'Fragmented ASR → reconstructed phrase, bilingual caregiver line, E4B.',
    judgeCategory: 'fragmented',
    routingReasonExplicit:
      'Short speech → real-time path; demo pins E4B for personalized phrasing.',
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
    whatYouWillSee:
      'Symbol tap → expanded intent; Spanish caregiver translation.',
    judgeCategory: 'multilingual',
    routingReasonExplicit:
      'Symbol input → fine-tuned phrase expansion (E4B).',
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
    whatYouWillSee:
      'Interpretation + suggested smart-home action (thermostat).',
    judgeCategory: 'smarthome',
    routingReasonExplicit: 'Short speech → real-time inference (E2B).',
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
    whatYouWillSee:
      'RTL layout, multimodal path, HIGH urgency + emergency countdown.',
    judgeCategory: 'emergency',
    routingReasonExplicit:
      'Camera + speech → multimodal reasoning (27B). High-stakes safety.',
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
