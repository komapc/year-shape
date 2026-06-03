/**
 * Tests for year-derived rings data
 */

import { describe, it, expect } from 'vitest';
import {
  getGregorianMonthSectors,
  getHebrewMonthSectors,
  getHolidayPoints,
} from '../yearData';

describe('yearData', () => {
  describe('getGregorianMonthSectors', () => {
    it('returns 12 months that tile the full circle', () => {
      const sectors = getGregorianMonthSectors(2025);
      expect(sectors).toHaveLength(12);
      expect(sectors[0].startDay).toBe(0);
      expect(sectors[11].endDay).toBeCloseTo(365, 5);
      // Each month starts where the previous ended.
      for (let i = 1; i < sectors.length; i++) {
        expect(sectors[i].startDay).toBeCloseTo(sectors[i - 1].endDay, 5);
      }
    });

    it('shifts boundaries in a leap year (Feb gains a day)', () => {
      const common = getGregorianMonthSectors(2025); // non-leap
      const leap = getGregorianMonthSectors(2024); // leap
      // March starts later (after a 29-day February) in the leap year.
      expect(leap[2].startDay).toBeGreaterThan(common[2].startDay);
    });
  });

  describe('getHebrewMonthSectors', () => {
    it('produces contiguous segments covering the full circle', () => {
      const sectors = getHebrewMonthSectors(2025);
      expect(sectors[0].startDay).toBe(0);
      expect(sectors[sectors.length - 1].endDay).toBeCloseTo(365, 5);
      for (let i = 1; i < sectors.length; i++) {
        expect(sectors[i].startDay).toBeCloseTo(sectors[i - 1].endDay, 5);
      }
    });
  });

  describe('getHolidayPoints', () => {
    it('includes the major movable and fixed holidays', () => {
      const names = getHolidayPoints(2025).map((h) => h.name);
      for (const holiday of ['Easter', 'Passover', 'Rosh Hashanah', 'Yom Kippur', 'Christmas']) {
        expect(names.some((n) => n.includes(holiday))).toBe(true);
      }
    });

    it('moves Easter between years (it is a movable feast)', () => {
      const easter = (year: number) =>
        getHolidayPoints(year).find((h) => h.name.includes('Easter'))!.day;
      expect(easter(2025)).not.toBeCloseTo(easter(2026), 1);
    });

    it('keeps every holiday within the year circle', () => {
      for (const year of [2024, 2025, 2026]) {
        for (const h of getHolidayPoints(year)) {
          expect(h.day).toBeGreaterThanOrEqual(0);
          expect(h.day).toBeLessThanOrEqual(365);
        }
      }
    });

    it('places Rosh Hashanah on a fixed day-of-year regardless of runtime timezone', () => {
      // The Hebrew calendar formatters are pinned to UTC; without that, a
      // UTC+13/+14 runtime would shift this by a day. Locks in the fix.
      const rosh = getHolidayPoints(2025).find((h) => h.name.includes('Rosh Hashanah'))!.day;
      expect(Math.round(rosh)).toBe(265);
    });
  });
});
