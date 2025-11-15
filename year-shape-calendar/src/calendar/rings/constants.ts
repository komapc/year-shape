/**
 * @fileoverview Constants for rings calendar mode
 */

export const CALENDAR_CONSTANTS = {
  DAYS_IN_YEAR: 365,
  BASE_OFFSET: -Math.PI / 2, // Start at top (12 o'clock, Jan 1)
  FULL_CIRCLE: Math.PI * 2,
  PERIMETER_TOLERANCE: 0.1,
  MAX_PERIMETER_ITERATIONS: 50,
  MIN_RADIUS: 10,
  MAX_RADIUS: 500,
} as const;

/**
 * Meteorological season dates (3 months each)
 * Each season covers exactly 3 months for clean alignment:
 * - Winter: Dec, Jan, Feb (centered on top)
 * - Spring: Mar, Apr, May (centered on right)
 * - Summer: Jun, Jul, Aug (centered on bottom)
 * - Autumn: Sep, Oct, Nov (centered on left)
 *
 * Day numbers are 0-indexed from Jan 1.
 */
export const SEASON_DATES = {
  WINTER_START: 334, // Dec 1 (day 334)
  SPRING_START: 59, // Mar 1 (day 59)
  SUMMER_START: 151, // Jun 1 (day 151)
  AUTUMN_START: 243, // Sep 1 (day 243)
  WINTER_END: 59, // Mar 1 (next year)
} as const;

export const SVG_CONFIG = {
  PATH_SEGMENTS: 360,
  LABEL_FONT_SIZE: 13,
  CENTER_TEXT_SIZE: 32,
  SEPARATOR_STROKE_WIDTH: 3,
  SECTOR_STROKE_WIDTH: 1.5,
} as const;

/**
 * Ring system layout constants
 */
export const RING_SYSTEM_CONFIG = {
  DEFAULT_BASE_RADIUS: 250,
  DEFAULT_RING_WIDTH: 50,
  RING_GAP: 5,
  MIN_RING_WIDTH: 10,
  MAX_RING_WIDTH: 150,
  MIN_INNER_RADIUS: 50, // Minimum free space in center
  TODAY_LINE_EXTENSION: 15, // Pixels to extend today indicator beyond ring
} as const;

/**
 * Precision settings for SVG path generation
 */
export const PRECISION_CONFIG = {
  DEFAULT: 2, // Decimal places for most rings
  HIGH: 4, // Decimal places for rings with many sectors (>20)
  SECTOR_COUNT_THRESHOLD: 20, // Use high precision above this count
} as const;

