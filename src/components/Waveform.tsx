interface Props {
  peaks: number[];
  progress?: number; // 0-1, portion already played
  className?: string;
  barClassName?: string;
  activeColorClass?: string;
  idleColorClass?: string;
}

export default function Waveform({
  peaks,
  progress = 0,
  className = "",
  activeColorClass = "bg-ink",
  idleColorClass = "bg-ink/35",
}: Props) {
  const bars = peaks.length > 0 ? peaks : Array.from({ length: 20 }, () => 8);
  return (
    <div className={`flex h-full items-center gap-[1.8cqw] ${className}`}>
      {bars.map((v, i) => {
        const played = i / bars.length < progress;
        const height = Math.max(16, v);
        return (
          <span
            key={i}
            className={`w-[1.3cqw] rounded-full ${played ? activeColorClass : idleColorClass}`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}
