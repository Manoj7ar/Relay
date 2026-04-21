import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelSpeaking,
  getAvailableVoices,
  isSpeechSynthesisSupported,
  pauseSpeaking,
  resumeSpeaking,
  speak as speakSvc,
  type SpeakOptions,
} from '@/services/speechSynthesisService';

interface UseTTSState {
  speaking: boolean;
  paused: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  lastSpokenText: string | null;
  lastSpokenLang: string | null;
}

const INITIAL: UseTTSState = {
  speaking: false,
  paused: false,
  supported: isSpeechSynthesisSupported(),
  voices: [],
  lastSpokenText: null,
  lastSpokenLang: null,
};

export function useSpeechSynthesis() {
  const [state, setState] = useState<UseTTSState>(INITIAL);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      const voices = await getAvailableVoices();
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, voices }));
      }
    })();
    return () => {
      mountedRef.current = false;
      cancelSpeaking();
    };
  }, []);

  const speak = useCallback(
    async (text: string, opts: SpeakOptions = {}) => {
      if (!isSpeechSynthesisSupported()) return;
      const merged: SpeakOptions = {
        ...opts,
        onEnd: () => {
          if (mountedRef.current) {
            setState((prev) => ({ ...prev, speaking: false, paused: false }));
          }
          opts.onEnd?.();
        },
        onError: (ev) => {
          if (mountedRef.current) {
            setState((prev) => ({ ...prev, speaking: false, paused: false }));
          }
          opts.onError?.(ev);
        },
      };
      setState((prev) => ({
        ...prev,
        speaking: true,
        paused: false,
        lastSpokenText: text,
        lastSpokenLang: opts.lang ?? prev.lastSpokenLang,
      }));
      await speakSvc(text, merged);
    },
    [],
  );

  const cancel = useCallback(() => {
    cancelSpeaking();
    setState((prev) => ({ ...prev, speaking: false, paused: false }));
  }, []);

  const pause = useCallback(() => {
    pauseSpeaking();
    setState((prev) => ({ ...prev, paused: true }));
  }, []);

  const resume = useCallback(() => {
    resumeSpeaking();
    setState((prev) => ({ ...prev, paused: false }));
  }, []);

  const replay = useCallback(() => {
    if (!state.lastSpokenText) return;
    void speak(state.lastSpokenText, {
      lang: state.lastSpokenLang ?? undefined,
    });
  }, [speak, state.lastSpokenText, state.lastSpokenLang]);

  return {
    speaking: state.speaking,
    paused: state.paused,
    supported: state.supported,
    voices: state.voices,
    lastSpokenText: state.lastSpokenText,
    lastSpokenLang: state.lastSpokenLang,
    speak,
    cancel,
    pause,
    resume,
    replay,
  };
}
