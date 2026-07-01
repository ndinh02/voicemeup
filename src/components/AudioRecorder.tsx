import { useCallback, useEffect, useRef, useState } from "react";
import Waveform from "./Waveform";
import { MAX_RECORD_SECONDS, blobToUint8Array, computePeaks, getSupportedMimeType } from "../lib/audio";

export interface RecordedAudio {
  bytes: Uint8Array;
  mimeType: string;
  duration: number;
  peaks: number[];
}

interface Props {
  value: RecordedAudio | null;
  onChange: (value: RecordedAudio | null) => void;
}

type Phase = "idle" | "requesting" | "recording" | "processing";

export default function AudioRecorder({ value, onChange }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(
    () => () => {
      isMountedRef.current = false;
      stopTimer();
      stopStream();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  const finishRecording = useCallback(async () => {
    // Guards against a card being switched (unmounting this recorder) while
    // recording was still in flight: without this, onChange would fire on a
    // stale closure and attribute the clip to whatever card is now active.
    if (!isMountedRef.current) return;
    setPhase("processing");
    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    const duration = Math.min(MAX_RECORD_SECONDS, Math.round((Date.now() - startRef.current) / 1000));
    try {
      const bytes = await blobToUint8Array(blob);
      const peaks = await computePeaks(bytes).catch(() => Array.from({ length: 20 }, () => 30));
      if (!isMountedRef.current) return;
      onChange({ bytes, mimeType, duration: duration || 1, peaks });
    } catch {
      if (isMountedRef.current) setError("Couldn't process that recording — try again.");
    } finally {
      if (isMountedRef.current) setPhase("idle");
    }
  }, [onChange]);

  const startRecording = async () => {
    setError(null);
    setPhase("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getSupportedMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stopStream();
        void finishRecording();
      };
      recorder.start();
      startRef.current = Date.now();
      setElapsed(0);
      setPhase("recording");
      timerRef.current = window.setInterval(() => {
        const secs = (Date.now() - startRef.current) / 1000;
        setElapsed(secs);
        if (secs >= MAX_RECORD_SECONDS) {
          mediaRecorderRef.current?.stop();
          stopTimer();
        }
      }, 100);
    } catch {
      setPhase("idle");
      setError("Microphone access denied — allow it to record a voice note.");
    }
  };

  const stopRecording = () => {
    stopTimer();
    mediaRecorderRef.current?.stop();
  };

  const rerecord = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
    onChange(null);
  };

  const togglePlay = () => {
    if (!value) return;
    if (!audioRef.current) {
      const blob = new Blob([value.bytes as BlobPart], { type: value.mimeType });
      objectUrlRef.current = URL.createObjectURL(blob);
      const audio = new Audio(objectUrlRef.current);
      audio.addEventListener("timeupdate", () => {
        setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
      });
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
      });
      audioRef.current = audio;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      void audioRef.current.play();
      setIsPlaying(true);
    }
  };

  if (phase === "recording") {
    const remaining = MAX_RECORD_SECONDS - elapsed;
    return (
      <div className="flex items-center gap-3 rounded-full border-2 border-ink px-4 py-2.5">
        <button
          type="button"
          onClick={stopRecording}
          aria-label="Stop recording"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink"
        >
          <span className="h-3.5 w-3.5 rounded-[3px] bg-paper" />
        </button>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-600 animate-rec-pulse" />
        <span className="font-mono text-sm tabular-nums">{formatTime(elapsed)}</span>
        <span className="font-mono text-xs text-ink/50">/ {formatTime(remaining < 0 ? 0 : MAX_RECORD_SECONDS)}</span>
      </div>
    );
  }

  if (value) {
    return (
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink"
        >
          {isPlaying ? (
            <span className="flex gap-[3px]">
              <span className="h-4 w-[3px] bg-ink" />
              <span className="h-4 w-[3px] bg-ink" />
            </span>
          ) : (
            <span
              className="ml-0.5 h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-ink"
            />
          )}
        </button>
        <div className="h-10 flex-1">
          <Waveform peaks={value.peaks} progress={progress} />
        </div>
        <span className="font-mono text-xs text-ink/60 shrink-0">{formatTime(value.duration)}</span>
        <button
          type="button"
          onClick={rerecord}
          aria-label="Record again"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink text-sm"
        >
          ↺
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={startRecording}
        disabled={phase === "requesting" || phase === "processing"}
        aria-label="Record a voice note"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink disabled:opacity-40"
      >
        🎙
      </button>
      <span className="font-mono text-xs text-ink/60">
        {phase === "processing" ? "processing…" : `tap to record (up to ${MAX_RECORD_SECONDS}s)`}
      </span>
      {error && <span className="font-mono text-xs text-red-600">{error}</span>}
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
