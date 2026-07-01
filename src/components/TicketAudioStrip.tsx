import { useEffect, useRef, useState } from "react";
import Waveform from "./Waveform";

export interface TicketAudio {
  bytes: Uint8Array;
  mimeType: string;
  duration: number;
  peaks: number[];
}

interface Props {
  audio: TicketAudio | null;
}

export default function TicketAudioStrip({ audio }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      audioElRef.current?.pause();
    },
    [],
  );

  if (!audio) return null;
  const isDecorative = audio.bytes.length === 0;

  const toggle = () => {
    if (isDecorative) return;
    if (!audioElRef.current) {
      const blob = new Blob([audio.bytes as BlobPart], { type: audio.mimeType });
      urlRef.current = URL.createObjectURL(blob);
      const el = new Audio(urlRef.current);
      el.addEventListener("timeupdate", () => setProgress(el.duration ? el.currentTime / el.duration : 0));
      el.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
      });
      audioElRef.current = el;
    }
    if (isPlaying) {
      audioElRef.current.pause();
      setIsPlaying(false);
    } else {
      void audioElRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex w-full items-center gap-[3.5cqw]">
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
        aria-disabled={isDecorative}
        className={`flex h-[24cqw] w-[24cqw] shrink-0 items-center justify-center rounded-full border-2 border-current ${
          isDecorative ? "cursor-default" : ""
        }`}
      >
        {isPlaying ? (
          <span className="flex gap-[1.6cqw]">
            <span className="h-[8cqw] w-[1.8cqw] bg-current" />
            <span className="h-[8cqw] w-[1.8cqw] bg-current" />
          </span>
        ) : (
          <span className="ml-[0.8cqw] h-0 w-0 border-y-[4.4cqw] border-l-[7cqw] border-y-transparent border-l-current" />
        )}
      </button>
      <div className="h-[9cqw] min-w-0 flex-1 overflow-hidden">
        <Waveform peaks={audio.peaks} progress={progress} activeColorClass="bg-current" idleColorClass="bg-current/35" />
      </div>
      <span className="shrink-0 font-mono text-[3cqw] opacity-70">
        {String(Math.floor(audio.duration / 60)).padStart(2, "0")}:{String(audio.duration % 60).padStart(2, "0")}
      </span>
    </div>
  );
}
