/**
 * Week element class for managing individual week visualizations
 */

import type { Season, CalendarEvent } from '../types';
import { createElement, makeAccessible } from '../utils/dom';
import { getWeekStartDate } from '../utils/date';
import { calculateMoonPhase, getMoonEmoji, getMoonPhaseName, getWeekZodiacSigns } from '../utils/astronomy';
import { loadSettings } from '../utils/settings';

export class WeekElement {
  private element: HTMLDivElement;
  private weekIndex: number;
  private season: Season;
  private events: CalendarEvent[] = [];
  private onClickCallback?: (weekIndex: number, event?: MouseEvent) => void;
  private tooltipElement: HTMLDivElement | null = null;

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
      'w-2',
      'h-2',
      'rounded-sm',
      'transition-all',
      'duration-300',
      'cursor-pointer',
      'border',
      'border-dark-border',
      'bg-transparent',
      'hover:scale-[2.5]',
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

    // Add hover handlers for tooltip
    element.addEventListener('mouseenter', this.handleMouseEnter);
    element.addEventListener('mouseleave', this.handleMouseLeave);

    return element;
  };

  /**
   * Handle mouse enter - show tooltip
   */
  private handleMouseEnter = (): void => {
    const settings = loadSettings();
    if (!settings.showMoonPhase && !settings.showZodiac) return;

    const startDate = getWeekStartDate(this.weekIndex);
    
    // Build tooltip content
    let content = `<div class="font-semibold mb-1">Week ${this.weekIndex + 1}</div>`;
    
    if (settings.showMoonPhase) {
      const phase = calculateMoonPhase(startDate);
      const moonEmoji = getMoonEmoji(phase);
      const moonName = getMoonPhaseName(phase);
      content += `<div class="flex items-center gap-2"><span class="text-2xl">${moonEmoji}</span><span>${moonName}</span></div>`;
    }
    
    if (settings.showZodiac) {
      const zodiacs = getWeekZodiacSigns(startDate);
      const zodiacText = zodiacs.map(z => `${z.emoji} ${z.name}`).join(', ');
      content += `<div class="mt-1 text-sm">${zodiacText}</div>`;
    }

    this.showTooltip(content);
  };

  /**
   * Handle mouse leave - hide tooltip
   */
  private handleMouseLeave = (): void => {
    this.hideTooltip();
  };

  /**
   * Show tooltip with content
   */
  private showTooltip = (content: string): void => {
    // Remove existing tooltip
    this.hideTooltip();

    // Create new tooltip
    this.tooltipElement = createElement('div', [
      'absolute',
      'z-50',
      'px-3',
      'py-2',
      'text-sm',
      'bg-dark-card',
      'border',
      'border-primary-500/50',
      'rounded-lg',
      'shadow-xl',
      'pointer-events-none',
      'whitespace-nowrap',
    ]);

    this.tooltipElement.innerHTML = content;
    
    // Position tooltip above the week element
    const rect = this.element.getBoundingClientRect();
    const parent = this.element.offsetParent as HTMLElement;
    const parentRect = parent.getBoundingClientRect();
    
    this.tooltipElement.style.left = `${rect.left - parentRect.left + rect.width / 2}px`;
    this.tooltipElement.style.top = `${rect.top - parentRect.top - 10}px`;
    this.tooltipElement.style.transform = 'translate(-50%, -100%)';
    
    parent.appendChild(this.tooltipElement);
  };

  /**
   * Hide tooltip
   */
  private hideTooltip = (): void => {
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
      this.tooltipElement = null;
    }
  };

  /**
   * Handle click event
   */
  private handleClick = (event?: Event): void => {
    if (this.onClickCallback) {
      this.onClickCallback(this.weekIndex, event as MouseEvent);
    }
  };

  /**
   * Set position of the week element
   */
  setPosition = (x: number, y: number): void => {
    // Center the element at the given position (element is 8px × 8px)
    this.element.style.left = `${x - 4}px`;
    this.element.style.top = `${y - 4}px`;
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
      this.element.style.boxShadow = '0 0 8px rgba(59, 130, 246, 0.5)';
    } else {
      this.element.classList.remove('bg-primary-500', 'border-primary-500');
      this.element.classList.add('bg-transparent', 'border-dark-border');
      this.element.style.boxShadow = 'none';
      // Season color will be set separately
    }

    // Update title with event count
    const eventCount = this.events.length;
    this.element.title = 
      eventCount > 0
        ? `Week ${this.weekIndex + 1} - ${eventCount} event${eventCount > 1 ? 's' : ''}`
        : `Week ${this.weekIndex + 1}`;
  };

  /**
   * Set season background color
   */
  setSeasonColor = (color: string): void => {
    // Only apply to weeks without events
    if (this.events.length === 0) {
      this.element.style.backgroundColor = color;
    }
  };

  /**
   * Set click callback
   */
  onClick = (callback: (weekIndex: number, event?: MouseEvent) => void): void => {
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

