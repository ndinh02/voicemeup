export type TicketColor = "pink" | "green" | "blue" | "yellow";

export type PhotoFilter = "none" | "bw" | "blur";

export const PHOTO_FILTERS: PhotoFilter[] = ["none", "bw", "blur"];

export interface DrawPath {
  /** hex color of the stroke */
  color: string;
  /** stroke width in the canvas's normalized 0-1000 coordinate space */
  width: number;
  /** flat [x0, y0, x1, y1, ...] pairs, integers 0-1000 */
  points: number[];
}

/** A single card within a voiceme. A link can carry more than one of these, stacked together. */
export interface TicketItem {
  id: string;
  color: TicketColor;
  paths: DrawPath[];
  audioType: string;
  duration: number;
  /** normalized 0-100 amplitude bars, precomputed so playback pages never need to decode audio just to draw a waveform */
  peaks: number[];
  photoType: string;
  photoFilter: PhotoFilter;
}

/** Everything about a voiceme link except the raw audio/photo bytes (kept separate to avoid base64-in-base64 waste). */
export interface TicketBundle {
  v: 3;
  name: string;
  date: string;
  items: TicketItem[];
}

export const TICKET_COLORS: TicketColor[] = ["pink", "green", "blue", "yellow"];

export const COLOR_CLASSES: Record<TicketColor, { bg: string; ink: string }> = {
  pink: { bg: "bg-ticket-pink", ink: "text-ticket-pink-ink" },
  green: { bg: "bg-ticket-green", ink: "text-ticket-green-ink" },
  blue: { bg: "bg-ticket-blue", ink: "text-ticket-blue-ink" },
  yellow: { bg: "bg-ticket-yellow", ink: "text-ticket-yellow-ink" },
};

export const COLOR_HEX: Record<TicketColor, string> = {
  pink: "#f7c9cb",
  green: "#a9cba4",
  blue: "#cdeef4",
  yellow: "#f6ce86",
};
