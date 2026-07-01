import DrawingSvg from "./DrawingSvg";
import TicketAudioStrip, { type TicketAudio } from "./TicketAudioStrip";
import { AsteriskIcon, FlowerCorner } from "./icons";
import { COLOR_CLASSES, type DrawPath, type TicketColor } from "../lib/types";

interface Props {
  color: TicketColor;
  ticketId: string;
  dateStr: string;
  paths: DrawPath[];
  audio: TicketAudio | null;
  headlineTop?: string;
  headlineBottom?: string;
  className?: string;
}

/**
 * Sized entirely in container-query units (cqw) so the ticket looks
 * identical whether it's the full-width hero card or the small "PREVIEW"
 * thumbnail on the design page — everything scales together as one unit
 * instead of fixed-px text overlapping percentage-sized decoration.
 *
 * Proportions below were measured pixel-for-pixel off interface/Artboard1_5.png
 * (card width = 100cqw): burst corner is ~32cqw square, the headline is
 * right-aligned flush with the ticket id's right margin (not left-aligned
 * under the burst), and the play button is a large ~24cqw outline circle.
 */
export default function TicketCard({
  color,
  ticketId,
  dateStr,
  paths,
  audio,
  headlineTop = "You have",
  headlineBottom = "a new voiceme!",
  className = "",
}: Props) {
  const { bg, ink } = COLOR_CLASSES[color];

  return (
    <div className={`relative w-full overflow-hidden rounded-[9cqw] @container ${bg} ${ink} ${className}`}>
      <FlowerCorner className="absolute left-0 top-0 h-[32cqw] w-[32cqw]" />

      <div className="relative px-[5.5cqw] pt-[5.5cqw]">
        <div className="text-right">
          <div className="font-mono text-[2.6cqw] tracking-wide opacity-60">#{ticketId}</div>
          <h3 className="mt-[1.5cqw] font-sans text-[8.5cqw] font-extrabold leading-[1.05]">{headlineTop}</h3>
          <h3 className="font-sans text-[7cqw] font-extrabold leading-[1.05]">{headlineBottom}</h3>
        </div>

        <div className="mt-[6cqw] flex justify-between font-sans text-[3.6cqw] font-medium leading-[1.15] opacity-80">
          <span>
            The
            <br />
            person
            <br />
            draws
          </span>
          <span className="text-right">
            this
            <br />
            for
            <br />
            you
          </span>
        </div>

        <div className="relative mt-[6cqw] aspect-[16/10] w-full border-2 border-current bg-white/35">
          <span className="absolute -left-[1.3cqw] -top-[1.3cqw] h-[2.6cqw] w-[2.6cqw] bg-current" />
          <span className="absolute -bottom-[1.3cqw] left-[26%] h-[2.6cqw] w-[2.6cqw] bg-current" />
          <span className="absolute -right-[1.3cqw] top-1/2 h-[2.6cqw] w-[2.6cqw] -translate-y-1/2 bg-current" />
          <DrawingSvg paths={paths} className="h-full w-full p-[2cqw]" />
        </div>

        <div className="mt-[4.2cqw] flex items-end justify-between pb-[5.5cqw]">
          <div>
            <div className="font-mono text-[2.8cqw] uppercase tracking-wide opacity-60">date</div>
            <div className="font-display text-[7cqw] font-semibold">{dateStr}</div>
          </div>
          <AsteriskIcon className="h-[7.5cqw] w-[7.5cqw] opacity-90" />
        </div>
      </div>

      {audio && (
        <>
          <div className="relative flex justify-between px-[4.5cqw]" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="h-[4cqw] w-[4cqw] rounded-full bg-paper" />
            ))}
          </div>
          <div className="flex items-center gap-[3cqw] px-[5.5cqw] pb-[6cqw] pt-[5cqw]">
            <TicketAudioStrip audio={audio} />
          </div>
        </>
      )}
    </div>
  );
}
