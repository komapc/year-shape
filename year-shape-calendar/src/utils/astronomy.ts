/**
 * Astronomy utilities for moon phases and zodiac signs
 */

/**
 * Calculate moon phase for a given date
 * @param date - The date to calculate moon phase for
 * @returns Phase value between 0-1 (0 = new moon, 0.5 = full moon)
 */
export const calculateMoonPhase = (date: Date): number => {
  // Known new moon: January 6, 2000, 18:14 UTC
  const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
  const currentTime = date.getTime();
  
  // Synodic month (lunar cycle) = 29.53058867 days
  const synodicMonth = 29.53058867;
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  
  // Calculate days since known new moon
  const daysSinceNewMoon = (currentTime - knownNewMoon) / millisecondsPerDay;
  
  // Calculate phase (0-1)
  const phase = (daysSinceNewMoon % synodicMonth) / synodicMonth;
  
  return phase;
};

/**
 * Get moon phase emoji based on phase value
 * @param phase - Phase value between 0-1
 * @returns Moon emoji representing the phase
 */
export const getMoonEmoji = (phase: number): string => {
  // Normalize phase to 0-1 range
  const normalizedPhase = phase % 1;
  
  if (normalizedPhase < 0.0625) return '🌑'; // New Moon
  if (normalizedPhase < 0.1875) return '🌒'; // Waxing Crescent
  if (normalizedPhase < 0.3125) return '🌓'; // First Quarter
  if (normalizedPhase < 0.4375) return '🌔'; // Waxing Gibbous
  if (normalizedPhase < 0.5625) return '🌕'; // Full Moon
  if (normalizedPhase < 0.6875) return '🌖'; // Waning Gibbous
  if (normalizedPhase < 0.8125) return '🌗'; // Last Quarter
  if (normalizedPhase < 0.9375) return '🌘'; // Waning Crescent
  return '🌑'; // New Moon (wrap around)
};

/**
 * Get moon phase name
 * @param phase - Phase value between 0-1
 * @returns Human-readable moon phase name
 */
export const getMoonPhaseName = (phase: number): string => {
  const normalizedPhase = phase % 1;
  
  if (normalizedPhase < 0.0625) return 'New Moon';
  if (normalizedPhase < 0.1875) return 'Waxing Crescent';
  if (normalizedPhase < 0.3125) return 'First Quarter';
  if (normalizedPhase < 0.4375) return 'Waxing Gibbous';
  if (normalizedPhase < 0.5625) return 'Full Moon';
  if (normalizedPhase < 0.6875) return 'Waning Gibbous';
  if (normalizedPhase < 0.8125) return 'Last Quarter';
  if (normalizedPhase < 0.9375) return 'Waning Crescent';
  return 'New Moon';
};

/**
 * Zodiac signs with date ranges
 */
const ZODIAC_SIGNS = [
  { name: 'Capricorn', emoji: '♑', start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
  { name: 'Aquarius', emoji: '♒', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
  { name: 'Pisces', emoji: '♓', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
  { name: 'Aries', emoji: '♈', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
  { name: 'Taurus', emoji: '♉', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
  { name: 'Gemini', emoji: '♊', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
  { name: 'Cancer', emoji: '♋', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
  { name: 'Leo', emoji: '♌', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
  { name: 'Virgo', emoji: '♍', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
  { name: 'Libra', emoji: '♎', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
  { name: 'Scorpio', emoji: '♏', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
  { name: 'Sagittarius', emoji: '♐', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
];

/**
 * Get zodiac sign for a given date
 * @param date - The date to get zodiac sign for
 * @returns Object with zodiac name and emoji
 */
export const getZodiacSign = (date: Date): { name: string; emoji: string } => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  for (const sign of ZODIAC_SIGNS) {
    // Handle year wrap-around (Capricorn spans Dec-Jan)
    if (sign.start.month > sign.end.month) {
      if (
        (month === sign.start.month && day >= sign.start.day) ||
        (month === sign.end.month && day <= sign.end.day)
      ) {
        return { name: sign.name, emoji: sign.emoji };
      }
    } else {
      if (
        (month === sign.start.month && day >= sign.start.day) ||
        (month === sign.end.month && day <= sign.end.day) ||
        (month > sign.start.month && month < sign.end.month)
      ) {
        return { name: sign.name, emoji: sign.emoji };
      }
    }
  }
  
  // Fallback (should never reach here)
  return { name: 'Capricorn', emoji: '♑' };
};

/**
 * Get all zodiac signs that appear in a week (7 days)
 * @param startDate - Start date of the week
 * @returns Array of unique zodiac signs in the week
 */
export const getWeekZodiacSigns = (startDate: Date): Array<{ name: string; emoji: string }> => {
  const signs = new Set<string>();
  const zodiacList: Array<{ name: string; emoji: string }> = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const zodiac = getZodiacSign(date);
    
    if (!signs.has(zodiac.name)) {
      signs.add(zodiac.name);
      zodiacList.push(zodiac);
    }
  }
  
  return zodiacList;
};

