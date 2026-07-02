import { useRef } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import TicketCard from "./TicketCard";
import type { TicketAudio } from "./TicketAudioStrip";
import type { TicketPhoto } from "./TicketPhoto";
import type { TicketItem } from "../lib/types";

interface Props {
  items: TicketItem[];
  audioList: (TicketAudio | null)[];
  photoList: (TicketPhoto | null)[];
  dateStr: string;
  headlineTop?: string;
  headlineBottom?: string;
  activeIndex: number;
  onIndexChange: (index: number) => void;
}

const cardVariants: Variants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? 90 : -90,
    rotate: direction >= 0 ? 10 : -10,
    scale: 0.9,
    opacity: 0,
  }),
  center: { x: 0, rotate: 0, scale: 1, opacity: 1 },
  exit: (direction: number) => ({
    x: direction >= 0 ? -100 : 100,
    rotate: direction >= 0 ? -12 : 12,
    scale: 0.88,
    opacity: 0,
  }),
};

const SPRING = { type: "spring" as const, stiffness: 300, damping: 28, mass: 0.9 };

/**
 * Renders a voiceme's cards as a tilted stack — the active card up front,
 * the rest peeking out behind at increasing offset/rotation so the receiver
 * can tell there's more than one. Arrow buttons (and a drag gesture) step
 * through with a spring-driven swipe animation. Controlled: the caller owns
 * `activeIndex` so external navigation (e.g. a card-switcher elsewhere on
 * the page) stays in sync with the stack's own arrows/drag.
 */
export default function TicketStack({
  items,
  audioList,
  photoList,
  dateStr,
  headlineTop,
  headlineBottom,
  activeIndex,
  onIndexChange,
}: Props) {
  const prevIndexRef = useRef(activeIndex);
  const direction = activeIndex >= prevIndexRef.current ? 1 : -1;
  prevIndexRef.current = activeIndex;

  const go = (delta: number) => {
    const next = Math.min(items.length - 1, Math.max(0, activeIndex + delta));
    if (next !== activeIndex) onIndexChange(next);
  };

  if (items.length === 0) return null;
  const active = items[activeIndex];

  return (
    <div className="w-full">
      <div className="relative w-full">
        {/* invisible in-flow card: reserves the stack's height since every layer below is absolutely positioned */}
        <div className="pointer-events-none invisible" aria-hidden="true">
          <TicketCard
            color={active.color}
            ticketId={active.id}
            dateStr={dateStr}
            paths={[]}
            audio={audioList[activeIndex]}
            photo={photoList[activeIndex]}
            headlineTop={headlineTop}
            headlineBottom={headlineBottom}
          />
        </div>

        {items.map((item, i) => {
          const rel = i - activeIndex;
          if (rel <= 0) return null;
          const depth = Math.min(rel, 4);
          const tilt = i % 2 === 0 ? 1 : -1;
          return (
            <motion.div
              key={item.id}
              className="absolute inset-0"
              style={{ zIndex: items.length - depth }}
              animate={{
                x: depth * 9 * tilt,
                y: depth * 7,
                rotate: depth * 2.6 * tilt,
                scale: 1 - depth * 0.035,
                opacity: 1 - depth * 0.12,
              }}
              transition={SPRING}
            >
              <TicketCard
                color={item.color}
                ticketId={item.id}
                dateStr={dateStr}
                paths={item.paths}
                audio={audioList[i]}
                photo={photoList[i]}
                headlineTop={headlineTop}
                headlineBottom={headlineBottom}
              />
            </motion.div>
          );
        })}

        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={active.id}
            className="absolute inset-0"
            style={{ zIndex: items.length + 1 }}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SPRING}
            drag={items.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.65}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
          >
            <TicketCard
              color={active.color}
              ticketId={active.id}
              dateStr={dateStr}
              paths={active.paths}
              audio={audioList[activeIndex]}
              photo={photoList[activeIndex]}
              headlineTop={headlineTop}
              headlineBottom={headlineBottom}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={activeIndex === 0}
            aria-label="Previous voiceme"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink text-lg transition-transform active:scale-90 disabled:opacity-30"
          >
            ‹
          </button>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {items.map((item, i) => (
              <span
                key={item.id}
                className={`h-2 w-2 rounded-full transition-colors ${i === activeIndex ? "bg-ink" : "bg-ink/25"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={activeIndex === items.length - 1}
            aria-label="Next voiceme"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink text-lg transition-transform active:scale-90 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
