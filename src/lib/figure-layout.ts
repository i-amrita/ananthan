/**
 * Deterministic scatter for the background figure field. Pure and seeded by the route, so a build is reproducible and
 * every visitor sees the same arrangement. Two layouts are computed against reference viewports: a phone (375x812) and a
 * wide screen (1280x800, reused from 768px up because positions are percentages and widths scale with the viewport).
 * Each layout keeps every figure out of a copy-safe zone (the chrome plus the centred text column) and out of each other.
 */

export interface FigureBox {
  id: string;
  /** viewBox width and height. */
  w: number;
  h: number;
}

export interface Placed {
  /** Left and top as a percentage of the viewport. */
  x: number;
  y: number;
  /** Rendered width in px at the reference viewport. */
  w: number;
  /** Longest side in px, used to keep the stroke at a constant ~2.6px. */
  span: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Preset {
  vw: number;
  vh: number;
  /** Longest side range of a figure in px. */
  span: [number, number];
  /** Regions the figures must stay out of, as fractions of the viewport. */
  safe: Rect[];
  /** Gap kept between figures and around the safe zone, in px. */
  gap: number;
}

const MOBILE: Preset = {
  vw: 375,
  vh: 812,
  span: [46, 74],
  gap: 8,
  safe: [
    { x: 0, y: 0, w: 1, h: 0.115 }, // navbar pill
    { x: 0, y: 0.34, w: 1, h: 0.34 }, // the centred copy
    { x: 0, y: 0.84, w: 1, h: 0.16 }, // hint, dots and dock
  ],
};

const DESKTOP: Preset = {
  vw: 1280,
  vh: 800,
  span: [84, 150],
  gap: 18,
  safe: [
    { x: 0, y: 0, w: 1, h: 0.13 }, // navbar pill
    { x: 0.22, y: 0.3, w: 0.56, h: 0.52 }, // the centred copy
    { x: 0, y: 0.86, w: 1, h: 0.14 }, // hint, dots and dock
  ],
};

/** mulberry32: tiny seeded PRNG. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function place(preset: Preset, boxes: FigureBox[], rand: () => number): Map<string, Placed> {
  const { vw, vh, gap } = preset;
  const safe = preset.safe.map((r) => ({
    x: r.x * vw - gap,
    y: r.y * vh - gap,
    w: r.w * vw + gap * 2,
    h: r.h * vh + gap * 2,
  }));
  const placed: Rect[] = [];
  const out = new Map<string, Placed>();
  for (const box of boxes) {
    const span = preset.span[0] + rand() * (preset.span[1] - preset.span[0]);
    const k = span / Math.max(box.w, box.h);
    const w = box.w * k;
    const h = box.h * k;
    // Rotation and motion can swell the box a little; pad by the larger side times 0.18.
    const pad = Math.max(w, h) * 0.18;
    let best: { x: number; y: number; score: number } | undefined;
    for (let i = 0; i < 60; i++) {
      // Memphis bleeds: a figure may hang a quarter of its width off the left or right edge.
      const x = -w * 0.25 + rand() * (vw - w * 0.5);
      const y = pad + rand() * (vh - h - pad * 2);
      const r = { x: Math.max(0, x) - pad, y: y - pad, w: w + pad * 2, h: h + pad * 2 };
      if (safe.some((s) => overlaps(r, s))) continue;
      if (
        placed.some((p) =>
          overlaps(r, { x: p.x - gap, y: p.y - gap, w: p.w + gap * 2, h: p.h + gap * 2 }),
        )
      )
        continue;
      // Best candidate: farthest from what is already placed, so the scatter spreads out.
      const score = placed.reduce(
        (m, p) => Math.min(m, Math.hypot(p.x + p.w / 2 - (x + w / 2), p.y + p.h / 2 - (y + h / 2))),
        1e9,
      );
      if (!best || score > best.score) best = { x, y, score };
    }
    if (!best) continue;
    placed.push({ x: best.x - pad, y: best.y - pad, w: w + pad * 2, h: h + pad * 2 });
    out.set(box.id, { x: (best.x / vw) * 100, y: (best.y / vh) * 100, w, span });
  }
  return out;
}

export function layoutFigures(route: string, boxes: FigureBox[]) {
  const rand = prng(hash(`figures:${route}`));
  // Shuffle so which figures land first (and so are most likely to get a slot) varies per route.
  const order = boxes.toSorted(() => rand() - 0.5);
  const mobile = place(MOBILE, order, prng(hash(`m:${route}`)));
  const desktop = place(DESKTOP, order, prng(hash(`d:${route}`)));
  const rotation = new Map(boxes.map((b) => [b.id, Math.round((rand() - 0.5) * 36)]));
  return { mobile, desktop, rotation };
}
