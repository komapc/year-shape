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
  private currentWeekIndicator: HTMLElement | null = null;
  private direction: Direction = -1;
  private seasons: Season[] = [...CALENDAR_CONFIG.defaultSeasons];
  private cornerRadius: number = 0.5; // 0 = square, 1 = circle

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeWeeks();
    this.initializeMonthLabels();
    this.initializeCurrentWeekIndicator();
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
   * Initialize current week indicator
   */
  private initializeCurrentWeekIndicator = (): void => {
    const indicator = createElement('div', [
      'current-week-indicator',
      'absolute',
      'pointer-events-none',
      'transition-all',
      'duration-300',
    ]);
    
    // Simple triangle arrow pointing inward
    indicator.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2 L8 10 L5 7 M8 10 L11 7" 
              stroke="#60a5fa" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"/>
      </svg>
    `;
    
    this.currentWeekIndicator = indicator;
    this.container.appendChild(indicator);
  };

  /**
   * Layout weeks around the shape
   */
  layoutWeeks = (): void => {
    const rect = this.container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Adjust radius to keep weeks inside the shape border
    // Smaller radius so weeks fit comfortably within the visible shape
    const baseRadius = Math.min(centerX, centerY);
    const radiusScale = 0.65 + (this.cornerRadius * 0.10); // 0.65-0.75 (tighter fit)
    const radius = baseRadius * radiusScale;

    const startAngleRad = degreesToRadians(CALENDAR_CONFIG.startAngle);

    // Season colors for week highlights
    const seasonColors = [
      'rgba(59, 130, 246, 0.15)',   // Winter - blue
      'rgba(34, 197, 94, 0.15)',     // Spring - green
      'rgba(251, 146, 60, 0.15)',    // Summer - orange
      'rgba(168, 85, 247, 0.15)',    // Autumn - purple
    ];
    
    // Layout weeks
    this.weeks.forEach((week, index) => {
      const progress = index / CALENDAR_CONFIG.totalWeeks;
      const angle = startAngleRad + this.direction * progress * Math.PI * 2;
      
      const position = calculatePositionOnPath(centerX, centerY, radius, angle, this.cornerRadius);
      
      week.setPosition(position.x, position.y);
      
      // Update season and apply color
      const seasonIndex = Math.floor(progress * 4);
      const season = this.seasons[seasonIndex % 4];
      week.setSeason(season);
      week.setSeasonColor(seasonColors[seasonIndex % 4]);
    });

    // Layout month labels
    this.layoutMonthLabels(centerX, centerY, radius, startAngleRad);
    
    // Layout current week indicator
    this.layoutCurrentWeekIndicator(centerX, centerY, radius, startAngleRad);
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
    const colors = [
      '#60a5fa', '#93c5fd', '#3b82f6', // Winter: shades of blue
      '#4ade80', '#86efac', '#22c55e', // Spring: shades of green
      '#fb923c', '#fdba74', '#f97316', // Summer: shades of orange
      '#c084fc', '#e9d5ff', '#a855f7', // Autumn: shades of purple
    ];
    
    this.monthLabels.forEach((label, monthIndex) => {
      const weekIndex = getMonthStartWeek(monthIndex);
      const progress = weekIndex / CALENDAR_CONFIG.totalWeeks;
      const angle = startAngleRad + this.direction * progress * Math.PI * 2;
      
      // Position labels closer to the weeks
      const labelRadius = radius * 1.18; // Closer to weeks for better readability
      const position = calculatePositionOnPath(centerX, centerY, labelRadius, angle, this.cornerRadius);
      
      // Calculate angle in degrees for positioning logic
      const angleDeg = ((angle * 180 / Math.PI) + 360) % 360;
      
      // Determine if label should be vertical based on position
      // Left side: 135° to 225°, Right side: -45° to 45° (315° to 45°)
      const isLeftSide = angleDeg > 135 && angleDeg < 225;
      const isRightSide = angleDeg < 45 || angleDeg > 315;
      
      // Apply color from palette
      label.style.color = colors[monthIndex];
      
      if (isLeftSide) {
        // Vertical, rotated 180° (reading bottom to top)
        label.style.writingMode = 'vertical-rl';
        label.style.left = `${position.x}px`;
        label.style.top = `${position.y}px`;
        label.style.transform = 'translate(-100%, -50%) rotate(180deg)';
      } else if (isRightSide) {
        // Vertical, normal (reading top to bottom)
        label.style.writingMode = 'vertical-rl';
        label.style.left = `${position.x}px`;
        label.style.top = `${position.y}px`;
        label.style.transform = 'translate(0%, -50%)';
      } else {
        // Horizontal
        label.style.writingMode = 'horizontal-tb';
        label.style.left = `${position.x}px`;
        label.style.top = `${position.y}px`;
        label.style.transform = 'translate(-50%, -50%)';
      }
    });
  };

  /**
   * Layout current week indicator
   */
  private layoutCurrentWeekIndicator = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngleRad: number
  ): void => {
    if (!this.currentWeekIndicator) return;
    
    // Calculate current week number (0-51)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - startOfYear.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const currentWeek = Math.floor(diff / oneWeek);
    
    // Position indicator at current week
    const progress = currentWeek / CALENDAR_CONFIG.totalWeeks;
    const angle = startAngleRad + this.direction * progress * Math.PI * 2;
    
    // Position indicator just outside the week markers
    const indicatorRadius = radius * 1.12; // Adjusted for smaller weeks circle
    const position = calculatePositionOnPath(centerX, centerY, indicatorRadius, angle, this.cornerRadius);
    
    // Calculate rotation to point toward center
    const rotationAngle = (angle * 180 / Math.PI) + 90;
    
    this.currentWeekIndicator.style.left = `${position.x}px`;
    this.currentWeekIndicator.style.top = `${position.y}px`;
    this.currentWeekIndicator.style.transform = `translate(-50%, -50%) rotate(${rotationAngle}deg)`;
    this.currentWeekIndicator.style.opacity = '0.7';
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
  onWeekClick = (callback: (weekIndex: number, event?: MouseEvent) => void): void => {
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

