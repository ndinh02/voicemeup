import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { decodeTicket } from "./ticketCodec";
import type { TicketBundle } from "./types";

interface Decoded {
  bundle: TicketBundle;
  audioBuffers: (Uint8Array | null)[];
}

/**
 * A voiceme link comes in two shapes:
 *   /t/:id      — short server-backed link; fetch the encoded payload from
 *                 the API, then decode it the same way as before.
 *   /t#<data>   — the original fully self-contained link (still supported so
 *                 links already sent before short links existed keep working,
 *                 and so sharing degrades gracefully if the API is down).
 * Depends on react-router's reactive `location.hash`/params (not a one-time
 * read of `window.location`) so that landing on a second link while the app
 * is already mounted on that route re-decodes instead of silently continuing
 * to show the previous link's ticket.
 */
export function useTicket(): { data: Decoded | null; error: string | null; loading: boolean } {
  const { id } = useParams<{ id?: string }>();
  const { hash } = useLocation();
  const [data, setData] = useState<Decoded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setData(null);
      setError(null);
      setLoading(true);
      fetch(`/api/tickets/${id}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(res.status === 404 ? "This voiceme has expired or the link is invalid." : "Couldn't load this voiceme.");
          }
          const { data: encoded } = (await res.json()) as { data: string };
          setData(decodeTicket(encoded));
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Couldn't load this voiceme.");
        })
        .finally(() => setLoading(false));
      return;
    }

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
  }, [id, hash]);

  return { data, error, loading };
}
