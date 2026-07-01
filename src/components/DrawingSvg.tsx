import type { DrawPath } from "../lib/types";

export const DRAW_WIDTH = 1000;
export const DRAW_ASPECT = 0.62;

interface Props {
  paths: DrawPath[];
  liveExtra?: DrawPath | null;
  className?: string;
}

function pointsAttr(points: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < points.length; i += 2) out.push(`${points[i]},${points[i + 1]}`);
  return out.join(" ");
}

export default function DrawingSvg({ paths, liveExtra, className }: Props) {
  const height = Math.round(DRAW_WIDTH * DRAW_ASPECT);
  const all = liveExtra ? [...paths, liveExtra] : paths;
  return (
    <svg
      viewBox={`0 0 ${DRAW_WIDTH} ${height}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {all.map((p, i) =>
        p.points.length >= 4 ? (
          <polyline
            key={i}
            points={pointsAttr(p.points)}
            fill="none"
            stroke={p.color}
            strokeWidth={p.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : p.points.length === 2 ? (
          <circle key={i} cx={p.points[0]} cy={p.points[1]} r={p.width / 2} fill={p.color} />
        ) : null,
      )}
    </svg>
  );
}
