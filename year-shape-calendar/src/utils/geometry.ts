/**
 * Shared circular-geometry helpers.
 *
 * Several renderers previously re-derived the same polar formula
 * `(index / n) * 2π - π/2` with subtly different rotation/direction
 * conventions — which is exactly how the day-clock ended up mis-oriented and
 * its arrow pointing at the wrong segment. Route clock/segment math through
 * these helpers so the convention lives in one place.
 *
 * Convention: screen space (SVG/canvas), angle in radians measured from the
 * +x axis with +y pointing DOWN. Value 0 sits at the top (12 o'clock) and
 * values increase clockwise.
 */

export const TAU = Math.PI * 2;

/**
 * Angle that places `value` of `total` around a circle, with value 0 at the
 * top (12 o'clock) and increasing clockwise. `value` may be fractional
 * (e.g. 9.5 hours) for smooth positioning.
 */
export const clockAngle = (value: number, total: number): number =>
  (value / total) * TAU - Math.PI / 2;

/**
 * Cartesian point on a circle of radius `r` centered at (cx, cy) for the given
 * screen-space `angle` (radians).
 */
export const polarToXY = (
  cx: number,
  cy: number,
  r: number,
  angle: number
): { x: number; y: number } => ({
  x: cx + Math.cos(angle) * r,
  y: cy + Math.sin(angle) * r,
});
