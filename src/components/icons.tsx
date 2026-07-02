const FLOWER_PETAL_ANGLES = [0, 72, 144, 216, 288];

export function FlowerCorner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" preserveAspectRatio="xMinYMin slice">
      <g fill="#100d09">
        {FLOWER_PETAL_ANGLES.map((angle) => (
          <ellipse key={angle} cx="58" cy="30" rx="18" ry="26" transform={`rotate(${angle} 58 58)`} />
        ))}
        <circle cx="58" cy="58" r="16" />
      </g>
    </svg>
  );
}

/** A wire "gem clip" paperclip — two nested rounded-rect loops, drawn vertically so a diagonal rotation at the usage site makes it look like it's slid onto a corner. */
export function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 62" className={className} aria-hidden="true">
      <rect x="3.5" y="3" width="13" height="56" rx="6.5" fill="none" stroke="#8f9296" strokeWidth="2.4" />
      <rect x="3.5" y="3" width="13" height="32" rx="6.5" fill="none" stroke="#8f9296" strokeWidth="2.4" />
      <rect x="3.5" y="3" width="13" height="56" rx="6.5" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.9" />
    </svg>
  );
}

export function AsteriskIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <g fill="currentColor">
        <rect x="16" y="2" width="8" height="36" rx="2" />
        <rect x="16" y="2" width="8" height="36" rx="2" transform="rotate(60 20 20)" />
        <rect x="16" y="2" width="8" height="36" rx="2" transform="rotate(120 20 20)" />
      </g>
    </svg>
  );
}
