// TODO: Wire to Web Speech API (SpeechRecognition + SpeechSynthesis) and/or
// server-side STT once the back-end is available.

export interface SpeechSession {
  stop: () => Promise<string>;
}

export async function startRecording(): Promise<SpeechSession> {
  const started = Date.now();
  return {
    stop: async () => {
      const elapsed = Date.now() - started;
      // Return a mock transcript sized by hold-time so the UI feels live.
      if (elapsed < 700) return 'water';
      if (elapsed < 1500) return 'I need some water please';
      return 'I would like to say something to the nurse';
    },
  };
}

export function speak(_text: string, _lang = 'en-US'): void {
  // TODO: call SpeechSynthesis with the user's banked voice model.
}
