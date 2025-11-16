/**
 * Tests for week calculation bug fix (Bug #4)
 * 
 * Bug: Clicking day 16 in November navigated to wrong week (45 instead of 46)
 * Fix: Proper Sunday-based week calculation accounting for year start
 */

import { describe, it, expect } from 'vitest';

/**
 * Replicate the fixed getWeekForDay logic from ZoomMode
 */
function getWeekForDay(year: number, month: number, day: number): number {
  const date = new Date(year, month, day);
  
  // Find the Sunday of the week containing this date
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const sundayOfWeek = new Date(date);
  sundayOfWeek.setDate(date.getDate() - dayOfWeek);
  
  // Find the first Sunday on or before January 1st of this year
  const startOfYear = new Date(year, 0, 1);
  const startDayOfWeek = startOfYear.getDay();
  const firstSunday = new Date(startOfYear);
  firstSunday.setDate(1 - startDayOfWeek);
  
  // Calculate the number of weeks between first Sunday and the Sunday of our date
  const diffInMs = sundayOfWeek.getTime() - firstSunday.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffInDays / 7);
  
  // Clamp to valid range (0-51)
  return Math.max(0, Math.min(51, weekNumber));
}

describe('Week Calculation Bug Fix', () => {
  describe('Bug #4: Correct week calculation', () => {
    it('should calculate week 46 for November 16, 2025 (not 45)', () => {
      // This was the reported bug
      const week = getWeekForDay(2025, 10, 16); // November 16, 2025
      expect(week).toBe(46);
    });

    it('should account for partial first week when Jan 1 is Wednesday', () => {
      // 2025: Jan 1 is Wednesday
      // First week only has 4 days (Wed-Sat)
      const jan1Week = getWeekForDay(2025, 0, 1);
      const jan7Week = getWeekForDay(2025, 0, 7); // First full week
      
      expect(jan7Week).toBeGreaterThan(jan1Week);
    });

    it('should calculate consistent weeks for consecutive days in same week', () => {
      // Days in the same week should return same week number
      // Nov 16-22, 2025 are all in the same week (Sun-Sat)
      const nov16 = getWeekForDay(2025, 10, 16); // Sunday
      const nov17 = getWeekForDay(2025, 10, 17); // Monday
      const nov18 = getWeekForDay(2025, 10, 18); // Tuesday
      const nov22 = getWeekForDay(2025, 10, 22); // Saturday
      
      expect(nov16).toBe(46);
      expect(nov17).toBe(46);
      expect(nov18).toBe(46);
      expect(nov22).toBe(46);
    });

    it('should use Sunday as week start', () => {
      // Sunday should be first day of week
      const sunday = getWeekForDay(2025, 10, 16); // Nov 16, 2025 is Sunday
      const saturday = getWeekForDay(2025, 10, 15); // Nov 15, 2025 is Saturday
      
      // Saturday and Sunday should be in different weeks
      expect(sunday).toBe(saturday + 1);
    });

    it('should handle year boundaries correctly', () => {
      const lastDayOf2024 = getWeekForDay(2024, 11, 31);
      const firstDayOf2025 = getWeekForDay(2025, 0, 1);
      
      expect(lastDayOf2024).toBeGreaterThan(50);
      expect(firstDayOf2025).toBe(0);
    });

    it('should return week numbers in range 0-51', () => {
      // Test various dates throughout 2025
      const testDates = [
        [2025, 0, 1],   // Jan 1
        [2025, 2, 15],  // Mar 15
        [2025, 5, 21],  // Jun 21
        [2025, 8, 15],  // Sep 15
        [2025, 11, 31], // Dec 31
      ];

      testDates.forEach(([year, month, day]) => {
        const week = getWeekForDay(year, month, day);
        expect(week).toBeGreaterThanOrEqual(0);
        expect(week).toBeLessThanOrEqual(51);
      });
    });

    it('should handle leap years', () => {
      // 2024 is a leap year
      const feb29 = getWeekForDay(2024, 1, 29);
      expect(feb29).toBeGreaterThanOrEqual(0);
      expect(feb29).toBeLessThanOrEqual(51);
    });

    it('should match week start date logic', () => {
      // Week number should correspond to the week containing that date
      const nov16Week = getWeekForDay(2025, 10, 16);
      
      // All days in that week should return the same week number
      for (let i = 0; i < 7; i++) {
        const testDate = new Date(2025, 10, 16);
        testDate.setDate(testDate.getDate() - testDate.getDay() + i);
        const week = getWeekForDay(
          testDate.getFullYear(),
          testDate.getMonth(),
          testDate.getDate()
        );
        expect(week).toBe(nov16Week);
      }
    });
  });

  describe('Old buggy implementation (for comparison)', () => {
    function oldBuggyGetWeekForDay(year: number, month: number, day: number): number {
      const date = new Date(year, month, day);
      const startOfYear = new Date(year, 0, 1);
      const diff = date.getTime() - startOfYear.getTime();
      const oneWeek = 1000 * 60 * 60 * 24 * 7;
      return Math.floor(diff / oneWeek);
    }

    it('OLD BUG: would incorrectly calculate week 45 for Nov 16, 2025', () => {
      const week = oldBuggyGetWeekForDay(2025, 10, 16);
      expect(week).toBe(45); // Wrong!
    });

    it('demonstrates the bug: off by 1 week', () => {
      const correctWeek = getWeekForDay(2025, 10, 16);
      const buggyWeek = oldBuggyGetWeekForDay(2025, 10, 16);
      
      expect(correctWeek).toBe(46);
      expect(buggyWeek).toBe(45);
      expect(correctWeek - buggyWeek).toBe(1);
    });
  });
});

