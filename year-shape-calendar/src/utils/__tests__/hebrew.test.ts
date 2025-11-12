/**
 * Tests for Hebrew calendar utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  getWeekHebrewMonths, 
  getHebrewMonthEmoji, 
  getHebrewMonthName 
} from '../hebrew';

describe('Hebrew Calendar Utilities', () => {
  describe('getWeekHebrewMonths', () => {
    it('should return at least one Hebrew month', () => {
      const date = new Date('2024-06-15');
      const months = getWeekHebrewMonths(date);
      
      expect(months.length).toBeGreaterThan(0);
      expect(months.length).toBeLessThanOrEqual(2);
    });

    it('should return Hebrew months with emojis', () => {
      const date = new Date('2024-06-15');
      const months = getWeekHebrewMonths(date);
      
      months.forEach(month => {
        expect(month.emoji).toBeTruthy();
        expect(month.emoji.length).toBeGreaterThan(0);
      });
    });

    it('should return Hebrew months with English names', () => {
      const date = new Date('2024-06-15');
      const months = getWeekHebrewMonths(date);
      
      months.forEach(month => {
        expect(month.name).toBeTruthy();
        expect(month.name.length).toBeGreaterThan(0);
      });
    });

    it('should return Hebrew months with Hebrew names', () => {
      const date = new Date('2024-06-15');
      const months = getWeekHebrewMonths(date);
      
      months.forEach(month => {
        expect(month.nameHebrew).toBeTruthy();
        expect(month.nameHebrew.length).toBeGreaterThan(0);
      });
    });

    it('should handle different dates', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-06-15');
      
      const months1 = getWeekHebrewMonths(date1);
      const months2 = getWeekHebrewMonths(date2);
      
      expect(months1).toBeTruthy();
      expect(months2).toBeTruthy();
    });

    it('should return unique months within a week', () => {
      const date = new Date('2024-06-15');
      const months = getWeekHebrewMonths(date);
      
      const names = months.map(m => m.name);
      const uniqueNames = [...new Set(names)];
      
      expect(names.length).toBe(uniqueNames.length);
    });
  });

  describe('getHebrewMonthEmoji', () => {
    it('should return an emoji string', () => {
      const months = getWeekHebrewMonths(new Date('2024-06-15'));
      
      months.forEach(month => {
        const emoji = getHebrewMonthEmoji(month);
        expect(emoji).toBeTruthy();
        expect(typeof emoji).toBe('string');
      });
    });

    it('should return Kislev emoji (🕎) for Kislev month', () => {
      const months = getWeekHebrewMonths(new Date('2024-12-15'));
      const kislev = months.find(m => m.name === 'Kislev');
      
      if (kislev) {
        const emoji = getHebrewMonthEmoji(kislev);
        expect(emoji).toBe('🕎');
      }
    });
  });

  describe('getHebrewMonthName', () => {
    it('should return English name by default', () => {
      const months = getWeekHebrewMonths(new Date('2024-06-15'));
      
      months.forEach(month => {
        const name = getHebrewMonthName(month);
        expect(name).toBeTruthy();
        expect(typeof name).toBe('string');
        expect(name).toBe(month.name);
      });
    });

    it('should return Hebrew name when requested', () => {
      const months = getWeekHebrewMonths(new Date('2024-06-15'));
      
      months.forEach(month => {
        const name = getHebrewMonthName(month, true);
        expect(name).toBeTruthy();
        expect(typeof name).toBe('string');
        expect(name).toBe(month.nameHebrew);
      });
    });

    it('should return different values for Hebrew vs English', () => {
      const months = getWeekHebrewMonths(new Date('2024-06-15'));
      
      months.forEach(month => {
        const englishName = getHebrewMonthName(month, false);
        const hebrewName = getHebrewMonthName(month, true);
        
        expect(englishName).not.toBe(hebrewName);
      });
    });
  });
});

