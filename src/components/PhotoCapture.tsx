import { useEffect, useRef, useState } from "react";
import { captureSquarePhoto, PHOTO_MIME_TYPE, type CameraFacing } from "../lib/camera";

export interface CapturedPhoto {
  bytes: Uint8Array;
  mimeType: string;
}

interface Props {
  value: CapturedPhoto | null;
  onChange: (value: CapturedPhoto | null) => void;
}

type Phase = "idle" | "requesting" | "live" | "processing";

export default function PhotoCapture({ value, onChange }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [facing, setFacing] = useState<CameraFacing>("user");
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (!value) {
      setPhotoUrl(null);
      return;
    }
    const blob = new Blob([value.bytes as BlobPart], { type: value.mimeType });
    const url = URL.createObjectURL(blob);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const openCamera = async (nextFacing: CameraFacing) => {
    setError(null);
    setPhase("requesting");
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: nextFacing } });
      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      setFacing(nextFacing);
      setPhase("live");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      if (isMountedRef.current) {
        setPhase("idle");
        setError("Camera access denied — allow it to take a photo.");
      }
    }
  };

  const switchCamera = () => {
    void openCamera(facing === "user" ? "environment" : "user");
  };

  const closeCamera = () => {
    stopStream();
    setPhase("idle");
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    setPhase("processing");
    try {
      const bytes = await captureSquarePhoto(video, facing);
      stopStream();
      if (!isMountedRef.current) return;
      onChange({ bytes, mimeType: PHOTO_MIME_TYPE });
      setPhase("idle");
    } catch {
      if (isMountedRef.current) {
        setPhase("live");
        setError("Couldn't process that photo — try again.");
      }
    }
  };

  const retake = () => {
    onChange(null);
    setError(null);
  };

  if (phase === "live" || phase === "requesting") {
    return (
      <div className="w-full">
        <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl border-2 border-ink bg-ink/5">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
          />
          {phase === "requesting" && (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-ink/50">starting camera…</div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={closeCamera}
            aria-label="Cancel"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink text-sm"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={phase !== "live"}
            aria-label="Take photo"
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-ink bg-paper disabled:opacity-40"
          >
            <span className="h-12 w-12 rounded-full bg-ink" />
          </button>
          <button
            type="button"
            onClick={switchCamera}
            aria-label="Switch camera"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink text-sm"
          >
            ⟲
          </button>
        </div>
      </div>
    );
  }

  if (value && photoUrl) {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <div className="aspect-square w-full max-w-[200px] overflow-hidden rounded-xl border-2 border-ink">
          <img src={photoUrl} alt="Your photo" className="h-full w-full object-cover" />
        </div>
        <button type="button" onClick={retake} aria-label="Retake photo" className="font-mono text-xs underline decoration-dotted underline-offset-4">
          retake
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => void openCamera(facing)}
        aria-label="Take a photo"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink disabled:opacity-40"
      >
        📷
      </button>
      <span className="font-mono text-xs text-ink/60">tap to take a photo</span>
      {error && <span className="font-mono text-xs text-red-600">{error}</span>}
    </div>
  );
}
