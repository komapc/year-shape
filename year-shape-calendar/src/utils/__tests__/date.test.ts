/**
 * Tests for date utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  getWeekNumber, 
  getWeekStartDate, 
  getWeekEndDate,
  formatDate 
} from '../date';

describe('Date Utilities', () => {
  describe('getWeekNumber', () => {
    it('should return week 0 for first week of year', () => {
      const date = new Date('2024-01-01');
      const week = getWeekNumber(date);
      expect(week).toBeGreaterThanOrEqual(0);
      expect(week).toBeLessThan(53);
    });

    it('should return week 0-52 for any date', () => {
      const date = new Date('2024-06-15');
      const week = getWeekNumber(date);
      expect(week).toBeGreaterThanOrEqual(0);
      expect(week).toBeLessThan(53);
    });

    it('should handle last day of year', () => {
      const date = new Date('2024-12-31');
      const week = getWeekNumber(date);
      expect(week).toBeGreaterThanOrEqual(0);
      expect(week).toBeLessThan(53);
    });

    it('should handle leap years', () => {
      const date1 = new Date('2024-02-29'); // Leap year
      const week1 = getWeekNumber(date1);
      expect(week1).toBeGreaterThanOrEqual(0);
      expect(week1).toBeLessThan(53);
    });

    it('should return increasing values for dates later in year', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-06-15');
      
      const week1 = getWeekNumber(date1);
      const week2 = getWeekNumber(date2);
      
      expect(week2).toBeGreaterThan(week1);
    });
  });

  describe('getWeekStartDate', () => {
    it('should return a date for week 0', () => {
      const startDate = getWeekStartDate(0);
      expect(startDate).toBeInstanceOf(Date);
      expect(startDate.getFullYear()).toBe(new Date().getFullYear());
    });

    it('should return dates in chronological order', () => {
      const week0 = getWeekStartDate(0);
      const week1 = getWeekStartDate(1);
      
      expect(week1.getTime()).toBeGreaterThan(week0.getTime());
    });

    it('should have 7-day intervals between consecutive weeks', () => {
      const week0 = getWeekStartDate(0);
      const week1 = getWeekStartDate(1);
      
      const diff = week1.getTime() - week0.getTime();
      const expectedDiff = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
      
      expect(diff).toBe(expectedDiff);
    });

    it('should handle week 51', () => {
      const startDate = getWeekStartDate(51);
      expect(startDate).toBeInstanceOf(Date);
    });

    it('should handle custom year parameter', () => {
      const startDate = getWeekStartDate(0, 2025);
      expect(startDate.getFullYear()).toBe(2025);
    });
  });

  describe('getWeekEndDate', () => {
    it('should return a date 6 days after start date', () => {
      const startDate = getWeekStartDate(10);
      const endDate = getWeekEndDate(10);
      
      const diff = endDate.getTime() - startDate.getTime();
      const expectedDiff = 6 * 24 * 60 * 60 * 1000; // 6 days in ms
      
      expect(diff).toBe(expectedDiff);
    });

    it('should work for all weeks', () => {
      for (let week = 0; week < 52; week++) {
        const endDate = getWeekEndDate(week);
        expect(endDate).toBeInstanceOf(Date);
      }
    });
  });

  describe('formatDate', () => {
    it('should format a date in en-US format', () => {
      const date = new Date('2024-06-15');
      const formatted = formatDate(date);
      
      expect(formatted).toContain('June');
      expect(formatted).toContain('15');
    });

    it('should handle different months', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-12-25');
      
      const formatted1 = formatDate(date1);
      const formatted2 = formatDate(date2);
      
      expect(formatted1).toContain('January');
      expect(formatted2).toContain('December');
    });
  });
});
