import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { photoFilterCss } from "../lib/camera";
import { ClipIcon } from "./icons";
import type { PhotoFilter } from "../lib/types";

export interface TicketPhoto {
  bytes: Uint8Array;
  mimeType: string;
  filter: PhotoFilter;
}

interface Props {
  photo: TicketPhoto | null;
}

/**
 * The photo is rendered as a small polaroid "clipped" onto the ticket —
 * tilted a few degrees with a binder-clip graphic overlapping its top edge.
 * Clicking it opens a full-viewport zoom via a portal (rendering it as a
 * child of the ticket would put it inside the ticket's own transformed
 * stacking context from TicketStack's swipe animation, which breaks
 * `position: fixed` from covering the real viewport). Clicking anywhere on
 * that overlay other than the photo itself closes it again.
 */
export default function TicketPhoto({ photo }: Props) {
  const [zoomed, setZoomed] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photo || photo.bytes.length === 0) {
      setUrl(null);
      return;
    }
    const blob = new Blob([photo.bytes as BlobPart], { type: photo.mimeType });
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  if (!photo || !url) return null;
  const filterCss = photoFilterCss(photo.filter);

  return (
    <>
      <div className="absolute right-[3cqw] top-[58cqw] z-10 w-[30cqw] rotate-[7deg] drop-shadow-md">
        <ClipIcon className="absolute left-1/2 top-[-7cqw] h-[10cqw] w-[15cqw] -translate-x-1/2 text-ink/80" />
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="View photo full size"
          className="block w-full overflow-hidden rounded-[1.5cqw] border-[0.8cqw] border-paper bg-paper shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
        >
          <span className="block aspect-square w-full overflow-hidden bg-ink/10">
            <img src={url} alt="" className="h-full w-full object-cover" style={{ filter: filterCss }} />
          </span>
        </button>
      </div>

      {zoomed &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-8"
            onClick={() => setZoomed(false)}
          >
            <img
              src={url}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              style={{ filter: filterCss }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
