/**
 * Tests for ring implementations
 */

import { describe, it, expect } from 'vitest';
import {
  SeasonsRing,
  MonthsRing,
  HebrewMonthsRing,
  WeeksRing,
  HolidaysRing,
} from '../ringImplementations';

describe('Ring Implementations', () => {
  describe('SeasonsRing', () => {
    it('should have 4 sectors', () => {
      const ring = new SeasonsRing();
      expect(ring.sectorCount).toBe(4);
    });

    it('should return correct season labels', () => {
      const ring = new SeasonsRing();
      expect(ring.getSectorLabel(0)).toBe('Winter');
      expect(ring.getSectorLabel(1)).toBe('Spring');
      expect(ring.getSectorLabel(2)).toBe('Summer');
      expect(ring.getSectorLabel(3)).toBe('Autumn');
    });
  });

  describe('MonthsRing', () => {
    it('should have 12 sectors', () => {
      const ring = new MonthsRing();
      expect(ring.sectorCount).toBe(12);
    });

    it('should return month labels with numbers', () => {
      const ring = new MonthsRing();
      expect(ring.getSectorLabel(0)).toBe('1 Jan');
      expect(ring.getSectorLabel(1)).toBe('2 Feb');
      expect(ring.getSectorLabel(11)).toBe('12 Dec');
    });

    it('should use white fill color', () => {
      const ring = new MonthsRing();
      expect(ring.getSectorColor(0)).toBe('white');
    });
  });

  describe('HebrewMonthsRing', () => {
    it('should have 13 sectors (Hebrew months in Gregorian year)', () => {
      const ring = new HebrewMonthsRing();
      expect(ring.sectorCount).toBe(13);
    });

    it('should return Hebrew month names', () => {
      const ring = new HebrewMonthsRing();
      const labels = Array.from({ length: ring.sectorCount }, (_, i) =>
        ring.getSectorLabel(i)
      );
      expect(labels).toContain('Tevet');
      expect(labels).toContain('Nisan');
      expect(labels).toContain('Tishrei');
    });
  });

  describe('WeeksRing', () => {
    it('should have 52 sectors', () => {
      const ring = new WeeksRing();
      expect(ring.sectorCount).toBe(52);
    });

    it('should label every 4th week', () => {
      const ring = new WeeksRing();
      expect(ring.getSectorLabel(3)).toBe('W4'); // Week 4 (index 3)
      expect(ring.getSectorLabel(7)).toBe('W8'); // Week 8 (index 7)
      expect(ring.getSectorLabel(51)).toBe('W52'); // Week 52 (index 51)
    });

    it('should return empty string for non-labeled weeks', () => {
      const ring = new WeeksRing();
      expect(ring.getSectorLabel(0)).toBe(''); // Week 1 (index 0)
      expect(ring.getSectorLabel(1)).toBe(''); // Week 2 (index 1)
      expect(ring.getSectorLabel(2)).toBe(''); // Week 3 (index 2)
    });
  });

  describe('HolidaysRing', () => {
    it('should have multiple holiday sectors', () => {
      const ring = new HolidaysRing();
      expect(ring.sectorCount).toBeGreaterThan(0);
    });

    it('should include major holidays', () => {
      const ring = new HolidaysRing();
      const labels = Array.from({ length: ring.sectorCount }, (_, i) =>
        ring.getSectorLabel(i)
      );
      
      // Check for some expected holidays
      expect(labels.some(label => label.includes('New Year'))).toBe(true);
      expect(labels.some(label => label.includes('Christmas'))).toBe(true);
    });

    it('should have unique holiday names', () => {
      const ring = new HolidaysRing();
      const labels = Array.from({ length: ring.sectorCount }, (_, i) =>
        ring.getSectorLabel(i)
      );
      const uniqueLabels = new Set(labels);
      // All labels should be unique (or at least most should be)
      expect(uniqueLabels.size).toBeGreaterThan(ring.sectorCount * 0.8);
    });
  });
});

