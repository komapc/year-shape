/**
 * Application constants
 */

import type { CalendarConfig, GoogleCalendarConfig, Season } from '../types';

export const CALENDAR_CONFIG: CalendarConfig = {
  totalWeeks: 52,
  startAngle: -90, // Start at top (in degrees)
  defaultSeasons: ['winter', 'spring', 'summer', 'autumn'],
};

export const GOOGLE_CALENDAR_CONFIG: GoogleCalendarConfig = {
  clientId: '673675348097-pb541d3cvvho7jjuas8cssdtbg7v9rhd.apps.googleusercontent.com',
  apiKey: 'AIzaSyDI0DE-yD3QnBWZIFvasipffohy7FePe-o',
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  scopes: 'https://www.googleapis.com/auth/calendar.readonly',
};

export const SEASON_LABELS: Record<Season, string> = {
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
};

export const SEASON_POSITIONS = {
  winter: 'top',
  spring: 'left',
  summer: 'bottom',
  autumn: 'right',
} as const;

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

