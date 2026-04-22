import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Play, Square, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { uid } from '@/lib/id';
import {
  createPlaybackUrl,
  deleteSample,
  getSample,
  putSample,
} from '@/lib/voiceSamples';
import { useSettings } from '@/contexts/SettingsContext';
import { useHaptics } from '@/hooks/useHaptics';
import {
  isSpeechRecognitionSupported,
  startRecognition,
  type RecognitionHandle,
} from '@/services/speechRecognitionService';
import type { SetupRole, VoiceSampleRecord } from '@/types/settings';

interface StepVoiceProps {
  setupRole: SetupRole;
  lang: string;
}

interface PromptRow {
  id: string;
  prompt: string;
}

const PROMPTS: PromptRow[] = [
  { id: 'greeting', prompt: 'Hi, how are you today?' },
  { id: 'help', prompt: 'I need help, please.' },
  { id: 'water', prompt: 'I am thirsty. Could I have some water?' },
  { id: 'rest', prompt: 'I would like to rest for a few minutes.' },
];

type RowStatus = 'idle' | 'recording' | 'saved';

export function StepVoice({ setupRole, lang }: StepVoiceProps) {
  const { settings, dispatch } = useSettings();
  const haptics = useHaptics();

  const samplesById = new Map(
    settings.profile.voiceSamples.map((s) => [s.id, s]),
  );

  const isSelf = setupRole === 'patient';

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {isSelf
          ? 'Read each phrase naturally. Relay uses these to understand the shape of your voice — not to impersonate it.'
          : 'Have them read each phrase naturally. Relay learns how they say common things so it can guess better later.'}
      </p>

      <ul className="space-y-2">
        {PROMPTS.map((p) => (
          <VoiceRow
            key={p.id}
            prompt={p}
            lang={lang}
            existing={samplesById.get(p.id) ?? null}
            onSave={(sample) => {
              haptics('success');
              dispatch({ type: 'ADD_VOICE_SAMPLE', value: sample });
            }}
            onRemove={(id) => {
              haptics('tap');
              dispatch({ type: 'REMOVE_VOICE_SAMPLE', id });
              void deleteSample(id);
            }}
          />
        ))}
      </ul>

      <p className="text-[11px] leading-snug text-muted">
        Audio stays on this device in a private browser database. You can remove
        every sample from <span className="font-medium text-text">Settings</span>
        at any time.
      </p>
    </div>
  );
}

interface VoiceRowProps {
  prompt: PromptRow;
  lang: string;
  existing: VoiceSampleRecord | null;
  onSave: (sample: VoiceSampleRecord) => void;
  onRemove: (id: string) => void;
}

function VoiceRow({
  prompt,
  lang,
  existing,
  onSave,
  onRemove,
}: VoiceRowProps) {
  const [status, setStatus] = useState<RowStatus>(existing ? 'saved' : 'idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<RecognitionHandle | null>(null);
  const startedAtRef = useRef<number>(0);
  const finalTranscriptRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackUrlRef = useRef<string | null>(null);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }, []);

  useEffect(
    () => () => {
      cleanupStream();
      if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
    },
    [cleanupStream],
  );

  const start = useCallback(async () => {
    setError(null);
    setLiveTranscript('');
    finalTranscriptRef.current = '';
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't access the microphone.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = pickMimeType();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      if (isSpeechRecognitionSupported()) {
        recognitionRef.current = startRecognition(
          { lang, continuous: false, interimResults: true },
          {
            onUpdate: (partial) => {
              setLiveTranscript(
                (partial.transcript ?? '') +
                  (partial.interimTranscript
                    ? ' ' + partial.interimTranscript
                    : ''),
              );
            },
            onFinal: (transcript) => {
              finalTranscriptRef.current = transcript;
            },
            onEnd: () => {
              // Recognition session ended on its own; nothing to do here.
            },
          },
        );
      }

      recorder.start();
      startedAtRef.current = performance.now();
      setStatus('recording');
    } catch (err) {
      console.warn('[onboarding voice] mic error', err);
      setError('Microphone access was blocked. You can skip this step.');
      cleanupStream();
      setStatus('idle');
    }
  }, [cleanupStream, lang]);

  const stop = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      cleanupStream();
      setStatus('idle');
      return;
    }
    recognitionRef.current?.stop();

    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.stop();
    await stopped;

    const durationMs = Math.max(
      0,
      Math.round(performance.now() - startedAtRef.current),
    );
    const type = recorder.mimeType || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type });
    chunksRef.current = [];
    cleanupStream();

    const transcript =
      finalTranscriptRef.current.trim() || liveTranscript.trim();

    const audioKey = `sample:${prompt.id}:${uid('v')}`;

    try {
      await putSample(audioKey, blob);
    } catch (err) {
      console.warn('[onboarding voice] indexeddb put failed', err);
      setError("Couldn't save the recording locally. Try again.");
      setStatus('idle');
      return;
    }

    onSave({
      id: prompt.id,
      prompt: prompt.prompt,
      transcript,
      durationMs,
      recordedAt: Date.now(),
      audioKey,
    });
    setStatus('saved');
    setLiveTranscript('');
  }, [cleanupStream, liveTranscript, onSave, prompt.id, prompt.prompt]);

  const play = useCallback(async () => {
    if (!existing) return;
    const blob = await getSample(existing.audioKey);
    if (!blob) {
      setError('Recording is missing — please re-record.');
      return;
    }
    if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
    const url = createPlaybackUrl(blob);
    playbackUrlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.onerror = () => {
      setPlaying(false);
      setError('Playback failed on this device.');
    };
    setPlaying(true);
    try {
      await audio.play();
    } catch {
      setPlaying(false);
    }
  }, [existing]);

  const reRecord = useCallback(() => {
    onRemove(prompt.id);
    setStatus('idle');
  }, [onRemove, prompt.id]);

  const isRecording = status === 'recording';
  const isSaved = status === 'saved';

  return (
    <li className="rounded-xl2 border border-black/10 bg-white/70 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-text">
          "{prompt.prompt}"
        </p>
        {isSaved ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent)]/[0.1] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
            <Check className="h-3 w-3" aria-hidden /> Saved
          </span>
        ) : null}
      </div>

      {existing?.transcript && isSaved ? (
        <p className="mt-1 text-[11px] leading-snug text-muted">
          Heard as:{' '}
          <span className="font-mono text-text">{existing.transcript}</span>
        </p>
      ) : null}

      {isRecording ? (
        <p
          className="mt-1 min-h-[1.1em] truncate text-[11px] font-mono leading-snug text-muted"
          aria-live="polite"
        >
          {liveTranscript || 'Listening…'}
        </p>
      ) : null}

      {error ? (
        <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {!isSaved ? (
          isRecording ? (
            <button
              type="button"
              onClick={() => void stop()}
              aria-label={`Stop recording ${prompt.prompt}`}
              aria-pressed="true"
              className={cn(
                'flex min-h-[40px] items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm',
                'transition-transform duration-200 ease-smooth active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
              )}
            >
              <Square className="h-4 w-4" aria-hidden />
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void start()}
              aria-label={`Record ${prompt.prompt}`}
              className={cn(
                'flex min-h-[40px] items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white shadow-sm',
                'transition-transform duration-200 ease-smooth hover:shadow-md active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
              )}
            >
              <Mic className="h-4 w-4" aria-hidden />
              Record
            </button>
          )
        ) : (
          <>
            <button
              type="button"
              onClick={() => void play()}
              disabled={playing}
              aria-label={`Play back ${prompt.prompt}`}
              className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-sm font-medium text-text shadow-sm transition-[background-color,transform] duration-200 ease-smooth hover:bg-white active:scale-[0.98] disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              <Play className="h-4 w-4" aria-hidden />
              {playing ? 'Playing…' : 'Play'}
            </button>
            <button
              type="button"
              onClick={reRecord}
              aria-label={`Re-record ${prompt.prompt}`}
              className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-sm font-medium text-muted transition-[background-color,transform] duration-200 ease-smooth hover:bg-white hover:text-text active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Re-record
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return undefined;
}
