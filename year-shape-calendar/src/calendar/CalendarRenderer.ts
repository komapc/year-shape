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
  private seasonLabels: HTMLElement[] = [];
  private currentWeekIndicator: HTMLElement | null = null;
  private centerInfo: HTMLElement | null = null;
  private direction: Direction = -1;
  private seasons: Season[] = [...CALENDAR_CONFIG.defaultSeasons]; // Always: winter, spring, summer, autumn
  private cornerRadius: number = 0.5; // 0 = square, 1 = circle
  private rotationOffset: number = 0; // 0, 90, 180, or 270 degrees
  private eventsByWeek: Record<number, CalendarEvent[]> = {};
  private timeUpdateInterval: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeWeeks();
    this.initializeMonthLabels();
    this.initializeSeasonLabels();
    this.initializeCurrentWeekIndicator();
    this.initializeCenterInfo();
    this.startTimeUpdates();
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
   * Initialize season labels
   */
  private initializeSeasonLabels = (): void => {
    const seasonNames = ['Winter', 'Spring', 'Summer', 'Autumn'];
    
    seasonNames.forEach((seasonName, index) => {
      const label = createElement('div', [
        'season-label-dynamic',
        'absolute',
        'text-sm',
        'font-medium',
        'pointer-events-none',
        'transition-all',
        'duration-300',
      ]);
      label.textContent = seasonName;
      label.style.color = 'rgba(255, 255, 255, 0.6)';
      label.setAttribute('data-season-index', String(index));
      
      this.seasonLabels.push(label);
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
    
    // Longer arrow pointing TOWARD the week (outward from center)
    indicator.innerHTML = `
      <svg width="40" height="60" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 55 L20 10 L16 14 M20 10 L24 14" 
              stroke="#60a5fa" 
              stroke-width="2.5" 
              stroke-linecap="round" 
              stroke-linejoin="round"/>
      </svg>
    `;
    
    this.currentWeekIndicator = indicator;
    this.container.appendChild(indicator);
  };

  /**
   * Initialize center info display
   */
  private initializeCenterInfo = (): void => {
    const centerInfo = createElement('div', [
      'center-info',
      'absolute',
      'pointer-events-none',
      'transition-all',
      'duration-300',
      'text-center',
    ]);
    
    centerInfo.style.cssText = `
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: rgba(255, 255, 255, 0.8);
      font-size: 13px;
      line-height: 1.6;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    `;
    
    this.centerInfo = centerInfo;
    this.container.appendChild(centerInfo);
    this.updateCenterInfo();
  };

  /**
   * Start time updates
   */
  private startTimeUpdates = (): void => {
    // Update every second
    this.timeUpdateInterval = window.setInterval(() => {
      this.updateCenterInfo();
    }, 1000);
  };

  /**
   * Stop time updates
   */
  private stopTimeUpdates = (): void => {
    if (this.timeUpdateInterval !== null) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  };

  /**
   * Update center info display
   */
  private updateCenterInfo = (): void => {
    if (!this.centerInfo) return;
    
    const now = new Date();
    
    // Format date: "Nov 7"
    const dateStr = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Format time: "14:35:22"
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Get week number
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - startOfYear.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.floor(diff / oneWeek);
    
    // Count today's events
    const todayEvents = this.getTodayEventCount();
    
    // Build HTML
    this.centerInfo.innerHTML = `
      <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">${dateStr}</div>
      <div style="font-size: 16px; font-weight: 700; color: #60a5fa; margin-bottom: 4px;">${timeStr}</div>
      <div style="font-size: 12px; opacity: 0.9;">Week ${weekNumber + 1}</div>
      <div style="font-size: 12px; margin-top: 4px; color: ${todayEvents > 0 ? '#34d399' : 'rgba(255, 255, 255, 0.6)'};">
        ${todayEvents} event${todayEvents !== 1 ? 's' : ''} today
      </div>
    `;
  };

  /**
   * Get count of events for today
   */
  private getTodayEventCount = (): number => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let count = 0;
    
    Object.values(this.eventsByWeek).forEach(weekEvents => {
      weekEvents.forEach(event => {
        if (!event.start) return;
        const eventDate = new Date(event.start);
        if (eventDate >= today && eventDate < tomorrow) {
          count++;
        }
      });
    });
    
    return count;
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

    const startAngleRad = degreesToRadians(CALENDAR_CONFIG.startAngle + this.rotationOffset);

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
    
    // Layout season labels
    this.layoutSeasonLabels(centerX, centerY, radius, startAngleRad);
    
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
      // Normalize angle to 0-360 range
      let angleDeg = ((angle * 180 / Math.PI) % 360);
      if (angleDeg < 0) angleDeg += 360;
      
      // Determine orientation based on actual position
      // With startAngle = -90°:
      // Top: ~270° (225-315°), Right: ~0°/360° (315-45°), Bottom: ~90° (45-135°), Left: ~180° (135-225°)
      const isRight = angleDeg >= 315 || angleDeg <= 45;
      const isLeft = angleDeg >= 135 && angleDeg <= 225;
      // Top/Bottom (remaining angles): horizontal
      
      // Apply color from palette
      label.style.color = colors[monthIndex];
      
      if (isLeft) {
        // Left side: vertical, rotated 180° (reading bottom to top)
        label.style.writingMode = 'vertical-rl';
        label.style.left = `${position.x}px`;
        label.style.top = `${position.y}px`;
        label.style.transform = 'translate(-100%, -50%) rotate(180deg)';
      } else if (isRight) {
        // Right side: vertical, normal (reading top to bottom)
        label.style.writingMode = 'vertical-rl';
        label.style.left = `${position.x}px`;
        label.style.top = `${position.y}px`;
        label.style.transform = 'translate(0%, -50%)';
      } else {
        // Top and bottom: horizontal
        label.style.writingMode = 'horizontal-tb';
        label.style.left = `${position.x}px`;
        label.style.top = `${position.y}px`;
        label.style.transform = 'translate(-50%, -50%)';
      }
    });
  };

  /**
   * Layout season labels around the shape
   */
  private layoutSeasonLabels = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngleRad: number
  ): void => {
    // Position season labels at the CENTER of each side (not quadrant midpoints)
    // Positions: Top (0°), Right (90°), Bottom (180°), Left (270°)
    this.seasons.forEach((season, seasonIndex) => {
      const label = this.seasonLabels[seasonIndex];
      if (!label) return;
      
      // Update label text to match current season order
      const seasonNames: Record<Season, string> = {
        winter: 'Winter',
        spring: 'Spring',
        summer: 'Summer',
        autumn: 'Autumn',
      };
      label.textContent = seasonNames[season];
      
      // Position at exact sides: 0°, 90°, 180°, 270° (0, 0.25, 0.5, 0.75 of full circle)
      const progress = seasonIndex * 0.25;
      const angle = startAngleRad + this.direction * progress * Math.PI * 2;
      
      // Position labels further out than months
      const labelRadius = radius * 1.45;
      const position = calculatePositionOnPath(centerX, centerY, labelRadius, angle, this.cornerRadius);
      
      // Calculate angle in degrees for positioning logic
      // Normalize angle to 0-360 range
      let angleDeg = ((angle * 180 / Math.PI) % 360);
      if (angleDeg < 0) angleDeg += 360;
      
      // Determine orientation based on actual position
      // With startAngle = -90°:
      // Top: ~270° (225-315°), Right: ~0°/360° (315-45°), Bottom: ~90° (45-135°), Left: ~180° (135-225°)
      const isRight = angleDeg >= 315 || angleDeg <= 45;
      const isLeft = angleDeg >= 135 && angleDeg <= 225;
      // Top/Bottom (remaining angles): horizontal
      
      if (isLeft) {
        // Left side: vertical, rotated 180° (reading bottom to top)
        label.style.writingMode = 'vertical-rl';
        label.style.left = `${position.x}px`;
        label.style.top = `${position.y}px`;
        label.style.transform = 'translate(-100%, -50%) rotate(180deg)';
      } else if (isRight) {
        // Right side: vertical, normal (reading top to bottom)
        label.style.writingMode = 'vertical-rl';
        label.style.left = `${position.x}px`;
        label.style.top = `${position.y}px`;
        label.style.transform = 'translate(0%, -50%)';
      } else {
        // Top and bottom: horizontal
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
    
    // Position arrow closer to center, pointing OUTWARD toward the week
    const indicatorRadius = radius * 0.35; // Start from closer to center
    const position = calculatePositionOnPath(centerX, centerY, indicatorRadius, angle, this.cornerRadius);
    
    // Calculate rotation to point OUTWARD toward the week
    // SVG arrow points upward by default, so we need:
    // 1. Add 90 to convert from standard angle (0° = right) to SVG rotation (0° = up)
    // 2. Subtract 180 to flip direction (point outward instead of inward)
    const rotationAngle = (angle * 180 / Math.PI) + 90 - 180;
    
    this.currentWeekIndicator.style.left = `${position.x}px`;
    this.currentWeekIndicator.style.top = `${position.y}px`;
    this.currentWeekIndicator.style.transform = `translate(-50%, -50%) rotate(${rotationAngle}deg)`;
    this.currentWeekIndicator.style.opacity = '0.8';
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
   * Shift entire calendar clockwise by 90 degrees
   * Rotates months, weeks, seasons, and indicators together
   */
  shiftSeasons = (): void => {
    // Increment rotation by 90 degrees (clockwise)
    this.rotationOffset = (this.rotationOffset + 90) % 360;
    
    // Re-layout everything with new rotation
    this.layoutWeeks();
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
    // Store events data for today's event count
    this.eventsByWeek = eventsByWeek;
    
    this.weeks.forEach((week) => {
      const weekIndex = week.getWeekIndex();
      const events = eventsByWeek[weekIndex] || [];
      week.setEvents(events);
    });
    
    // Update center info to reflect new event count
    this.updateCenterInfo();
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

  /**
   * Cleanup method to stop timers
   */
  destroy = (): void => {
    this.stopTimeUpdates();
  };
}

