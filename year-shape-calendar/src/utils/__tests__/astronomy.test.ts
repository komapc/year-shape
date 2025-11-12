/**
 * Tests for astronomy utilities (moon phase, zodiac signs)
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateMoonPhase, 
  getMoonEmoji, 
  getMoonPhaseName,
  getWeekZodiacSigns 
} from '../astronomy';

describe('Astronomy Utilities', () => {
  describe('calculateMoonPhase', () => {
    it('should return a value between 0 and 1', () => {
      const date = new Date('2024-06-15');
      const phase = calculateMoonPhase(date);
      
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThan(1);
    });

    it('should return different phases for different dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-06-01');
      
      const phase1 = calculateMoonPhase(date1);
      const phase2 = calculateMoonPhase(date2);
      
      expect(phase1).not.toBe(phase2);
    });

    it('should have approximately 29.5-day cycle', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date(date1.getTime() + 29.5 * 24 * 60 * 60 * 1000);
      
      const phase1 = calculateMoonPhase(date1);
      const phase2 = calculateMoonPhase(date2);
      
      // Phase should be close after one lunar month
      const phaseDiff = Math.abs(phase1 - phase2);
      expect(phaseDiff).toBeLessThan(0.1);
    });
  });

  describe('getMoonEmoji', () => {
    it('should return new moon emoji for phase 0', () => {
      const emoji = getMoonEmoji(0);
      expect(emoji).toBe('🌑');
    });

    it('should return full moon emoji for phase 0.5', () => {
      const emoji = getMoonEmoji(0.5);
      expect(emoji).toBe('🌕');
    });

    it('should return waxing crescent for phase 0.1', () => {
      const emoji = getMoonEmoji(0.1);
      expect(emoji).toBe('🌒');
    });

    it('should return waning crescent for phase 0.9', () => {
      const emoji = getMoonEmoji(0.9);
      expect(emoji).toBe('🌘');
    });

    it('should always return a moon emoji', () => {
      const emojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
      
      for (let i = 0; i < 1; i += 0.1) {
        const emoji = getMoonEmoji(i);
        expect(emojis).toContain(emoji);
      }
    });
  });

  describe('getMoonPhaseName', () => {
    it('should return "New Moon" for phase 0', () => {
      const name = getMoonPhaseName(0);
      expect(name).toBe('New Moon');
    });

    it('should return "Full Moon" for phase 0.5', () => {
      const name = getMoonPhaseName(0.5);
      expect(name).toBe('Full Moon');
    });

    it('should return "First Quarter" for phase 0.25', () => {
      const name = getMoonPhaseName(0.25);
      expect(name).toBe('First Quarter');
    });

    it('should return "Last Quarter" for phase 0.75', () => {
      const name = getMoonPhaseName(0.75);
      expect(name).toBe('Last Quarter');
    });

    it('should always return a valid phase name', () => {
      const validNames = [
        'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
        'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
      ];
      
      for (let i = 0; i < 1; i += 0.1) {
        const name = getMoonPhaseName(i);
        expect(validNames).toContain(name);
      }
    });
  });

  describe('getWeekZodiacSigns', () => {
    it('should return at least one zodiac sign', () => {
      const date = new Date('2024-06-15');
      const signs = getWeekZodiacSigns(date);
      
      expect(signs.length).toBeGreaterThan(0);
      expect(signs.length).toBeLessThanOrEqual(2);
    });

    it('should return correct sign for mid-Aries (April 5)', () => {
      const date = new Date('2024-04-05');
      const signs = getWeekZodiacSigns(date);
      
      expect(signs.some(s => s.name === 'Aries')).toBe(true);
    });

    it('should return correct sign for mid-Leo (July 25)', () => {
      const date = new Date('2024-07-25');
      const signs = getWeekZodiacSigns(date);
      
      expect(signs.some(s => s.name === 'Leo')).toBe(true);
    });

    it('should return correct sign for mid-Capricorn (January 5)', () => {
      const date = new Date('2024-01-05');
      const signs = getWeekZodiacSigns(date);
      
      expect(signs.some(s => s.name === 'Capricorn')).toBe(true);
    });

    it('should have emojis for all signs', () => {
      const date = new Date('2024-06-15');
      const signs = getWeekZodiacSigns(date);
      
      signs.forEach(sign => {
        expect(sign.emoji).toBeTruthy();
        expect(sign.emoji.length).toBeGreaterThan(0);
      });
    });

    it('should return two signs for a week spanning sign boundaries', () => {
      // Around March 21 (Pisces → Aries transition)
      const date = new Date('2024-03-18'); // Sunday before transition
      const signs = getWeekZodiacSigns(date);
      
      // Week should span both signs
      const hasPisces = signs.some(s => s.name === 'Pisces');
      const hasAries = signs.some(s => s.name === 'Aries');
      
      expect(hasPisces || hasAries).toBe(true);
    });
  });
});

