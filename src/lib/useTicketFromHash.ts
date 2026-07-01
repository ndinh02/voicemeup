import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { decodeTicket } from "./ticketCodec";
import type { TicketBundle } from "./types";

interface Decoded {
  bundle: TicketBundle;
  audioBuffers: (Uint8Array | null)[];
}

/**
 * Reads the ticket out of the URL hash. Depends on react-router's reactive
 * `location.hash` (not a one-time read of `window.location.hash`) so that
 * landing on a second `/t#...` or `/share#...` link while the app is
 * already mounted on that route — e.g. tapping another shared voiceme link
 * inside an in-app browser that reuses the tab — re-decodes instead of
 * silently continuing to show the previous link's ticket.
 */
export function useTicketFromHash(): { data: Decoded | null; error: string | null } {
  const { hash } = useLocation();
  const [data, setData] = useState<Decoded | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = hash.replace(/^#/, "");
    if (!raw) {
      setData(null);
      setError("No voiceme data found in this link.");
      return;
    }
    try {
      setData(decodeTicket(raw));
      setError(null);
    } catch {
      setData(null);
      setError("This link looks broken or incomplete.");
    }
  }, [hash]);

  return { data, error };
}
