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
 * Get the week number where a month starts (accurately)
 */
export const getMonthStartWeek = (monthIndex: number, year?: number): number => {
  const currentYear = year ?? new Date().getFullYear();
  // Get the first day of the month
  const firstDayOfMonth = new Date(currentYear, monthIndex, 1);
  // Calculate week number from start of year
  return getWeekNumber(firstDayOfMonth);
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

/**
 * Open Google Calendar for a specific week
 */
export const openGoogleCalendarForWeek = (weekNumber: number, year?: number): void => {
  const startDate = getWeekStartDate(weekNumber, year);
  
  // Format: YYYY/MM/DD for Google Calendar URL
  const yearStr = startDate.getFullYear();
  const month = String(startDate.getMonth() + 1).padStart(2, '0');
  const day = String(startDate.getDate()).padStart(2, '0');
  
  // Open Google Calendar in week view for this date
  // Format: /r/week/YYYY/MM/DD
  const calendarUrl = `https://calendar.google.com/calendar/u/0/r/week/${yearStr}/${month}/${day}`;
  window.open(calendarUrl, '_blank');
};

