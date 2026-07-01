import { useRef, useState, useCallback } from "react";
import DrawingSvg, { DRAW_WIDTH, DRAW_ASPECT } from "./DrawingSvg";
import type { DrawPath } from "../lib/types";

export const PEN_COLORS = ["#17130f", "#c23b3b", "#3b6fc2", "#3b9c56"];

interface Props {
  paths: DrawPath[];
  onChange: (paths: DrawPath[]) => void;
}

const ERASE_RADIUS = 42;
const MIN_STEP = 6;
const PEN_WIDTH = 16;

function distSq(x1: number, y1: number, x2: number, y2: number) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

export default function DrawingCanvas({ paths, onChange }: Props) {
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(PEN_COLORS[0]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [livePath, setLivePath] = useState<DrawPath | null>(null);
  const isDrawing = useRef(false);
  const height = Math.round(DRAW_WIDTH * DRAW_ASPECT);

  const toPoint = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const rect = svgRef.current!.getBoundingClientRect();
      const x = Math.max(0, Math.min(DRAW_WIDTH, ((clientX - rect.left) / rect.width) * DRAW_WIDTH));
      const y = Math.max(0, Math.min(height, ((clientY - rect.top) / rect.height) * height));
      return [Math.round(x), Math.round(y)];
    },
    [height],
  );

  const eraseAt = useCallback(
    (x: number, y: number) => {
      onChange(
        paths.filter((p) => {
          for (let i = 0; i < p.points.length; i += 2) {
            if (distSq(p.points[i], p.points[i + 1], x, y) <= ERASE_RADIUS * ERASE_RADIUS) return false;
          }
          return true;
        }),
      );
    },
    [paths, onChange],
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    const [x, y] = toPoint(e.clientX, e.clientY);
    if (tool === "eraser") {
      eraseAt(x, y);
    } else {
      setLivePath({ color, width: PEN_WIDTH, points: [x, y] });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing.current) return;
    const [x, y] = toPoint(e.clientX, e.clientY);
    if (tool === "eraser") {
      eraseAt(x, y);
      return;
    }
    setLivePath((prev) => {
      if (!prev) return prev;
      const px = prev.points[prev.points.length - 2];
      const py = prev.points[prev.points.length - 1];
      if (distSq(px, py, x, y) < MIN_STEP * MIN_STEP) return prev;
      return { ...prev, points: [...prev.points, x, y] };
    });
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
    if (livePath && livePath.points.length >= 2) {
      onChange([...paths, livePath]);
    }
    setLivePath(null);
  };

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${DRAW_WIDTH} ${height}`}
        className="w-full touch-none rounded-xl border-2 border-ink bg-white/70"
        style={{ aspectRatio: `${DRAW_WIDTH} / ${height}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <DrawingSvg paths={paths} liveExtra={livePath} />
      </svg>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTool("pen")}
            aria-pressed={tool === "pen"}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink text-sm ${
              tool === "pen" ? "bg-ink text-paper" : "bg-transparent"
            }`}
            aria-label="Pen"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={() => setTool("eraser")}
            aria-pressed={tool === "eraser"}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink text-sm ${
              tool === "eraser" ? "bg-ink text-paper" : "bg-transparent"
            }`}
            aria-label="Eraser"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="ml-1 font-mono text-xs underline decoration-dotted underline-offset-4"
          >
            clear
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
              aria-label={`Color ${c}`}
              aria-pressed={color === c && tool === "pen"}
              className="h-7 w-7 rounded-full border-2"
              style={{
                backgroundColor: c,
                borderColor: color === c && tool === "pen" ? "#17130f" : "transparent",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
