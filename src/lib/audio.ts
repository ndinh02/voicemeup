export const MAX_RECORD_SECONDS = 20;
export const PEAK_BARS = 20;

const CANDIDATE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

export function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of CANDIDATE_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return blob.arrayBuffer().then((buf) => new Uint8Array(buf));
}

/** Decode audio bytes and reduce them to a fixed number of normalized (0-100) amplitude bars. */
export async function computePeaks(bytes: Uint8Array, barCount = PEAK_BARS): Promise<number[]> {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const arrayBuffer = bytes.slice().buffer as ArrayBuffer;
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channel = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channel.length / barCount));
    const peaks: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const start = i * blockSize;
      let sum = 0;
      for (let j = 0; j < blockSize && start + j < channel.length; j++) {
        sum += Math.abs(channel[start + j]);
      }
      peaks.push(sum / blockSize);
    }
    const max = Math.max(...peaks, 0.0001);
    return peaks.map((p) => Math.round((p / max) * 100));
  } finally {
    ctx.close();
  }
}
