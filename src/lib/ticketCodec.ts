import { deflate, inflate } from "pako";
import { bytesToBase64Url, base64UrlToBytes } from "./base64url";
import { TICKET_COLORS, type DrawPath, type TicketBundle, type TicketColor, type TicketItem } from "./types";

interface ItemWithAudioLength extends TicketItem {
  audioLength: number;
}

interface BundleMetaWithLengths {
  v: 2;
  name: string;
  date: string;
  items: ItemWithAudioLength[];
}

/**
 * Every one of these numbers is a defensive cap, not a UI limit — a voiceme
 * link is untrusted input the moment it comes from someone else's browser
 * (or is hand-crafted), so decode has to survive a hostile or corrupted
 * payload without hanging, exhausting memory, or throwing somewhere deep in
 * a component render. The UI's own limits (MAX_ITEMS in Create.tsx,
 * MAX_RECORD_SECONDS) are far below these; these exist purely so a
 * malicious link can't do more damage than "fails to open."
 */
const MAX_ENCODED_LENGTH = 6_000_000; // ~6M base64url chars (~4.4MB binary) — far beyond any real bundle
const MAX_META_JSON_LENGTH = 8_000_000; // backstop against decompression bombs
const MAX_ITEMS = 20;
const MAX_PATHS_PER_ITEM = 400;
const MAX_POINTS_PER_PATH = 4000; // 2000 (x,y) pairs
const MAX_PEAKS = 200;
const MAX_STRING_LENGTH = 200;
const MAX_AUDIO_BYTES_PER_ITEM = 15_000_000;

/**
 * A voiceme link carries one or more ticket cards and needs no server or
 * database at all: everything is packed into a single binary blob and
 * base64url-encoded into the URL hash.
 *   [4-byte length][deflated JSON meta][audio blob for item 0][audio blob for item 1]...
 * The metadata (drawing paths, name, per-item audio byte length, etc.) is
 * deflate-compressed since it's plain JSON. Audio is left as-is because it's
 * already compressed (opus) and gzip won't shrink it further; each item's
 * meta carries its own audio byte length so the trailing blob can be sliced
 * back into per-card buffers on decode.
 */
export function encodeTicket(bundle: TicketBundle, audioBuffers: (Uint8Array | null)[]): string {
  const metaWithLengths = {
    ...bundle,
    items: bundle.items.map((item, i) => ({ ...item, audioLength: audioBuffers[i]?.length ?? 0 })),
  };
  const metaCompressed = deflate(JSON.stringify(metaWithLengths));
  const audioTotal = audioBuffers.reduce((sum, a) => sum + (a?.length ?? 0), 0);

  const combined = new Uint8Array(4 + metaCompressed.length + audioTotal);
  new DataView(combined.buffer).setUint32(0, metaCompressed.length, false);
  combined.set(metaCompressed, 4);

  let offset = 4 + metaCompressed.length;
  for (const audio of audioBuffers) {
    if (audio) {
      combined.set(audio, offset);
      offset += audio.length;
    }
  }

  return bytesToBase64Url(combined);
}

export function decodeTicket(encoded: string): { bundle: TicketBundle; audioBuffers: (Uint8Array | null)[] } {
  if (typeof encoded !== "string" || encoded.length === 0) {
    throw new Error("Empty voiceme link.");
  }
  if (encoded.length > MAX_ENCODED_LENGTH) {
    throw new Error("This link is too large to be a real voiceme.");
  }

  const combined = base64UrlToBytes(encoded);
  if (combined.length < 4) {
    throw new Error("Voiceme link is truncated.");
  }
  const metaLen = new DataView(combined.buffer, combined.byteOffset, 4).getUint32(0, false);
  if (metaLen <= 0 || 4 + metaLen > combined.length) {
    throw new Error("Voiceme link is corrupted.");
  }
  const metaCompressed = combined.subarray(4, 4 + metaLen);
  const audioRegion = combined.subarray(4 + metaLen);

  const metaJson = inflate(metaCompressed, { toText: true });
  if (metaJson.length > MAX_META_JSON_LENGTH) {
    throw new Error("Voiceme data is unexpectedly large.");
  }

  const parsed: unknown = JSON.parse(metaJson);
  const result = sanitizeBundle(parsed, audioRegion);
  if (result.bundle.items.length === 0) {
    throw new Error("Voiceme link has no valid cards.");
  }
  return result;
}

/**
 * `JSON.parse` only guarantees valid JSON, not that it matches
 * `BundleMetaWithLengths` — a hand-crafted or corrupted link can produce
 * any shape at all. Every field below is validated and clamped rather than
 * trusted, so malformed input degrades to a smaller/emptier bundle instead
 * of throwing deep inside a component render.
 */
function sanitizeBundle(parsed: unknown, audioRegion: Uint8Array): { bundle: TicketBundle; audioBuffers: (Uint8Array | null)[] } {
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Voiceme data is malformed.");
  }
  const raw = parsed as Partial<BundleMetaWithLengths>;
  if (!Array.isArray(raw.items)) {
    throw new Error("Voiceme data is malformed.");
  }

  const audioBuffers: (Uint8Array | null)[] = [];
  let offset = 0;
  const items: TicketItem[] = [];

  for (const rawItem of raw.items.slice(0, MAX_ITEMS)) {
    const audioLength = clampInt((rawItem as Partial<ItemWithAudioLength>)?.audioLength, 0, 0, MAX_AUDIO_BYTES_PER_ITEM);
    const bytes = audioLength > 0 && offset + audioLength <= audioRegion.length ? audioRegion.subarray(offset, offset + audioLength) : null;
    offset += audioLength;

    const item = sanitizeItem(rawItem);
    if (item) {
      items.push(item);
      audioBuffers.push(bytes);
    }
  }

  return {
    bundle: {
      v: 2,
      name: sanitizeString(raw.name, MAX_STRING_LENGTH),
      date: sanitizeString(raw.date, MAX_STRING_LENGTH) || "—",
      items,
    },
    audioBuffers,
  };
}

function sanitizeItem(raw: unknown): TicketItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Partial<TicketItem>;

  const color: TicketColor = TICKET_COLORS.includes(r.color as TicketColor) ? (r.color as TicketColor) : "pink";
  const paths = Array.isArray(r.paths) ? r.paths.slice(0, MAX_PATHS_PER_ITEM).map(sanitizePath).filter((p): p is DrawPath => p !== null) : [];
  const peaks = Array.isArray(r.peaks)
    ? r.peaks.slice(0, MAX_PEAKS).map((n) => clampInt(n, 0, 0, 100))
    : [];

  return {
    id: sanitizeString(r.id, 20) || "00000",
    color,
    paths,
    audioType: sanitizeString(r.audioType, MAX_STRING_LENGTH),
    duration: clampInt(r.duration, 0, 0, 120),
    peaks,
  };
}

function sanitizePath(raw: unknown): DrawPath | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Partial<DrawPath>;
  if (!Array.isArray(r.points)) return null;

  const points = r.points
    .slice(0, MAX_POINTS_PER_PATH)
    .map((n) => clampInt(n, 0, -1000, 2000))
    .filter((n) => Number.isFinite(n));
  if (points.length < 2) return null;

  return {
    color: sanitizeString(r.color, 20) || "#17130f",
    width: clampInt(r.width, 9, 1, 100),
    points,
  };
}

function sanitizeString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(min, n));
}

export function randomTicketId(): string {
  return String(Math.floor(Math.random() * 100000)).padStart(5, "0");
}
