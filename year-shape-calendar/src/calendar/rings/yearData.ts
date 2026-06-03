/**
 * @fileoverview Year-derived data for the rings calendar mode.
 *
 * The ring renderer positions every sector on a 365-"day" circle
 * (`CALENDAR_CONSTANTS.DAYS_IN_YEAR`). To stay correct across leap years and
 * across calendars that drift relative to the Gregorian one (Hebrew months,
 * movable holidays), all sector boundaries are computed here from the actual
 * year rather than hardcoded. Day positions are normalized back onto the
 * fixed 365-day circle so the ring always closes cleanly.
 */

import { CALENDAR_CONSTANTS } from './constants';

const NORM_DAYS = CALENDAR_CONSTANTS.DAYS_IN_YEAR; // 365 — circle normalization target
const MS_PER_DAY = 86_400_000;

export interface NamedDaySector {
  name: string;
  startDay: number;
  endDay: number;
}

export interface HolidayPoint {
  name: string;
  day: number;
}

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInYear = (year: number): number => (isLeapYear(year) ? 366 : 365);

/** Day-of-year for a date, 0-indexed from Jan 1 (uses UTC noon to dodge DST). */
const dayOfYear = (year: number, month: number, day: number): number => {
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month, day);
  return Math.round((current - start) / MS_PER_DAY);
};

/** Map a real day-of-year onto the fixed 365-day circle. */
const normalize = (realDay: number, year: number): number =>
  (realDay * NORM_DAYS) / daysInYear(year);

/**
 * Gregorian months for the given year, with leap-year-correct boundaries.
 */
export const getGregorianMonthSectors = (year: number): NamedDaySector[] => {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names.map((name, month) => {
    const startReal = dayOfYear(year, month, 1);
    const endReal = month < 11 ? dayOfYear(year, month + 1, 1) : daysInYear(year);
    return { name, startDay: normalize(startReal, year), endDay: normalize(endReal, year) };
  });
};

// Intl spells some Hebrew months differently from this project's display style.
const HEBREW_NAME_OVERRIDES: Record<string, string> = {
  Tishri: 'Tishrei',
  Heshvan: 'Cheshvan',
  Tamuz: 'Tammuz',
};

// timeZone: 'UTC' is required: the dates are built at noon UTC, so formatting
// in the runtime's zone would roll the day forward at UTC+13/+14 and shift
// every Hebrew-month boundary by one day.
const hebrewMonthFormatter = new Intl.DateTimeFormat('en-u-ca-hebrew', { month: 'long', timeZone: 'UTC' });

const hebrewMonthOf = (date: Date): string => {
  const raw = hebrewMonthFormatter.formatToParts(date).find((p) => p.type === 'month')?.value ?? '';
  return HEBREW_NAME_OVERRIDES[raw] ?? raw;
};

/**
 * Hebrew months overlapping the given Gregorian year, as contiguous segments.
 * The count varies (12–13) with the Hebrew leap cycle.
 */
export const getHebrewMonthSectors = (year: number): NamedDaySector[] => {
  const total = daysInYear(year);
  const sectors: NamedDaySector[] = [];
  let currentName = '';
  let segmentStart = 0;

  for (let d = 0; d < total; d++) {
    const name = hebrewMonthOf(new Date(Date.UTC(year, 0, 1 + d, 12)));
    if (name !== currentName) {
      if (currentName) {
        sectors.push({ name: currentName, startDay: normalize(segmentStart, year), endDay: normalize(d, year) });
      }
      currentName = name;
      segmentStart = d;
    }
  }
  sectors.push({ name: currentName, startDay: normalize(segmentStart, year), endDay: NORM_DAYS });
  return sectors;
};

const nthWeekdayOfMonth = (year: number, month: number, weekday: number, n: number): number => {
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const offset = (weekday - firstDow + 7) % 7;
  return 1 + offset + (n - 1) * 7;
};

/** Western (Gregorian computus) Easter Sunday for the given year. */
const easterDate = (year: number): { month: number; day: number } => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month: month - 1, day };
};

/** Find the first day in `year` whose Hebrew month/day matches, or null. */
const findHebrewDate = (
  year: number,
  matchMonth: (name: string) => boolean,
  hebrewDay: number
): number | null => {
  const dayFormatter = new Intl.DateTimeFormat('en-u-ca-hebrew', { month: 'long', day: 'numeric', timeZone: 'UTC' });
  for (let d = 0; d < daysInYear(year); d++) {
    const parts = dayFormatter.formatToParts(new Date(Date.UTC(year, 0, 1 + d, 12)));
    const rawMonth = parts.find((p) => p.type === 'month')?.value ?? '';
    const month = HEBREW_NAME_OVERRIDES[rawMonth] ?? rawMonth;
    const day = Number(parts.find((p) => p.type === 'day')?.value ?? '0');
    if (day === hebrewDay && matchMonth(month)) return d;
  }
  return null;
};

// In Hebrew leap years the festival month is Adar II; otherwise plain "Adar".
const adarMatcher = (name: string): boolean => name === 'Adar' || name === 'Adar II';

/**
 * Major holidays (Gregorian fixed, Western movable, and Hebrew) for the year.
 * Hebrew/Christian feasts are computed, so they track the real calendar.
 */
export const getHolidayPoints = (year: number): HolidayPoint[] => {
  const easter = easterDate(year);
  const easterDoy = dayOfYear(year, easter.month, easter.day);

  const raw: Array<{ name: string; realDay: number | null }> = [
    { name: '🎆 New Year', realDay: dayOfYear(year, 0, 1) },
    { name: '🕯️ Tu BiShvat', realDay: findHebrewDate(year, (m) => m === 'Shevat', 15) },
    { name: '💝 Valentine', realDay: dayOfYear(year, 1, 14) },
    { name: '🎭 Purim', realDay: findHebrewDate(year, adarMatcher, 14) },
    { name: '✝️ Palm Sun', realDay: easterDoy - 7 },
    { name: '🍷 Passover', realDay: findHebrewDate(year, (m) => m === 'Nisan', 15) },
    { name: '✝️ Easter', realDay: easterDoy },
    { name: '🕊️ Yom HaShoah', realDay: findHebrewDate(year, (m) => m === 'Nisan', 27) },
    { name: '🇮🇱 Yom HaAtzmaut', realDay: findHebrewDate(year, (m) => m === 'Iyar', 5) },
    { name: '👨 Father Day', realDay: dayOfYear(year, 5, nthWeekdayOfMonth(year, 5, 0, 3)) },
    { name: '🇺🇸 July 4th', realDay: dayOfYear(year, 6, 4) },
    { name: "🕊️ Tisha B'Av", realDay: findHebrewDate(year, (m) => m === 'Av', 9) },
    { name: '🍎 Rosh Hashanah', realDay: findHebrewDate(year, (m) => m === 'Tishrei', 1) },
    { name: '☪️ Yom Kippur', realDay: findHebrewDate(year, (m) => m === 'Tishrei', 10) },
    { name: '🕋 Sukkot', realDay: findHebrewDate(year, (m) => m === 'Tishrei', 15) },
    { name: '🎃 Halloween', realDay: dayOfYear(year, 9, 31) },
    { name: '🦃 Thanksgiving', realDay: dayOfYear(year, 10, nthWeekdayOfMonth(year, 10, 4, 4)) },
    { name: '🕎 Hanukkah', realDay: findHebrewDate(year, (m) => m === 'Kislev', 25) },
    { name: '🎄 Christmas', realDay: dayOfYear(year, 11, 25) },
    { name: '🎊 New Year Eve', realDay: dayOfYear(year, 11, 31) },
  ];

  return raw
    .filter((h): h is { name: string; realDay: number } => h.realDay !== null && h.realDay >= 0)
    .map((h) => ({ name: h.name, day: normalize(h.realDay, year) }));
};
