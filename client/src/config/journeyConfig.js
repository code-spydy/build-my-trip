// Fixed company origin point for every trip (Gurugram). Change here if the
// business origin ever changes — nothing else in the journey needs to be touched.
export const ORIGIN = [77.03, 28.46];

// Icons8 "Airplane" icon (96px, transparent background). Its ACTUAL resting
// orientation is NOT due-east — it points up-and-right. This value was
// measured, not guessed: the SVG was rasterized and the nose-tip / tail-tip
// pixels were located programmatically, then the angle between them was
// computed. If you ever swap this icon for a different asset, you MUST
// remeasure this value — do not eyeball it, that's what caused the original
// misalignment bugs during development.
export const PLANE_HEADING_OFFSET = 45.77;

// Maps a great-circle distance (radians, from d3.geoDistance(origin, dest))
// to a globe zoom scale. Closer destinations zoom in more; farther ones stay
// more zoomed out so both endpoints remain in frame.
export const DIST_MIN = 0.15;
export const DIST_MAX = 0.9;
export const SCALE_MIN = 190;
export const SCALE_MAX = 420;
export const BASE_SCALE = 115; // resting / auto-rotate globe scale

export function scaleForDistance(distRad) {
  const t = Math.max(0, Math.min(1, (distRad - DIST_MIN) / (DIST_MAX - DIST_MIN)));
  return SCALE_MAX - t * (SCALE_MAX - SCALE_MIN);
}

// The 5 wizard stops, as fractions along the drawn route path (0 = origin,
// 1 = destination). Stop 0 needs no flight — the plane starts parked there.
export const MILESTONE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1.0];

// After "Start journey", the globe zooms in this much tighter than the
// destination-preview zoom, to frame the flight path closely.
export const JOURNEY_ZOOM_MULTIPLIER = 2.3;

// Durations (ms) — kept as named constants so they're easy to tune in one
// place, and so tests / reduced-motion handling can reference them.
export const PREVIEW_TRANSITION_MS = 1100;
export const PREVIEW_DRAW_MS = 700;
export const JOURNEY_ZOOM_MS = 950;
export const FLIGHT_DURATION_MS = 900;

// Public CDN world atlas, with a jsDelivr fallback. In production, prefer
// bundling this via the `world-atlas` npm package instead of fetching at
// runtime — see README.
export const WORLD_ATLAS_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/world-atlas/2.0.2/countries-110m.json',
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
];
