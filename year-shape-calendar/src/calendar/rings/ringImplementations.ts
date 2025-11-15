/**
 * @fileoverview Concrete ring implementations
 */

import { Ring } from './Ring';
import { DayBasedRing, type DayBasedSector } from './DayBasedRing';
import { CALENDAR_CONSTANTS, SEASON_DATES } from './constants';

/**
 * Seasons ring - Meteorological seasons (3 months each)
 */
export class SeasonsRing extends Ring {
  private seasons: Array<{ name: string; startDay: number; endDay: number }>;

  constructor() {
    super('seasons', 'gradient-seasons');
    // Meteorological seasons: 3 months each, positioned clearly
    // Winter on top, Spring on right, Summer on bottom, Autumn on left
    this.seasons = [
      {
        name: 'Winter',
        startDay: SEASON_DATES.WINTER_START, // Dec 1 (day 334)
        endDay: CALENDAR_CONSTANTS.DAYS_IN_YEAR + SEASON_DATES.WINTER_END, // wraps to Mar 1
      },
      {
        name: 'Spring',
        startDay: SEASON_DATES.SPRING_START, // Mar 1 (day 59)
        endDay: SEASON_DATES.SUMMER_START, // Jun 1 (day 151)
      },
      {
        name: 'Summer',
        startDay: SEASON_DATES.SUMMER_START, // Jun 1 (day 151)
        endDay: SEASON_DATES.AUTUMN_START, // Sep 1 (day 243)
      },
      {
        name: 'Autumn',
        startDay: SEASON_DATES.AUTUMN_START, // Sep 1 (day 243)
        endDay: SEASON_DATES.WINTER_START, // Dec 1 (day 334)
      },
    ];
  }

  get sectorCount(): number {
    return this.seasons.length;
  }

  getSectorLabel(index: number): string {
    return this.seasons[index].name;
  }

  // Override layout to use actual day-based positioning for seasons
  layout(
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    cornerRadius: number,
    direction: number = 1,
    rotationOffset: number = 0
  ): void {
    this.centerX = centerX;
    this.centerY = centerY;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
    this.cornerRadius = cornerRadius;
    this.direction = direction;

    if (!this.svgGroup) return;

    // Clear previous content
    this.svgGroup.innerHTML = '';

    const daysInYear = CALENDAR_CONSTANTS.DAYS_IN_YEAR;
    const baseOffset = CALENDAR_CONSTANTS.BASE_OFFSET;
    const rotationRad = (rotationOffset * Math.PI) / 180;
    
    // Center winter on top: Winter spans Dec 1 (334) to Mar 1 (59)
    // Total winter days: (365 - 334) + 59 = 31 + 59 = 90 days
    // Midpoint from Dec 1: 90/2 = 45 days
    // Midpoint day: 334 + 45 = 379, wraps to day 14 (Jan 15)
    // But for visual centering, we want the midpoint of the two segments
    // Segment 1: Dec 1 (334) to Dec 31 (365) = 32 days, midpoint at day 349.5 (Dec 16.5)
    // Segment 2: Jan 1 (0) to Mar 1 (59) = 60 days, midpoint at day 29.5 (Jan 30.5)
    // Visual center between the two: approximately at Jan 1 (day 0) - the boundary point
    // Actually, to center winter exactly on top, we offset so Jan 1 (day 0) is at top
    // Since baseOffset already positions Jan 1 at top, we just use baseOffset
    // But we need to account for the fact that winter's visual center should be at top
    // The most natural centering: offset by -(334/365 * 2π) to move Dec 1 to top, then adjust
    // Actually simpler: offset by about 15 days so the midpoint (Jan 15) is at top
    const winterMidpointDay = 15; // Jan 16 (approximately the middle of winter considering both segments)
    const winterMidpointAngle = (winterMidpointDay / daysInYear) * CALENDAR_CONSTANTS.FULL_CIRCLE;
    const seasonOffset = baseOffset - winterMidpointAngle;
    
    const angleOffset = seasonOffset + rotationRad;

    for (let i = 0; i < this.seasons.length; i++) {
      const season = this.seasons[i];
      let startDay = season.startDay;
      let endDay = season.endDay;

      // Handle winter wrap-around (crosses year boundary)
      if (startDay > endDay && i === 0) {
        // Winter: Split into two segments
        // Segment 1: Dec 1 (334) - Dec 31 (365)
        const seg1Start = (startDay / daysInYear) * Math.PI * 2;
        const seg1End = (daysInYear / daysInYear) * Math.PI * 2;

        const startAngle1 = angleOffset + seg1Start;
        const endAngle1 = angleOffset + seg1End;

        const mirroredStart1 =
          this.direction === -1 ? Math.PI - endAngle1 : startAngle1;
        const mirroredEnd1 =
          this.direction === -1 ? Math.PI - startAngle1 : endAngle1;

        this.drawSector(i, mirroredStart1, mirroredEnd1);

        // Segment 2: Jan 1 (0) - Mar 1 (59)
        const seg2Start = 0;
        const seg2End =
          ((endDay - daysInYear) / daysInYear) * Math.PI * 2;

        const startAngle2 = angleOffset + seg2Start;
        const endAngle2 = angleOffset + seg2End;

        const mirroredStart2 =
          this.direction === -1 ? Math.PI - endAngle2 : startAngle2;
        const mirroredEnd2 =
          this.direction === -1 ? Math.PI - startAngle2 : endAngle2;

        this.drawSector(i, mirroredStart2, mirroredEnd2);
      } else {
        // Regular season (doesn't wrap)
        const progress = (startDay / daysInYear) * Math.PI * 2;
        const endProgress = (endDay / daysInYear) * Math.PI * 2;

        const startAngle = angleOffset + progress;
        const endAngle = angleOffset + endProgress;

        const mirroredStart =
          this.direction === -1 ? Math.PI - endAngle : startAngle;
        const mirroredEnd =
          this.direction === -1 ? Math.PI - startAngle : endAngle;

        this.drawSector(i, mirroredStart, mirroredEnd);
      }
    }

    // Draw separator line
    this.drawSeparator();
  }
}

/**
 * Gregorian months ring
 */
export class MonthsRing extends DayBasedRing {
  private gregorianMonths: Array<{ name: string; startDay: number; endDay: number }>;

  constructor() {
    super('months', 'gradient-months');
    // Gregorian months with actual day counts for 2025 (non-leap year)
    this.gregorianMonths = [
      { name: 'Jan', startDay: 0, endDay: 31 }, // 31 days
      { name: 'Feb', startDay: 31, endDay: 59 }, // 28 days (2025 is not a leap year)
      { name: 'Mar', startDay: 59, endDay: 90 }, // 31 days
      { name: 'Apr', startDay: 90, endDay: 120 }, // 30 days
      { name: 'May', startDay: 120, endDay: 151 }, // 31 days
      { name: 'Jun', startDay: 151, endDay: 181 }, // 30 days
      { name: 'Jul', startDay: 181, endDay: 212 }, // 31 days
      { name: 'Aug', startDay: 212, endDay: 243 }, // 31 days
      { name: 'Sep', startDay: 243, endDay: 273 }, // 30 days
      { name: 'Oct', startDay: 273, endDay: 304 }, // 31 days
      { name: 'Nov', startDay: 304, endDay: 334 }, // 30 days
      { name: 'Dec', startDay: 334, endDay: 365 }, // 31 days
    ];
  }

  get sectorCount(): number {
    return this.gregorianMonths.length;
  }

  getSectorLabel(index: number): string {
    // Return month name with number (e.g., "1 Jan", "2 Feb", etc.)
    return `${index + 1} ${this.gregorianMonths[index].name}`;
  }

  // Override to use white fill with no background (matching year/week style)
  getSectorColor(_index: number): string {
    return 'white';
  }

  // Use DayBasedRing's layout implementation
  protected getSectors(): DayBasedSector[] {
    return this.gregorianMonths;
  }
}

/**
 * Hebrew months ring
 */
export class HebrewMonthsRing extends DayBasedRing {
  private hebrewMonths: Array<{ name: string; startDay: number; endDay: number }>;

  constructor() {
    super('hebrew', 'gradient-hebrew');
    // Hebrew months that occur during Gregorian year 2025
    // Calculated using actual Hebrew calendar dates
    this.hebrewMonths = [
      { name: 'Tevet', startDay: 0, endDay: 29 }, // Jan 1 - Jan 29 (5785)
      { name: 'Shevat', startDay: 29, endDay: 58 }, // Jan 30 - Feb 27 (5785)
      { name: 'Adar', startDay: 58, endDay: 88 }, // Feb 28 - Mar 29 (5785)
      { name: 'Nisan', startDay: 88, endDay: 117 }, // Mar 30 - Apr 27 (5785)
      { name: 'Iyar', startDay: 117, endDay: 147 }, // Apr 28 - May 27 (5785)
      { name: 'Sivan', startDay: 147, endDay: 176 }, // May 28 - Jun 25 (5785)
      { name: 'Tammuz', startDay: 176, endDay: 206 }, // Jun 26 - Jul 25 (5785)
      { name: 'Av', startDay: 206, endDay: 235 }, // Jul 26 - Aug 23 (5785)
      { name: 'Elul', startDay: 235, endDay: 265 }, // Aug 24 - Sep 22 (5785)
      { name: 'Tishrei', startDay: 265, endDay: 295 }, // Sep 23 - Oct 22 (5786)
      { name: 'Cheshvan', startDay: 295, endDay: 324 }, // Oct 23 - Nov 20 (5786)
      { name: 'Kislev', startDay: 324, endDay: 354 }, // Nov 21 - Dec 20 (5786)
      { name: 'Tevet', startDay: 354, endDay: 365 }, // Dec 21 - Dec 31 (5786)
    ];
  }

  get sectorCount(): number {
    return this.hebrewMonths.length;
  }

  getSectorLabel(index: number): string {
    return this.hebrewMonths[index].name;
  }

  // Use DayBasedRing's layout implementation
  protected getSectors(): DayBasedSector[] {
    return this.hebrewMonths;
  }
}

/**
 * Weeks ring - 52 weeks in a year
 */
export class WeeksRing extends Ring {
  constructor() {
    super('weeks', 'gradient-weeks');
  }

  get sectorCount(): number {
    return 52;
  }

  getSectorLabel(index: number): string {
    // Only label every 4th week to avoid clutter
    return (index + 1) % 4 === 0 ? `W${index + 1}` : '';
  }
}

/**
 * Holidays ring - Major holidays for 2025
 */
export class HolidaysRing extends DayBasedRing {
  private holidays: Array<{ name: string; day: number }>;
  private readonly HOLIDAY_SECTOR_WIDTH_DAYS = 3; // ±1.5 days for visibility

  constructor() {
    super('holidays', 'gradient-holidays');
    // Major holidays for 2025 (Hebrew, Christian, European)
    this.holidays = [
      { name: '🎆 New Year', day: 0 }, // Jan 1
      { name: '🕯️ Tu BiShvat', day: 43 }, // Feb 13
      { name: '💝 Valentine', day: 44 }, // Feb 14
      { name: '🎭 Purim', day: 73 }, // Mar 14
      { name: '✝️ Palm Sun', day: 103 }, // Apr 13
      { name: '🍷 Passover', day: 111 }, // Apr 22
      { name: '✝️ Easter', day: 109 }, // Apr 20
      { name: '🕊️ Yom HaShoah', day: 122 }, // May 2
      { name: '🇮🇱 Yom HaAtzmaut', day: 129 }, // May 9
      { name: '👨 Father Day', day: 165 }, // Jun 15
      { name: '🇺🇸 July 4th', day: 184 }, // Jul 4
      { name: '🕊️ Tisha B\'Av', day: 216 }, // Aug 5
      { name: '🍎 Rosh Hashanah', day: 266 }, // Sep 23-24
      { name: '☪️ Yom Kippur', day: 275 }, // Oct 2
      { name: '🕋 Sukkot', day: 280 }, // Oct 7
      { name: '🎃 Halloween', day: 303 }, // Oct 31
      { name: '🦃 Thanksgiving', day: 330 }, // Nov 27
      { name: '🕎 Hanukkah', day: 338 }, // Dec 5
      { name: '🎄 Christmas', day: 358 }, // Dec 25
      { name: '🎊 New Year Eve', day: 364 }, // Dec 31
    ];
  }

  get sectorCount(): number {
    return this.holidays.length;
  }

  getSectorLabel(index: number): string {
    return this.holidays[index].name;
  }

  /**
   * Override to create narrow sectors around holiday days
   */
  protected getSectors(): DayBasedSector[] {
    const daysInYear = CALENDAR_CONSTANTS.DAYS_IN_YEAR;
    const halfWidth = this.HOLIDAY_SECTOR_WIDTH_DAYS / 2;

    return this.holidays.map((holiday) => ({
      startDay: Math.max(0, holiday.day - halfWidth),
      endDay: Math.min(daysInYear - 1, holiday.day + halfWidth),
    }));
  }
}

