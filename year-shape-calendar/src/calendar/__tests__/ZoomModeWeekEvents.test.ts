/**
 * The zoom week view must list the events of the seven days it draws.
 *
 * Events come from the real fetchEvents (gapi stubbed), which groups them by
 * date.ts's 7-day blocks from Jan 1 (the wheel's weeks). The zoom week view
 * shows Sunday–Saturday weeks, so it must not read those groups by index.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ZoomMode, getSundayWeek } from '../ZoomMode';
import { googleCalendarService } from '../../services/googleCalendar';

// Local times without an offset: the calendar day is the same in every timezone.
const ITEMS = [
  { summary: 'New Year', start: { dateTime: '2026-01-01T10:00:00' } }, // Thu, week Dec 28 – Jan 3
  { summary: 'Thursday 12', start: { dateTime: '2026-03-12T10:00:00' } }, // Thu, week Mar 8 – 14
  { summary: 'Sunday 15', start: { dateTime: '2026-03-15T10:00:00' } }, // Sun, week Mar 15 – 21
  { summary: 'Wednesday 18', start: { dateTime: '2026-03-18T10:00:00' } }, // Wed, week Mar 15 – 21
  { summary: 'Saturday 21', start: { dateTime: '2026-03-21T10:00:00' } }, // Sat, week Mar 15 – 21
  { summary: 'Monday 23', start: { dateTime: '2026-03-23T10:00:00' } }, // Mon, week Mar 22 – 28
  { summary: 'Sunday 27 Dec', start: { dateTime: '2026-12-27T10:00:00' } }, // Sun, week Dec 27 – Jan 2
  { summary: 'Year end', start: { dateTime: '2026-12-31T10:00:00' } }, // Thu, week Dec 27 – Jan 2
];

const weekViewEvents = (container: HTMLElement, events: Awaited<ReturnType<typeof googleCalendarService.fetchEvents>>, day: [number, number]): { texts: string[]; zoom: ZoomMode } => {
  const week = getSundayWeek(2026, day[0], day[1]);
  const zoom = new ZoomMode(container, 2026, { level: 'week', week });
  zoom.updateEvents(events);
  const texts = Array.from(container.querySelectorAll('.event-text')).map((el) => el.textContent || '');
  return { texts, zoom };
};

describe('ZoomMode week view: events of the drawn week', () => {
  let container: HTMLElement;
  let zoom: ZoomMode | null = null;
  let events: Awaited<ReturnType<typeof googleCalendarService.fetchEvents>>;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.stubGlobal('gapi', {
      client: { calendar: { events: { list: vi.fn().mockResolvedValue({ result: { items: ITEMS } }) } } },
    });
    (googleCalendarService as unknown as { isAuthenticated: boolean }).isAuthenticated = true;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    events = await googleCalendarService.fetchEvents(2026);
  });

  afterEach(() => {
    zoom?.destroy();
    zoom = null;
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows Sunday–Wednesday events in their own week, not the one before', () => {
    const r = weekViewEvents(container, events, [2, 15]);
    zoom = r.zoom;
    expect(r.texts).toEqual(['Sunday 15', 'Wednesday 18', 'Saturday 21']);
  });

  it('does not show events from the following week', () => {
    const r = weekViewEvents(container, events, [2, 12]);
    zoom = r.zoom;
    expect(r.texts).toEqual(['Thursday 12']);
  });

  it('shows the first week of the year', () => {
    const r = weekViewEvents(container, events, [0, 1]);
    zoom = r.zoom;
    expect(r.texts).toEqual(['New Year']);
  });

  it('reaches the last days of the year', () => {
    const r = weekViewEvents(container, events, [11, 31]);
    zoom = r.zoom;
    expect(r.texts).toEqual(['Sunday 27 Dec', 'Year end']);
    expect(container.querySelector('.day-label')?.textContent).toContain('27');
  });
});

describe('getSundayWeek', () => {
  it('counts Sunday–Saturday weeks from the Sunday on or before Jan 1', () => {
    expect(getSundayWeek(2026, 0, 1)).toBe(0); // Thu; week starts Sun Dec 28 2025
    expect(getSundayWeek(2026, 0, 3)).toBe(0); // Sat
    expect(getSundayWeek(2026, 0, 4)).toBe(1); // Sun
    expect(getSundayWeek(2026, 11, 31)).toBe(52); // Thu; week starts Sun Dec 27
    expect(getSundayWeek(2028, 0, 1)).toBe(0); // Sat
    expect(getSundayWeek(2028, 11, 31)).toBe(53); // Sun, leap year starting on Saturday
  });

  it('is not shifted by daylight saving time', () => {
    vi.stubEnv('TZ', 'America/New_York');
    try {
      expect(new Date(2026, 2, 8, 12).getTimezoneOffset()).toBe(240); // the zone took effect: EDT
      expect(getSundayWeek(2026, 2, 8)).toBe(10); // Sun, DST starts
      expect(getSundayWeek(2026, 2, 14)).toBe(10);
      expect(getSundayWeek(2026, 10, 1)).toBe(44); // Sun, DST ends
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
