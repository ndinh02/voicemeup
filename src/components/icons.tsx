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

/** A small binder-clip shape, meant to overlap the top edge of a pinned-on photo. */
export function ClipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 26" className={className} aria-hidden="true">
      <rect x="4" y="0" width="32" height="14" rx="7" fill="currentColor" />
      <rect x="15" y="8" width="10" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
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
