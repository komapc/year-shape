import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ZoomMode } from '../ZoomMode';

describe('ZoomMode Wheel Navigation Bug', () => {
  let container: HTMLElement;
  let zoomMode: ZoomMode;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'zoom-container';
    document.body.appendChild(container);
    // Mock current date to be January 1st, 2025
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1)); // January
  });

  afterEach(() => {
    if (zoomMode) {
      zoomMode.destroy();
    }
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  it('should zoom into the hovered month when scrolling down on a month sector', () => {
    zoomMode = new ZoomMode(container, 2025);
    
    // Ensure we are at year level
    expect(zoomMode.getCurrentState().level).toBe('year');

    // Find the sector for March (index 2)
    // CircleRenderer adds data-index and data-value attributes to path
    const marchSector = container.querySelector('path[data-value="2"]');
    expect(marchSector).toBeTruthy();

    if (!marchSector) return;

    // Simulate wheel event (scroll down = positive deltaY)
    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 150, 
    });

    marchSector.dispatchEvent(wheelEvent);
    vi.advanceTimersByTime(300);

    const state = zoomMode.getCurrentState();
    expect(state.level).toBe('month');
    expect(state.month).toBe(2); 
  });

  it('should zoom into the hovered day/week when scrolling down in month view', () => {
    // Start in Month view (March)
    zoomMode = new ZoomMode(container, 2025, { level: 'month', month: 2 });
    
    // Find sector for March 15th
    const day15Sector = container.querySelector('path[data-day="15"]');
    expect(day15Sector).toBeTruthy();

    if (!day15Sector) return;

    // Scroll down significantly (>100) to zoom to day level
    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 150, 
    });

    day15Sector.dispatchEvent(wheelEvent);
    vi.advanceTimersByTime(300);

    const state = zoomMode.getCurrentState();
    expect(state.level).toBe('day');
    expect(state.day).toBe(15);
    expect(state.month).toBe(2);
  });

  it('should zoom out to month when scrolling up in week view', () => {
    // Start in Week view (March, Week 10)
    zoomMode = new ZoomMode(container, 2025, { level: 'week', month: 2, week: 10 });
    
    // Find any day sector in week view
    const weekDaySector = container.querySelector('path[data-day="0"]'); // Sunday
    expect(weekDaySector).toBeTruthy();

    if (!weekDaySector) return;

    // Scroll up (negative deltaY) to zoom out
    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -150, 
    });

    weekDaySector.dispatchEvent(wheelEvent);
    vi.advanceTimersByTime(300);

    const state = zoomMode.getCurrentState();
    expect(state.level).toBe('month');
    expect(state.month).toBe(2);
  });

  it('should zoom out to week when scrolling up in day view', () => {
    // Start in Day view (March 15)
    zoomMode = new ZoomMode(container, 2025, { level: 'day', month: 2, day: 15 });
    
    // Find an hour sector
    const hourSector = container.querySelector('path[data-hour="10"]');
    expect(hourSector).toBeTruthy();

    if (!hourSector) return;

    // Scroll up to zoom out
    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -150, 
    });

    hourSector.dispatchEvent(wheelEvent);
    vi.advanceTimersByTime(300);

    const state = zoomMode.getCurrentState();
    expect(state.level).toBe('week');
  });
});