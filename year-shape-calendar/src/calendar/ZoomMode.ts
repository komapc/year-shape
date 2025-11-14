/**
 * Zoom Mode - Interactive calendar with nested zoom levels
 * Year → Month → Week → Day
 */

import type { CalendarEvent } from '../types';
import { createElement } from '../utils/dom';

export type ZoomLevel = 'year' | 'month' | 'week' | 'day';

interface ZoomState {
  level: ZoomLevel;
  year: number;
  month: number; // 0-11
  week: number; // 0-51
  day: number; // 1-31
}

export class ZoomMode {
  private container: HTMLElement;
  private svg!: SVGElement;
  private currentState: ZoomState;
  private eventsByYear: Record<number, Record<number, CalendarEvent[]>> = {}; // year -> month -> events
  private eventsByWeek: Record<number, CalendarEvent[]> = {}; // week -> events
  private eventsByDay: Record<string, CalendarEvent[]> = {}; // "YYYY-MM-DD" -> events
  
  // Animation state
  private animating: boolean = false;
  private animationStartTime: number = 0;
  private animationDuration: number = 1200; // ms - slower animation
  
  // Hover state
  private hoveredMonth: number | null = null;
  
  // Back button
  private backButton: HTMLButtonElement | null = null;

  constructor(container: HTMLElement, initialYear: number = new Date().getFullYear()) {
    this.container = container;
    this.currentState = {
      level: 'year',
      year: initialYear,
      month: 0,
      week: 0,
      day: 1,
    };
    
    this.initializeSVG();
    this.initializeBackButton();
    this.render();
    this.setupBrowserBackButton();
  }

  /**
   * Initialize SVG element
   */
  private initializeSVG = (): void => {
    // Clear container
    this.container.innerHTML = '';
    
    // Create SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', '0 0 700 700');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.setAttribute('shape-rendering', 'geometricPrecision'); // Smooth rendering
    this.svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: auto;
    `;
    
    // Use event delegation on SVG for clicks (works even when elements are recreated)
    this.svg.addEventListener('click', (e) => {
      let target = e.target as SVGElement;
      
      // Traverse up the DOM tree to find the element with data-month
      while (target && target !== this.svg) {
        if (target.hasAttribute && target.hasAttribute('data-month')) {
          const monthIndex = parseInt(target.getAttribute('data-month') || '0', 10);
          console.log('Month clicked (delegation):', monthIndex, target);
          e.stopPropagation();
          e.preventDefault();
          this.navigateToLevel('month', { month: monthIndex });
          return;
        }
        // Move to parent
        target = (target.parentElement || target.parentNode) as SVGElement;
      }
    }, true); // Use capture phase to catch events early
    
    this.container.appendChild(this.svg);
    
    // Style container
    this.container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 600px;
      pointer-events: auto;
    `;
  };

  /**
   * Initialize back button
   */
  private initializeBackButton = (): void => {
    this.backButton = createElement('button', [
      'btn',
      'primary',
      'absolute',
      'top-4',
      'left-4',
      'z-50',
      'hidden',
    ]) as HTMLButtonElement;
    
    this.backButton.innerHTML = '← Back';
    this.backButton.addEventListener('click', this.handleBack);
    this.backButton.setAttribute('aria-label', 'Go back');
    
    this.container.appendChild(this.backButton);
  };

  /**
   * Setup browser back button handling
   */
  private setupBrowserBackButton = (): void => {
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.zoomLevel) {
        this.navigateToLevel(e.state.zoomLevel, e.state.params || {}, false);
      }
    });
  };

  /**
   * Update events data
   */
  updateEvents = (eventsByWeek: Record<number, CalendarEvent[]>): void => {
    this.eventsByWeek = eventsByWeek;
    
    // Process events by year/month/day
    this.eventsByYear = {};
    this.eventsByDay = {};
    
    const currentYear = this.currentState.year;
    
    // Initialize year structure
    this.eventsByYear[currentYear] = {};
    for (let i = 0; i < 12; i++) {
      this.eventsByYear[currentYear][i] = [];
    }
    
    // Process events
    Object.values(eventsByWeek).forEach(weekEvents => {
      weekEvents.forEach(event => {
        if (!event.start) return;
        
        const eventDate = new Date(event.start);
        const year = eventDate.getFullYear();
        const month = eventDate.getMonth();
        const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
        
        if (year === currentYear) {
          if (!this.eventsByYear[year][month]) {
            this.eventsByYear[year][month] = [];
          }
          this.eventsByYear[year][month].push(event);
        }
        
        if (!this.eventsByDay[dayKey]) {
          this.eventsByDay[dayKey] = [];
        }
        this.eventsByDay[dayKey].push(event);
      });
    });
    
    // Sort events chronologically within each month
    Object.keys(this.eventsByYear[currentYear]).forEach(monthStr => {
      const month = parseInt(monthStr, 10);
      this.eventsByYear[currentYear][month].sort((a, b) => {
        if (!a.start || !b.start) return 0;
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });
    });
    
    this.render();
  };

  /**
   * Navigate to a zoom level
   */
  private navigateToLevel = (
    level: ZoomLevel,
    params: { month?: number; week?: number; day?: number; year?: number } = {},
    pushState: boolean = true
  ): void => {
    // Stop any ongoing animation
    if (this.animating) {
      this.animating = false;
    }
    
    const oldState = { ...this.currentState };
    
    // Update state
    this.currentState.level = level;
    if (params.year !== undefined) this.currentState.year = params.year;
    if (params.month !== undefined) this.currentState.month = params.month;
    if (params.week !== undefined) this.currentState.week = params.week;
    if (params.day !== undefined) this.currentState.day = params.day;
    
    // Update URL hash
    if (pushState) {
      this.updateURLHash();
    }
    
    // Animate transition
    this.animateTransition(oldState, this.currentState);
  };

  /**
   * Update URL hash
   */
  private updateURLHash = (): void => {
    const state = this.currentState;
    let hash = '#zoom';
    
    if (state.level === 'month') {
      hash += `/month/${state.year}/${state.month}`;
    } else if (state.level === 'week') {
      hash += `/week/${state.year}/${state.week}`;
    } else if (state.level === 'day') {
      hash += `/day/${state.year}/${state.month + 1}/${state.day}`;
    } else {
      hash += `/year/${state.year}`;
    }
    
    window.history.pushState(
      { zoomLevel: state.level, params: state },
      '',
      hash
    );
  };

  /**
   * Animate transition between levels
   */
  private animateTransition = (oldState: ZoomState, newState: ZoomState): void => {
    if (oldState.level === newState.level) {
      this.render();
      return;
    }
    
    this.animating = true;
    this.animationStartTime = Date.now();
    
    // Get old circle center
    const oldCenter = this.getCircleCenter(oldState);
    
    // Animate
    const animate = () => {
      // Check if animation was cancelled
      if (!this.animating) {
        return;
      }
      
      const elapsed = Date.now() - this.animationStartTime;
      const progress = Math.min(elapsed / this.animationDuration, 1);
      
      // Easing function (ease-in-out cubic) - smoother animation
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      this.renderTransition(oldState, newState, oldCenter, eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.animating = false;
        // Final render to ensure all event listeners are attached
        setTimeout(() => {
          this.render();
        }, 50);
      }
    };
    
    requestAnimationFrame(animate);
  };

  /**
   * Render transition animation
   */
  private renderTransition = (
    oldState: ZoomState,
    newState: ZoomState,
    oldCenter: { x: number; y: number },
    progress: number
  ): void => {
    // Clear SVG
    this.svg.innerHTML = '';
    // Always enable pointer events so clicks work during animation
    this.svg.style.pointerEvents = 'auto';
    
    // Calculate new circle center
    const newCenter = this.getCircleCenter(newState);
    
    // Interpolate center position
    const currentCenterX = oldCenter.x + (newCenter.x - oldCenter.x) * progress;
    const currentCenterY = oldCenter.y + (newCenter.y - oldCenter.y) * progress;
    
    // Interpolate scale
    const oldScale = this.getCircleScale(oldState);
    const newScale = this.getCircleScale(newState);
    const currentScale = oldScale + (newScale - oldScale) * progress;
    
    // Interpolate opacity
    const oldOpacity = 1 - progress;
    const newOpacity = progress;
    
    // Render old circle (fading out) - disable pointer events during fade
    if (progress < 0.8) {
      const oldCircle = this.renderCircle(oldState, oldOpacity);
      if (oldCircle) {
        const oldGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        oldGroup.setAttribute('transform', `translate(${oldCenter.x}, ${oldCenter.y}) scale(${oldScale * (1 + progress * 2)})`);
        oldGroup.style.pointerEvents = 'none'; // Disable clicks on old circle
        oldGroup.appendChild(oldCircle);
        this.svg.appendChild(oldGroup);
      }
    }
    
    // Render new circle (fading in) - always enable pointer events for clicks
    if (progress > 0.2) {
      const newCircle = this.renderCircle(newState, newOpacity);
      if (newCircle) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('transform', `translate(${currentCenterX}, ${currentCenterY}) scale(${currentScale})`);
        group.style.pointerEvents = 'auto'; // Always enable clicks
        group.appendChild(newCircle);
        this.svg.appendChild(group);
      }
    }
    
    // When animation completes, do a final render to ensure all events are attached
    if (progress >= 1) {
      // Small delay to ensure animation frame completes
      setTimeout(() => {
        this.animating = false;
        this.render();
      }, 10);
    }
  };

  /**
   * Get circle center for a state
   */
  private getCircleCenter = (state: ZoomState): { x: number; y: number } => {
    const centerX = 350;
    const centerY = 350;
    
    if (state.level === 'year') {
      return { x: centerX, y: centerY };
    } else if (state.level === 'month') {
      // Month circle center is the month position on year circle
      const angle = (state.month / 12) * Math.PI * 2 - Math.PI / 2;
      const radius = 150;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    } else {
      // Week and day are centered
      return { x: centerX, y: centerY };
    }
  };

  /**
   * Get circle scale for a state
   */
  private getCircleScale = (state: ZoomState): number => {
    if (state.level === 'year') return 1;
    if (state.level === 'month') return 0.8;
    if (state.level === 'week') return 0.9;
    return 0.95;
  };

  /**
   * Render circle for a state
   */
  private renderCircle = (state: ZoomState, opacity: number = 1): SVGElement | null => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('opacity', String(opacity));
    
    if (state.level === 'year') {
      return this.renderYearCircle(group, state);
    } else if (state.level === 'month') {
      return this.renderMonthCircle(group, state);
    } else if (state.level === 'week') {
      return this.renderWeekCircle(group, state);
    } else if (state.level === 'day') {
      return this.renderDayCircle(group, state);
    }
    
    return null;
  };

  /**
   * Render year circle (12 months)
   */
  private renderYearCircle = (group: SVGElement, state: ZoomState): SVGElement => {
    const centerX = 0;
    const centerY = 0;
    const radius = 250;
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    
    // Get current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const isCurrentYear = state.year === currentYear;
    
    // Draw months
    months.forEach((monthName, index) => {
      const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
      const startAngle = angle - (Math.PI / 12);
      const endAngle = angle + (Math.PI / 12);
      
      // Check if this is the current month
      const isCurrent = isCurrentYear && index === currentMonth;
      
      // Calculate scale based on hover
      let scale = 1;
      if (this.hoveredMonth === index) {
        scale = 1.5;
      } else if (this.hoveredMonth !== null) {
        const hoverDist = Math.min(
          Math.abs(index - this.hoveredMonth),
          Math.abs(index - this.hoveredMonth + 12),
          Math.abs(index - this.hoveredMonth - 12)
        );
        if (hoverDist === 1) {
          scale = 1.1;
        }
      }
      
      // Draw sector - highlight current month
      const baseColor = isCurrent 
        ? `hsl(${(index * 30) % 360}, 80%, 50%)` // Brighter for current
        : `hsl(${(index * 30) % 360}, 70%, 60%)`;
      const sector = this.createSector(
        centerX,
        centerY,
        radius * 0.7,
        radius * scale,
        startAngle,
        endAngle,
        baseColor
      );
      
      sector.setAttribute('class', 'month-sector');
      sector.setAttribute('data-month', String(index));
      sector.setAttribute('data-test', 'month-' + index); // For debugging
      if (isCurrent) {
        sector.setAttribute('data-current', 'true');
        // Add glow effect for current month
        sector.setAttribute('stroke', 'rgba(255, 255, 255, 0.6)');
        sector.setAttribute('stroke-width', '2');
      }
      sector.style.cursor = 'pointer';
      sector.style.transition = 'all 0.3s ease';
      sector.style.pointerEvents = 'auto';
      // Ensure the path itself can receive clicks
      (sector as any).setAttribute('pointer-events', 'all');
      
      // Store month index for event handlers
      const monthIndex = index;
      
      // Hover handlers - delay render to allow clicks to fire first
      let hoverTimeout: number | null = null;
      sector.addEventListener('mouseenter', () => {
        if (hoverTimeout) {
          cancelAnimationFrame(hoverTimeout);
        }
        this.hoveredMonth = monthIndex;
        // Delay render significantly to allow click to fire first
        hoverTimeout = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (this.currentState.level === 'year' && !this.animating) {
              this.render();
            }
          });
        });
      });
      sector.addEventListener('mouseleave', () => {
        if (hoverTimeout) {
          cancelAnimationFrame(hoverTimeout);
        }
        this.hoveredMonth = null;
        // Use requestAnimationFrame to debounce renders
        hoverTimeout = requestAnimationFrame(() => {
          if (this.currentState.level === 'year' && !this.animating) {
            this.render();
          }
        });
      });
      
      // Direct click handler - this should work regardless of delegation
      sector.addEventListener('click', (e) => {
        console.log('Month clicked (direct):', monthIndex, e);
        // Cancel any pending hover updates
        if (hoverTimeout) {
          cancelAnimationFrame(hoverTimeout);
        }
        // Navigate immediately - don't wait
        e.stopPropagation();
        e.preventDefault();
        this.navigateToLevel('month', { month: monthIndex });
      }, true); // Use capture phase to fire early
      
      group.appendChild(sector);
      
      // Draw month label
      const labelAngle = angle;
      const labelRadius = radius * 0.85;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(labelX));
      label.setAttribute('y', String(labelY));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('class', 'month-label');
      label.textContent = monthName;
      label.style.fontSize = isCurrent ? '18px' : '16px';
      label.style.fontWeight = isCurrent ? 'bold' : 'bold';
      label.style.fill = isCurrent ? '#fff' : '#fff';
      label.style.textShadow = isCurrent ? '0 0 8px rgba(255, 255, 255, 0.8)' : 'none';
      label.style.pointerEvents = 'none';
      
      group.appendChild(label);
    });
    
    // Draw center year
    const yearText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yearText.setAttribute('x', String(centerX));
    yearText.setAttribute('y', String(centerY));
    yearText.setAttribute('text-anchor', 'middle');
    yearText.setAttribute('dominant-baseline', 'middle');
    yearText.setAttribute('class', 'year-text');
    yearText.textContent = String(state.year);
    yearText.style.fontSize = '48px';
    yearText.style.fontWeight = 'bold';
    yearText.style.fill = '#fff';
    
    group.appendChild(yearText);
    
    return group;
  };

  /**
   * Render month circle (days 1-31)
   */
  private renderMonthCircle = (group: SVGElement, state: ZoomState): SVGElement => {
    const centerX = 0;
    const centerY = 0;
    const radius = 250;
    
    const month = state.month;
    const year = state.year;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get month events (first 4)
    const monthEvents = (this.eventsByYear[year]?.[month] || []).slice(0, 4);
    
    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const isCurrentMonth = year === currentYear && month === currentMonth;
    
    // Draw days
    for (let day = 1; day <= daysInMonth; day++) {
      const angle = ((day - 1) / daysInMonth) * Math.PI * 2 - Math.PI / 2;
      const dayAngle = (day / daysInMonth) * Math.PI * 2 - Math.PI / 2;
      const startAngle = angle - (Math.PI / daysInMonth);
      const endAngle = angle + (Math.PI / daysInMonth);
      
      // Check if Sunday
      const dayDate = new Date(year, month, day);
      const isSunday = dayDate.getDay() === 0;
      
      // Check if current day
      const isCurrent = isCurrentMonth && day === currentDay;
      
      // Draw day sector - highlight current day
      let fillColor = 'rgba(255, 255, 255, 0.1)';
      if (isCurrent) {
        fillColor = 'rgba(100, 200, 255, 0.5)'; // Highlight current day
      } else if (isSunday) {
        fillColor = 'rgba(255, 100, 100, 0.3)';
      }
      
      const sector = this.createSector(
        centerX,
        centerY,
        radius * 0.7,
        radius,
        startAngle,
        endAngle,
        fillColor
      );
      
      sector.setAttribute('class', 'day-sector');
      sector.setAttribute('data-day', String(day));
      if (isCurrent) {
        sector.setAttribute('data-current', 'true');
        sector.setAttribute('stroke', 'rgba(100, 200, 255, 0.8)');
        sector.setAttribute('stroke-width', '2');
      }
      sector.style.cursor = 'pointer';
      
      // Click handler - zoom to week or day based on wheel
      let wheelDelta = 0;
      sector.addEventListener('wheel', (e) => {
        e.preventDefault();
        wheelDelta += Math.abs(e.deltaY);
        
        if (wheelDelta >= 3) {
          // Big zoom - go to day
          this.navigateToLevel('day', { day });
          wheelDelta = 0;
        } else if (wheelDelta >= 1) {
          // Slight zoom - go to week
          const week = this.getWeekForDay(year, month, day);
          this.navigateToLevel('week', { week });
          wheelDelta = 0;
        }
      });
      
      sector.addEventListener('click', () => {
        // Default: go to week
        const week = this.getWeekForDay(year, month, day);
        this.navigateToLevel('week', { week });
      });
      
      group.appendChild(sector);
      
      // Draw day label
      const labelRadius = radius * 0.85;
      const labelX = centerX + Math.cos(dayAngle) * labelRadius;
      const labelY = centerY + Math.sin(dayAngle) * labelRadius;
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(labelX));
      label.setAttribute('y', String(labelY));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('class', 'day-label');
      label.textContent = String(day);
      label.style.fontSize = isCurrent ? '14px' : '12px';
      label.style.fontWeight = (isSunday || isCurrent) ? 'bold' : 'normal';
      label.style.fill = isCurrent ? '#64c8ff' : (isSunday ? '#ff6464' : '#fff');
      label.style.textShadow = isCurrent ? '0 0 6px rgba(100, 200, 255, 0.8)' : 'none';
      label.style.pointerEvents = 'none';
      
      group.appendChild(label);
    }
    
    // Draw events in center
    if (monthEvents.length > 0) {
      const eventsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      monthEvents.forEach((event, index) => {
        const eventText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        eventText.setAttribute('x', String(centerX));
        eventText.setAttribute('y', String(centerY - 60 + index * 20));
        eventText.setAttribute('text-anchor', 'middle');
        eventText.setAttribute('dominant-baseline', 'middle');
        eventText.setAttribute('class', 'event-text');
        eventText.textContent = event.summary.substring(0, 30);
        eventText.style.fontSize = '14px';
        eventText.style.fill = '#fff';
        eventText.style.pointerEvents = 'none';
        
        eventsGroup.appendChild(eventText);
      });
      group.appendChild(eventsGroup);
    }
    
    // Draw month name in center
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    monthText.setAttribute('x', String(centerX));
    monthText.setAttribute('y', String(centerY + 80));
    monthText.setAttribute('text-anchor', 'middle');
    monthText.setAttribute('dominant-baseline', 'middle');
    monthText.setAttribute('class', 'month-name-text');
    monthText.textContent = monthNames[month];
    monthText.style.fontSize = '24px';
    monthText.style.fontWeight = 'bold';
    monthText.style.fill = '#fff';
    
    group.appendChild(monthText);
    
    return group;
  };

  /**
   * Render week circle (7 days, Sunday on top)
   */
  private renderWeekCircle = (group: SVGElement, state: ZoomState): SVGElement => {
    const centerX = 0;
    const centerY = 0;
    const radius = 250;
    
    const week = state.week;
    const year = state.year;
    
    // Calculate week start date (Sunday)
    const weekStart = this.getWeekStartDate(year, week);
    
    // Get week events (first 4)
    const weekEvents = (this.eventsByWeek[week] || []).slice(0, 4);
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    
    // Draw days
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const startAngle = angle - (Math.PI / 7);
      const endAngle = angle + (Math.PI / 7);
      
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const day = dayDate.getDate();
      const dayMonth = dayDate.getMonth();
      const dayYear = dayDate.getFullYear();
      
      // Check if current day
      const isCurrent = dayYear === currentYear && dayMonth === currentMonth && day === currentDay;
      
      // Draw day sector - highlight current day
      const fillColor = isCurrent 
        ? 'rgba(100, 200, 255, 0.5)' // Highlight current day
        : 'rgba(255, 255, 255, 0.1)';
      const sector = this.createSector(
        centerX,
        centerY,
        radius * 0.7,
        radius,
        startAngle,
        endAngle,
        fillColor
      );
      
      sector.setAttribute('class', 'day-sector');
      sector.setAttribute('data-day', String(i));
      if (isCurrent) {
        sector.setAttribute('data-current', 'true');
        sector.setAttribute('stroke', 'rgba(100, 200, 255, 0.8)');
        sector.setAttribute('stroke-width', '2');
      }
      sector.style.cursor = 'pointer';
      
      // Click handler - zoom to day
      sector.addEventListener('click', () => {
        this.navigateToLevel('day', {
          month: dayDate.getMonth(),
          day: dayDate.getDate(),
        });
      });
      
      group.appendChild(sector);
      
      // Draw day label
      const labelRadius = radius * 0.85;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(labelX));
      label.setAttribute('y', String(labelY));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('class', 'day-label');
      label.textContent = `${dayNames[i]}\n${day}`;
      label.style.fontSize = isCurrent ? '16px' : '14px';
      label.style.fontWeight = 'bold';
      label.style.fill = isCurrent ? '#64c8ff' : '#fff';
      label.style.textShadow = isCurrent ? '0 0 6px rgba(100, 200, 255, 0.8)' : 'none';
      label.style.pointerEvents = 'none';
      label.style.whiteSpace = 'pre';
      
      group.appendChild(label);
    }
    
    // Draw events in center
    if (weekEvents.length > 0) {
      const eventsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      weekEvents.forEach((event, index) => {
        const eventText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        eventText.setAttribute('x', String(centerX));
        eventText.setAttribute('y', String(centerY - 60 + index * 20));
        eventText.setAttribute('text-anchor', 'middle');
        eventText.setAttribute('dominant-baseline', 'middle');
        eventText.setAttribute('class', 'event-text');
        eventText.textContent = event.summary.substring(0, 30);
        eventText.style.fontSize = '14px';
        eventText.style.fill = '#fff';
        eventText.style.pointerEvents = 'none';
        
        eventsGroup.appendChild(eventText);
      });
      group.appendChild(eventsGroup);
    }
    
    // Draw week info in center
    const weekText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    weekText.setAttribute('x', String(centerX));
    weekText.setAttribute('y', String(centerY + 80));
    weekText.setAttribute('text-anchor', 'middle');
    weekText.setAttribute('dominant-baseline', 'middle');
    weekText.setAttribute('class', 'week-text');
    weekText.textContent = `Week ${week + 1}`;
    weekText.style.fontSize = '20px';
    weekText.style.fontWeight = 'bold';
    weekText.style.fill = '#fff';
    
    group.appendChild(weekText);
    
    return group;
  };

  /**
   * Render day circle (12-hour clock)
   */
  private renderDayCircle = (group: SVGElement, state: ZoomState): SVGElement => {
    const centerX = 0;
    const centerY = 0;
    const radius = 250;
    
    const year = state.year;
    const month = state.month;
    const day = state.day;
    
    const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = (this.eventsByDay[dayKey] || []).slice(0, 4);
    
    // Get current date and time
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentHour12 = now.getHours() % 12 || 12; // Convert to 12-hour format (1-12)
    const isCurrentDay = year === currentYear && month === currentMonth && day === currentDay;
    
    // Draw hours (12-hour clock, 12 at top)
    for (let hour = 1; hour <= 12; hour++) {
      const angle = ((hour - 3) / 12) * Math.PI * 2; // 12 at top
      const startAngle = angle - (Math.PI / 12);
      const endAngle = angle + (Math.PI / 12);
      
      // Check if current hour
      const isCurrent = isCurrentDay && hour === currentHour12;
      
      // Draw hour sector - highlight current hour
      const fillColor = isCurrent 
        ? 'rgba(100, 200, 255, 0.5)' // Highlight current hour
        : 'rgba(255, 255, 255, 0.05)';
      const sector = this.createSector(
        centerX,
        centerY,
        radius * 0.7,
        radius,
        startAngle,
        endAngle,
        fillColor
      );
      
      sector.setAttribute('class', 'hour-sector');
      sector.setAttribute('data-hour', String(hour));
      if (isCurrent) {
        sector.setAttribute('data-current', 'true');
        sector.setAttribute('stroke', 'rgba(100, 200, 255, 0.8)');
        sector.setAttribute('stroke-width', '2');
      }
      sector.style.pointerEvents = 'none';
      
      group.appendChild(sector);
      
      // Draw hour label
      const labelRadius = radius * 0.85;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(labelX));
      label.setAttribute('y', String(labelY));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('class', 'hour-label');
      label.textContent = String(hour);
      label.style.fontSize = isCurrent ? '18px' : '16px';
      label.style.fontWeight = 'bold';
      label.style.fill = isCurrent ? '#64c8ff' : '#fff';
      label.style.textShadow = isCurrent ? '0 0 6px rgba(100, 200, 255, 0.8)' : 'none';
      label.style.pointerEvents = 'none';
      
      group.appendChild(label);
    }
    
    // Draw event dots
    dayEvents.forEach((event) => {
      if (!event.start) return;
      
      const eventDate = new Date(event.start);
      const hours = eventDate.getHours();
      const minutes = eventDate.getMinutes();
      
      // Convert to 12-hour format
      let hour12 = hours % 12;
      if (hour12 === 0) hour12 = 12;
      const isPM = hours >= 12;
      
      // Calculate angle (12 at top, clockwise)
      const hourAngle = ((hour12 - 3) / 12) * Math.PI * 2;
      const minuteOffset = (minutes / 60) * (Math.PI / 6);
      const angle = hourAngle + minuteOffset;
      
      // Draw dot
      const dotRadius = 6;
      const dotX = centerX + Math.cos(angle) * (radius * 0.75);
      const dotY = centerY + Math.sin(angle) * (radius * 0.75);
      
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', String(dotX));
      dot.setAttribute('cy', String(dotY));
      dot.setAttribute('r', String(dotRadius));
      dot.setAttribute('fill', isPM ? '#ff6464' : '#4a9eff');
      dot.setAttribute('class', 'event-dot');
      dot.style.cursor = 'pointer';
      
      // Tooltip
      dot.setAttribute('title', event.summary);
      
      // Click handler
      dot.addEventListener('click', () => {
        // Could show event details here
        console.log('Event clicked:', event);
      });
      
      group.appendChild(dot);
    });
    
    // Draw events list in center
    if (dayEvents.length > 0) {
      const eventsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      dayEvents.forEach((event, index) => {
        const eventText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        eventText.setAttribute('x', String(centerX));
        eventText.setAttribute('y', String(centerY - 60 + index * 20));
        eventText.setAttribute('text-anchor', 'middle');
        eventText.setAttribute('dominant-baseline', 'middle');
        eventText.setAttribute('class', 'event-text');
        eventText.textContent = event.summary.substring(0, 30);
        eventText.style.fontSize = '14px';
        eventText.style.fill = '#fff';
        eventText.style.pointerEvents = 'none';
        
        eventsGroup.appendChild(eventText);
      });
      group.appendChild(eventsGroup);
    }
    
    // Draw date in center
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dateText.setAttribute('x', String(centerX));
    dateText.setAttribute('y', String(centerY + 80));
    dateText.setAttribute('text-anchor', 'middle');
    dateText.setAttribute('dominant-baseline', 'middle');
    dateText.setAttribute('class', 'date-text');
    dateText.textContent = `${monthNames[month]} ${day}, ${year}`;
    dateText.style.fontSize = '20px';
    dateText.style.fontWeight = 'bold';
    dateText.style.fill = '#fff';
    
    group.appendChild(dateText);
    
    return group;
  };

  /**
   * Create a sector (arc segment) with smooth rendering
   */
  private createSector = (
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    fill: string
  ): SVGElement => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Use more precise arc calculation for smoother rendering
    const x1 = centerX + Math.cos(startAngle) * outerRadius;
    const y1 = centerY + Math.sin(startAngle) * outerRadius;
    const x2 = centerX + Math.cos(endAngle) * outerRadius;
    const y2 = centerY + Math.sin(endAngle) * outerRadius;
    const x3 = centerX + Math.cos(endAngle) * innerRadius;
    const y3 = centerY + Math.sin(endAngle) * innerRadius;
    const x4 = centerX + Math.cos(startAngle) * innerRadius;
    const y4 = centerY + Math.sin(startAngle) * innerRadius;
    
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    
    // Build path with smooth arcs
    const d = [
      `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A ${outerRadius.toFixed(2)} ${outerRadius.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
      `A ${innerRadius.toFixed(2)} ${innerRadius.toFixed(2)} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
      'Z',
    ].join(' ');
    
    path.setAttribute('d', d);
    path.setAttribute('fill', fill);
    path.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('shape-rendering', 'geometricPrecision'); // Smooth rendering
    path.setAttribute('vector-effect', 'non-scaling-stroke'); // Keep stroke consistent
    
    return path;
  };

  /**
   * Get week number for a day
   */
  private getWeekForDay = (year: number, month: number, day: number): number => {
    const date = new Date(year, month, day);
    const startOfYear = new Date(year, 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek);
  };

  /**
   * Get week start date (Sunday)
   */
  private getWeekStartDate = (year: number, week: number): Date => {
    const startOfYear = new Date(year, 0, 1);
    const weekStart = new Date(startOfYear);
    weekStart.setDate(weekStart.getDate() + week * 7);
    
    // Adjust to Sunday
    const dayOfWeek = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    
    return weekStart;
  };

  /**
   * Handle back button
   */
  private handleBack = (): void => {
    const state = this.currentState;
    
    if (state.level === 'day') {
      this.navigateToLevel('week', { week: state.week });
    } else if (state.level === 'week') {
      this.navigateToLevel('month', { month: state.month });
    } else if (state.level === 'month') {
      this.navigateToLevel('year', {});
    }
  };

  /**
   * Render current state
   */
  private render = (): void => {
    if (this.animating) return;
    
    // Clear SVG
    this.svg.innerHTML = '';
    
    // Render current circle
    const circle = this.renderCircle(this.currentState, 1);
    if (circle) {
      const center = this.getCircleCenter(this.currentState);
      const scale = this.getCircleScale(this.currentState);
      
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('transform', `translate(${center.x}, ${center.y}) scale(${scale})`);
      group.appendChild(circle);
      this.svg.appendChild(group);
    }
    
    // Update back button visibility
    if (this.backButton) {
      if (this.currentState.level === 'year') {
        this.backButton.classList.add('hidden');
      } else {
        this.backButton.classList.remove('hidden');
      }
    }
  };

  /**
   * Set year
   */
  setYear = (year: number): void => {
    this.currentState.year = year;
    this.updateEvents(this.eventsByWeek); // Reprocess events
    this.render();
  };

  /**
   * Destroy and cleanup
   */
  destroy = (): void => {
    // Cleanup event listeners
    if (this.backButton) {
      this.backButton.removeEventListener('click', this.handleBack);
    }
    
    // Clear container
    this.container.innerHTML = '';
  };
}

