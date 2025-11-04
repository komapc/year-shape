/**
 * Calendar renderer class for managing the visual layout
 */

import type { Direction, Season, CalendarEvent } from '../types';
import { CALENDAR_CONFIG } from '../utils/constants';
import { calculatePositionOnPath, degreesToRadians } from '../utils/math';
import { getMonthNamesShort, getMonthStartWeek } from '../utils/date';
import { createElement } from '../utils/dom';
import { WeekElement } from './WeekElement';

export class CalendarRenderer {
  private container: HTMLElement;
  private weeks: WeekElement[] = [];
  private monthLabels: HTMLElement[] = [];
  private direction: Direction = -1;
  private seasons: Season[] = [...CALENDAR_CONFIG.defaultSeasons];
  private cornerRadius: number = 0.5; // 0 = square, 1 = circle

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeWeeks();
    this.initializeMonthLabels();
  }

  /**
   * Initialize week elements
   */
  private initializeWeeks = (): void => {
    // Clear existing weeks (but not month labels)
    const existingWeeks = this.container.querySelectorAll('.week');
    existingWeeks.forEach(el => el.remove());
    this.weeks = [];

    // Create week elements
    for (let i = 0; i < CALENDAR_CONFIG.totalWeeks; i++) {
      const seasonIndex = Math.floor((i / CALENDAR_CONFIG.totalWeeks) * 4);
      const season = this.seasons[seasonIndex % 4];
      const week = new WeekElement(i, season);
      
      this.weeks.push(week);
      this.container.appendChild(week.getElement());
    }
  };

  /**
   * Initialize month labels
   */
  private initializeMonthLabels = (): void => {
    const months = getMonthNamesShort();
    
    months.forEach((monthName) => {
      const label = createElement('div', [
        'month-label',
        'absolute',
        'text-xs',
        'font-medium',
        'pointer-events-none',
        'transition-all',
        'duration-300',
      ]);
      label.textContent = monthName;
      label.style.color = 'rgba(255, 255, 255, 0.4)';
      
      this.monthLabels.push(label);
      this.container.appendChild(label);
    });
  };

  /**
   * Layout weeks around the shape
   */
  layoutWeeks = (): void => {
    const rect = this.container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) * 0.85;

    const startAngleRad = degreesToRadians(CALENDAR_CONFIG.startAngle);

    // Layout weeks
    this.weeks.forEach((week, index) => {
      const progress = index / CALENDAR_CONFIG.totalWeeks;
      const angle = startAngleRad + this.direction * progress * Math.PI * 2;
      
      const position = calculatePositionOnPath(centerX, centerY, radius, angle, this.cornerRadius);
      
      week.setPosition(position.x, position.y);
      
      // Update season
      const seasonIndex = Math.floor(progress * 4);
      const season = this.seasons[seasonIndex % 4];
      week.setSeason(season);
    });

    // Layout month labels
    this.layoutMonthLabels(centerX, centerY, radius, startAngleRad);
  };

  /**
   * Layout month labels around the shape
   */
  private layoutMonthLabels = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngleRad: number
  ): void => {
    this.monthLabels.forEach((label, monthIndex) => {
      const weekIndex = getMonthStartWeek(monthIndex);
      const progress = weekIndex / CALENDAR_CONFIG.totalWeeks;
      const angle = startAngleRad + this.direction * progress * Math.PI * 2;
      
      // Position labels slightly outside the circle/square
      const labelRadius = radius * 1.15;
      const position = calculatePositionOnPath(centerX, centerY, labelRadius, angle, this.cornerRadius);
      
      // Center the label
      label.style.left = `${position.x}px`;
      label.style.top = `${position.y}px`;
      label.style.transform = 'translate(-50%, -50%)';
    });
  };

  /**
   * Set corner radius (0 = square, 1 = circle)
   */
  setCornerRadius = (radius: number): void => {
    // Map slider value directly: 0-50 → 0-1
    this.cornerRadius = Math.max(0, Math.min(1, radius / 50));
    this.layoutWeeks();
  };

  /**
   * Set direction (clockwise or counter-clockwise)
   */
  setDirection = (direction: Direction): void => {
    this.direction = direction;
    this.layoutWeeks();
  };

  /**
   * Get current direction
   */
  getDirection = (): Direction => {
    return this.direction;
  };

  /**
   * Toggle direction
   */
  toggleDirection = (): Direction => {
    this.direction = this.direction === 1 ? -1 : 1;
    this.layoutWeeks();
    return this.direction;
  };

  /**
   * Swap two seasons
   */
  swapSeasons = (season1: Season, season2: Season): void => {
    const index1 = this.seasons.indexOf(season1);
    const index2 = this.seasons.indexOf(season2);
    
    if (index1 !== -1 && index2 !== -1) {
      [this.seasons[index1], this.seasons[index2]] = 
        [this.seasons[index2], this.seasons[index1]];
      
      this.layoutWeeks();
    }
  };

  /**
   * Get current seasons order
   */
  getSeasons = (): Season[] => {
    return [...this.seasons];
  };

  /**
   * Update events for weeks
   */
  updateEvents = (eventsByWeek: Record<number, CalendarEvent[]>): void => {
    this.weeks.forEach((week) => {
      const weekIndex = week.getWeekIndex();
      const events = eventsByWeek[weekIndex] || [];
      week.setEvents(events);
    });
  };

  /**
   * Set click handler for all weeks
   */
  onWeekClick = (callback: (weekIndex: number) => void): void => {
    this.weeks.forEach((week) => {
      week.onClick(callback);
    });
  };

  /**
   * Get a specific week
   */
  getWeek = (weekIndex: number): WeekElement | undefined => {
    return this.weeks[weekIndex];
  };

  /**
   * Get all weeks
   */
  getAllWeeks = (): WeekElement[] => {
    return this.weeks;
  };
}

