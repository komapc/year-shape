/**
 * Hebrew calendar utilities
 * Implements pure mathematical conversion to Hebrew months
 */

// Hebrew month definitions
interface HebrewMonth {
  name: string;
  emoji: string;
  nameHebrew: string;
}

const HEBREW_MONTHS: HebrewMonth[] = [
  { name: 'Tishrei', emoji: '🍎', nameHebrew: 'תשרי' },      // Sep-Oct
  { name: 'Cheshvan', emoji: '🌧️', nameHebrew: 'חשוון' },   // Oct-Nov
  { name: 'Kislev', emoji: '🕎', nameHebrew: 'כסלו' },       // Nov-Dec
  { name: 'Tevet', emoji: '❄️', nameHebrew: 'טבת' },        // Dec-Jan
  { name: 'Shevat', emoji: '🌳', nameHebrew: 'שבט' },       // Jan-Feb
  { name: 'Adar', emoji: '🎭', nameHebrew: 'אדר' },         // Feb-Mar
  { name: 'Nisan', emoji: '🌸', nameHebrew: 'ניסן' },       // Mar-Apr
  { name: 'Iyar', emoji: '🌾', nameHebrew: 'אייר' },        // Apr-May
  { name: 'Sivan', emoji: '📜', nameHebrew: 'סיוון' },      // May-Jun
  { name: 'Tammuz', emoji: '☀️', nameHebrew: 'תמוז' },      // Jun-Jul
  { name: 'Av', emoji: '💔', nameHebrew: 'אב' },            // Jul-Aug
  { name: 'Elul', emoji: '📯', nameHebrew: 'אלול' },        // Aug-Sep
];

// Julian day number calculation (simplified)
const getJulianDayNumber = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + 
         Math.floor(y / 4) - Math.floor(y / 100) + 
         Math.floor(y / 400) - 32045;
};

// Convert Julian day to Hebrew date (simplified algorithm)
const julianToHebrew = (jdn: number): { year: number; month: number; day: number } => {
  // This is a simplified conversion
  // Hebrew calendar epoch: -3760 in Gregorian calendar
  const hebrewEpoch = 347998; // JDN of 1 Tishrei 1
  
  const daysSinceEpoch = jdn - hebrewEpoch;
  
  // Average Hebrew year is 365.2468 days
  const avgYear = 365.2468;
  const approxYear = Math.floor(daysSinceEpoch / avgYear) + 1;
  
  // Average month is ~29.5 days
  const avgMonth = 29.5;
  const daysInYear = daysSinceEpoch - (approxYear - 1) * avgYear;
  const approxMonth = Math.floor(daysInYear / avgMonth) + 1;
  
  return {
    year: approxYear,
    month: Math.max(1, Math.min(12, approxMonth)),
    day: Math.floor(daysInYear % avgMonth) + 1,
  };
};

/**
 * Get the Hebrew month(s) for a given week
 * A week might span two Hebrew months
 * @param startDate The start date of the week
 * @returns An array of HebrewMonth objects
 */
export const getWeekHebrewMonths = (startDate: Date): HebrewMonth[] => {
  const months: HebrewMonth[] = [];
  const daysInWeek = 7;
  const seenMonths = new Set<number>();

  for (let i = 0; i < daysInWeek; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const jdn = getJulianDayNumber(currentDate);
    const hebrewDate = julianToHebrew(jdn);
    
    // Ensure month is in valid range (1-12)
    const monthIndex = ((hebrewDate.month - 1) % 12 + 12) % 12;
    
    if (!seenMonths.has(monthIndex)) {
      seenMonths.add(monthIndex);
      months.push(HEBREW_MONTHS[monthIndex]);
    }
  }
  
  return months;
};

/**
 * Get Hebrew month emoji
 * @param month Hebrew month object
 * @returns Emoji string
 */
export const getHebrewMonthEmoji = (month: HebrewMonth): string => {
  return month.emoji;
};

/**
 * Get Hebrew month name
 * @param month Hebrew month object
 * @param useHebrew Whether to use Hebrew characters
 * @returns Month name string
 */
export const getHebrewMonthName = (month: HebrewMonth, useHebrew: boolean = false): string => {
  return useHebrew ? month.nameHebrew : month.name;
};

