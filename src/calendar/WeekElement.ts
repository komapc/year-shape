/**
 * Week element class for managing individual week visualizations
 */

import type { Season, CalendarEvent } from '../types';
import { createElement, makeAccessible } from '../utils/dom';

export class WeekElement {
  private element: HTMLDivElement;
  private weekIndex: number;
  private season: Season;
  private events: CalendarEvent[] = [];
  private onClickCallback?: (weekIndex: number) => void;

  constructor(weekIndex: number, season: Season) {
    this.weekIndex = weekIndex;
    this.season = season;
    this.element = this.createWeekElement();
  }

  /**
   * Create the week element
   */
  private createWeekElement = (): HTMLDivElement => {
    const element = createElement('div', [
      'week',
      'absolute',
      'w-3',
      'h-3',
      'rounded-sm',
      'transition-all',
      'duration-300',
      'cursor-pointer',
      'border',
      'border-dark-border',
      'bg-transparent',
      'hover:scale-[2]',
      'hover:z-10',
    ]);

    element.dataset.week = this.weekIndex.toString();
    element.dataset.season = this.season;
    element.title = `Week ${this.weekIndex + 1}`;

    makeAccessible(
      element,
      this.handleClick,
      `Week ${this.weekIndex + 1} of ${this.season}`
    );

    return element;
  };

  /**
   * Handle click event
   */
  private handleClick = (): void => {
    if (this.onClickCallback) {
      this.onClickCallback(this.weekIndex);
    }
  };

  /**
   * Set position of the week element
   */
  setPosition = (x: number, y: number): void => {
    // Center the element at the given position (element is 12px × 12px)
    this.element.style.left = `${x - 6}px`;
    this.element.style.top = `${y - 6}px`;
  };

  /**
   * Update season
   */
  setSeason = (season: Season): void => {
    this.season = season;
    this.element.dataset.season = season;
  };

  /**
   * Update events for this week
   */
  setEvents = (events: CalendarEvent[]): void => {
    this.events = events;
    this.updateVisualState();
  };

  /**
   * Update visual state based on events
   */
  private updateVisualState = (): void => {
    const hasEvents = this.events.length > 0;

    if (hasEvents) {
      this.element.classList.remove('bg-transparent', 'border-dark-border');
      this.element.classList.add('bg-primary-500', 'border-primary-500');
    } else {
      this.element.classList.remove('bg-primary-500', 'border-primary-500');
      this.element.classList.add('bg-transparent', 'border-dark-border');
    }

    // Update title with event count
    const eventCount = this.events.length;
    this.element.title = 
      eventCount > 0
        ? `Week ${this.weekIndex + 1} - ${eventCount} event${eventCount > 1 ? 's' : ''}`
        : `Week ${this.weekIndex + 1}`;
  };

  /**
   * Set click callback
   */
  onClick = (callback: (weekIndex: number) => void): void => {
    this.onClickCallback = callback;
  };

  /**
   * Get the DOM element
   */
  getElement = (): HTMLDivElement => {
    return this.element;
  };

  /**
   * Get week index
   */
  getWeekIndex = (): number => {
    return this.weekIndex;
  };

  /**
   * Get season
   */
  getSeason = (): Season => {
    return this.season;
  };

  /**
   * Get events
   */
  getEvents = (): CalendarEvent[] => {
    return this.events;
  };
}

