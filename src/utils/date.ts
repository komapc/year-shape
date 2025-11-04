/**
 * Date utilities for calendar calculations
 */

import type { CalendarEvent } from '../types';

/**
 * Get the week number of a date (0-51)
 */
export const getWeekNumber = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
};

/**
 * Get the day of week (0 = Sunday, 6 = Saturday)
 */
export const getDayOfWeek = (date: Date): number => {
  return date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
};

/**
 * Get the start date of a week number (0-51)
 */
export const getWeekStartDate = (weekNumber: number, year?: number): Date => {
  const currentYear = year ?? new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const daysToAdd = weekNumber * 7;
  return new Date(startOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
};

/**
 * Get the end date of a week number (0-51)
 */
export const getWeekEndDate = (weekNumber: number, year?: number): Date => {
  const startDate = getWeekStartDate(weekNumber, year);
  return new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get month names
 */
export const getMonthNames = (): string[] => {
  return [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
};

/**
 * Get abbreviated month names
 */
export const getMonthNamesShort = (): string[] => {
  return [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
};

/**
 * Get the week number where a month starts (approximately)
 */
export const getMonthStartWeek = (monthIndex: number): number => {
  // Approximate: 52 weeks / 12 months ≈ 4.33 weeks per month
  return Math.floor((monthIndex * 52) / 12);
};

/**
 * Map Google Calendar events to our internal format
 */
export const mapGoogleCalendarEvent = (
  event: gapi.client.calendar.Event,
  weekIndex: number
): CalendarEvent => {
  const startStr = event.start?.dateTime || event.start?.date || '';
  const startDate = new Date(startStr);
  
  return {
    summary: event.summary || 'Untitled Event',
    start: startStr,
    end: event.end?.dateTime || event.end?.date,
    _day: getDayOfWeek(startDate),
    _weekIndex: weekIndex,
  };
};

/**
 * Group events by week number
 */
export const groupEventsByWeek = (
  events: CalendarEvent[]
): Record<number, CalendarEvent[]> => {
  const grouped: Record<number, CalendarEvent[]> = {};
  
  events.forEach(event => {
    if (event._weekIndex !== undefined) {
      if (!grouped[event._weekIndex]) {
        grouped[event._weekIndex] = [];
      }
      grouped[event._weekIndex].push(event);
    }
  });
  
  return grouped;
};

