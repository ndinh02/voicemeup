import type { DrawPath } from "./types";

function heartPoints(cx: number, cy: number, scale: number, steps = 40): number[] {
  const pts: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push(Math.round(cx + x * scale), Math.round(cy + y * scale));
  }
  return pts;
}

const INK = "#17130f";

/**
 * The cat doodle used as the placeholder on the landing page's sample ticket,
 * traced 1:1 from the reference drawing in interface/Artboard1_2.png: the
 * mockup PNG was cropped to its drawing box, thresholded, and each stroke's
 * skeleton was extracted (scipy connected-component labeling +
 * skimage.morphology.skeletonize) and walked into an ordered polyline, then
 * rescaled into this component's 1000x620 coordinate space. The four hearts
 * draw as a single self-crossing stroke that a tree-shaped path walk can't
 * follow, so those reuse the parametric heart curve below, sized and
 * centered to match the traced bounding boxes exactly.
 */
export function sampleDoodlePaths(): DrawPath[] {
  return [
    // cat head + ears outline
    {
      color: INK,
      width: 9,
      points: [
        545, 496, 649, 464, 677, 447, 707, 412, 727, 366, 739, 313, 735, 264, 702, 224, 728, 176, 732, 152, 711, 151,
        683, 159, 590, 206, 503, 198, 438, 209, 389, 164, 345, 139, 355, 207, 312, 220, 275, 239, 249, 263, 231, 294,
        223, 351, 239, 424, 255, 449, 273, 466, 324, 492, 401, 509, 502, 509,
      ],
    },
    // whiskers
    { color: INK, width: 9, points: [600, 337, 666, 321, 670, 316] },
    { color: INK, width: 9, points: [287, 351, 341, 358] },
    { color: INK, width: 9, points: [600, 356, 633, 362] },
    { color: INK, width: 9, points: [597, 366, 620, 388] },
    { color: INK, width: 9, points: [305, 385, 348, 376] },
    { color: INK, width: 9, points: [363, 379, 325, 411] },
    // nose (x mark)
    { color: INK, width: 9, points: [462, 328, 499, 366] },
    { color: INK, width: 9, points: [494, 336, 458, 368] },
    // eyes
    { color: INK, width: 15, points: [593, 284, 550, 313] },
    { color: INK, width: 16, points: [402, 286, 389, 322] },
    // hearts (top-right, top-left, bottom-right, bottom-left)
    { color: INK, width: 11, points: heartPoints(864, 164, 5.13) },
    { color: INK, width: 11, points: heartPoints(146, 174, 4.28) },
    { color: INK, width: 10, points: heartPoints(806, 492, 3.8) },
    { color: INK, width: 10, points: heartPoints(109, 495, 3.91) },
  ];
}

/** A plausible-looking static waveform for decorative (non-playable) previews. */
export function samplePeaks(barCount = 20): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const t = i / barCount;
    const envelope = Math.sin(t * Math.PI);
    const wobble = Math.sin(i * 1.7) * 0.25 + Math.sin(i * 0.6) * 0.2;
    peaks.push(Math.max(10, Math.round((envelope + wobble) * 90)));
  }
  return peaks;
}
