import { describe, it, expect } from 'vitest';
import { clockAngle, polarToXY, TAU } from '../geometry';

// Normalize to (-PI, PI] for stable comparison.
const norm = (a: number): number => {
  let x = a % TAU;
  if (x > Math.PI) x -= TAU;
  if (x <= -Math.PI) x += TAU;
  return x;
};

describe('clockAngle', () => {
  // Regression guard for the day-clock orientation bug: hour 12 must be at the
  // top (-PI/2), 3 at the right (0), 6 at the bottom (PI/2), 9 at the left (PI).
  it('places clock hours at the canonical positions', () => {
    expect(norm(clockAngle(12, 12))).toBeCloseTo(-Math.PI / 2); // top
    expect(norm(clockAngle(0, 12))).toBeCloseTo(-Math.PI / 2); // 12 ≡ 0, top
    expect(norm(clockAngle(3, 12))).toBeCloseTo(0); // right
    expect(norm(clockAngle(6, 12))).toBeCloseTo(Math.PI / 2); // bottom
    expect(norm(clockAngle(9, 12))).toBeCloseTo(Math.PI); // left
  });

  it('increases clockwise and supports fractional values', () => {
    // 10:30 sits between 10 and 11, past the 10.
    const at1030 = clockAngle(10.5, 12);
    expect(at1030).toBeGreaterThan(clockAngle(10, 12));
    expect(at1030).toBeLessThan(clockAngle(11, 12));
  });
});

describe('polarToXY', () => {
  it('maps the top of the circle above the center (screen +y is down)', () => {
    const p = polarToXY(0, 0, 100, clockAngle(12, 12));
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(-100);
  });

  it('maps 3 oclock to the right of the center', () => {
    const p = polarToXY(0, 0, 100, clockAngle(3, 12));
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(0);
  });
});
