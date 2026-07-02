import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PaperclipIcon } from "./icons";

export interface TicketPhoto {
  bytes: Uint8Array;
  mimeType: string;
}

interface Props {
  photo: TicketPhoto | null;
}

/**
 * The photo sits where a clipped-on piece of paper would: a slightly
 * tilted square print with a wire paperclip slid diagonally over its top
 * corner. Clicking it opens a full-viewport zoom via a portal (rendering it
 * as a child of the ticket would put it inside the ticket's own transformed
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

  return (
    <>
      <div className="absolute right-[4cqw] top-[58cqw] z-10 w-[30cqw] rotate-[-4deg] drop-shadow-md">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="View photo full size"
          className="block w-full overflow-hidden rounded-[0.8cqw] border-[0.5cqw] border-paper bg-paper shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
        >
          <span className="block aspect-square w-full overflow-hidden bg-ink/10">
            <img src={url} alt="" className="h-full w-full object-cover" />
          </span>
        </button>
        <PaperclipIcon className="absolute -top-[9cqw] -right-[3cqw] h-[18cqw] w-[7.5cqw] rotate-[38deg] drop-shadow-sm" />
      </div>

      {zoomed &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-8"
            onClick={() => setZoomed(false)}
          >
            <img src={url} alt="" onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
          </div>,
          document.body,
        )}
    </>
  );
}
