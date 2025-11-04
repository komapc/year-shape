/**
 * Type definitions for the Year Shape Calendar application
 */

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export type Direction = -1 | 1; // -1 = counter-clockwise, 1 = clockwise

export interface CalendarEvent {
  summary: string;
  start?: string;
  end?: string;
  _day?: number; // 0-6 (Mon-Sun)
  _weekIndex?: number;
}

export interface WeekData {
  weekIndex: number;
  season: Season;
  events: CalendarEvent[];
  element: HTMLElement;
}

export interface CalendarState {
  direction: Direction;
  seasons: Season[];
  weeks: WeekData[];
  eventsByWeek: Record<number, CalendarEvent[]>;
  cornerRadius: number;
  isAuthenticated: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface CalendarConfig {
  totalWeeks: number;
  startAngle: number;
  defaultSeasons: Season[];
}

export interface GoogleCalendarConfig {
  clientId: string;
  apiKey: string;
  discoveryDoc: string;
  scopes: string;
}

