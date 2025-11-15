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
  private animationDuration: number = 2000; // ms - slower animation (increased from 1200)

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
      touch-action: manipulation;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    `;

    // Use event delegation on SVG for clicks (works even when elements are recreated)
    // This is critical for zoom mode since hover re-renders can remove direct handlers
    const handleClick = (e: MouseEvent | TouchEvent): void => {
      let target = e.target as SVGElement;

      // Traverse up the DOM tree to find the element with data-month
      // Check up to 10 levels deep to catch any nested elements
      let depth = 0;
      while (target && target !== this.svg && depth < 10) {
        if (target.hasAttribute && target.hasAttribute('data-month')) {
          const monthIndex = parseInt(target.getAttribute('data-month') || '0', 10);
          e.stopPropagation();
          e.preventDefault();
          // Cancel any pending hover updates
          this.hoveredMonth = null;
          this.navigateToLevel('month', { month: monthIndex });
          return;
        }
        // Move to parent
        const parent = target.parentElement || target.parentNode;
        if (!parent || parent === this.svg) break;
        target = parent as SVGElement;
        depth++;
      }
    };

    this.svg.addEventListener('click', handleClick, true); // Use capture phase to catch events early
    // Also prevent touch gestures that cause zoom
    this.svg.addEventListener('touchstart', (e: TouchEvent) => {
      // Prevent pinch zoom (2+ fingers)
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

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
      'bottom-4',
      'left-1/2',
      '-translate-x-1/2',
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
    // When going backwards (e.g., from month to year), use the target center (screen center)
    // When going forwards (e.g., from year to month), use the circle center (month position)
    // When in month level and navigating to week/day, use the target center (screen center) since month is centered
    const isGoingBackwards = this.isGoingBackwards(oldState.level, newState.level);
    let oldCenter: { x: number; y: number };
    if (oldState.level === 'month') {
      // Month level is always centered on screen, so use target center
      oldCenter = this.getCircleTargetCenter(oldState);
    } else if (isGoingBackwards && oldState.level !== 'year') {
      // Other backwards transitions also start from screen center
      oldCenter = this.getCircleTargetCenter(oldState);
    } else {
      // Forward transitions from year use the circle center (position on year circle)
      oldCenter = this.getCircleCenter(oldState);
    }

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

    // Calculate new circle center (starting position for new state)
    const newCenterStart = this.getCircleCenter(newState);

    // For month level, animate to the center of the screen, not the month position
    // For other transitions, use the calculated centers
    let newCenterTarget: { x: number; y: number };
    if (newState.level === 'month') {
      // Month circle should animate to center
      newCenterTarget = this.getCircleTargetCenter(newState);
    } else {
      newCenterTarget = newCenterStart;
    }

    // Interpolate center position from old center to new target center
    const currentCenterX = oldCenter.x + (newCenterTarget.x - oldCenter.x) * progress;
    const currentCenterY = oldCenter.y + (newCenterTarget.y - oldCenter.y) * progress;

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
    // Start rendering new circle earlier for smoother transition
    if (progress > 0.1) {
      const newCircle = this.renderCircle(newState, newOpacity);
      if (newCircle) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        // Use interpolated center (already calculated to animate to target)
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
      // Month circle starts at the month position on year circle but animates to center
      // The animation will interpolate from the month position to center in renderTransition
      // For initial position, return the month position on year circle
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
   * Get target center for a state (where it should end up)
   * For month level, the target is always the screen center
   */
  private getCircleTargetCenter = (_state: ZoomState): { x: number; y: number } => {
    const centerX = 350;
    const centerY = 350;

    // All levels should end up centered
    return { x: centerX, y: centerY };
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
    group.style.pointerEvents = 'auto'; // Ensure pointer events work through groups

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

      // Calculate scale based on hover (20% smaller than before: 1.5 -> 1.2)
      let scale = 1;
      if (this.hoveredMonth === index) {
        scale = 1.2; // Reduced from 1.5 as requested
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
      sector.setAttribute('data-month-name', monthName); // For easier debugging
      if (isCurrent) {
        sector.setAttribute('data-current', 'true');
        // Add glow effect for current month
        sector.setAttribute('stroke', 'rgba(255, 255, 255, 0.6)');
        sector.setAttribute('stroke-width', '2');
      }
      sector.style.cursor = 'pointer';
      sector.style.pointerEvents = 'all';
      sector.style.touchAction = 'manipulation';
      (sector.style as any).webkitTouchCallout = 'none';
      sector.style.userSelect = 'none';
      // CSS transition for smooth path changes - slower and smoother
      sector.style.transition = 'd 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), fill 0.6s ease, stroke-width 0.6s ease';
      // Ensure the path itself can receive clicks - use both style and attribute
      (sector as any).setAttribute('pointer-events', 'all');

      // Store month index for event handlers
      const monthIndex = index;

      // Handle navigation on tap/click
      const handleMonthNavigation = (e: Event): void => {
        // CRITICAL: Cancel any pending hover updates IMMEDIATELY
        if (hoverTimeout) {
          if (typeof hoverTimeout === 'number') {
            clearTimeout(hoverTimeout);
          } else {
            cancelAnimationFrame(hoverTimeout);
          }
        }

        // Cancel hover state
        isHovering = false;
        this.hoveredMonth = null;

        e.stopPropagation();
        e.preventDefault();

        this.navigateToLevel('month', { month: monthIndex });
      };

      // Click handler for desktop
      sector.addEventListener('click', handleMonthNavigation, true);

      // Touch handlers for mobile (prevent zoom, handle tap)
      let touchStartTime = 0;
      let touchStartX = 0;
      let touchStartY = 0;

      sector.addEventListener('touchstart', (e: TouchEvent) => {
        // Cancel hover updates on touch
        if (hoverTimeout) {
          if (typeof hoverTimeout === 'number') {
            clearTimeout(hoverTimeout);
          } else {
            cancelAnimationFrame(hoverTimeout);
          }
        }
        isHovering = false;

        // Store touch start info
        if (e.touches.length === 1) {
          touchStartTime = Date.now();
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        } else {
          // Multiple touches = pinch zoom, prevent it
          e.preventDefault();
        }
      }, { passive: false });

      sector.addEventListener('touchend', (e: TouchEvent) => {
        // Only handle single tap (not pinch)
        if (e.changedTouches.length !== 1) {
          return;
        }

        const touchEnd = e.changedTouches[0];
        const touchDuration = Date.now() - touchStartTime;
        const touchDistance = Math.sqrt(
          Math.pow(touchEnd.clientX - touchStartX, 2) +
          Math.pow(touchEnd.clientY - touchStartY, 2)
        );

        // If it's a quick tap (not a drag or long press), navigate
        if (touchDuration < 300 && touchDistance < 10) {
          e.preventDefault();
          e.stopPropagation();
          handleMonthNavigation(e);
        }
      }, { passive: false });

      // Also add mousedown handler for faster response
      sector.addEventListener('mousedown', () => {
        // Cancel hover updates on mousedown
        if (hoverTimeout) {
          if (typeof hoverTimeout === 'number') {
            clearTimeout(hoverTimeout);
          } else {
            cancelAnimationFrame(hoverTimeout);
          }
        }
        isHovering = false;
      });

      // Hover handlers with smooth animation
      // Use a longer delay to ensure clicks fire first
      let hoverTimeout: number | ReturnType<typeof setTimeout> | null = null;
      let isHovering = false;

      sector.addEventListener('mouseenter', () => {
        // Cancel any pending hover updates
        if (hoverTimeout) {
          cancelAnimationFrame(hoverTimeout);
        }
        isHovering = true;
        this.hoveredMonth = monthIndex;
        // Longer delay to allow clicks to fire first, then smooth slow hover animation
        hoverTimeout = setTimeout(() => {
          // Double-check we're still hovering and not clicking
          if (this.currentState.level === 'year' && !this.animating && isHovering) {
            // Use requestAnimationFrame for smoother rendering
            requestAnimationFrame(() => {
              this.render(); // Re-render with new scale for smooth transition
            });
          }
        }, 150) as any; // 150ms delay to allow clicks to fire, then smooth animation
      });

      sector.addEventListener('mouseleave', () => {
        // Cancel any pending hover updates
        if (hoverTimeout) {
          if (typeof hoverTimeout === 'number') {
            clearTimeout(hoverTimeout);
          } else {
            cancelAnimationFrame(hoverTimeout);
          }
        }
        isHovering = false;
        this.hoveredMonth = null;
        // Shorter delay on leave for faster response
        hoverTimeout = setTimeout(() => {
          if (this.currentState.level === 'year' && !this.animating) {
            this.render();
          }
        }, 50) as any;
      });

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

    // Draw period text in center (year)
    const periodText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    periodText.setAttribute('x', String(centerX));
    periodText.setAttribute('y', String(centerY));
    periodText.setAttribute('text-anchor', 'middle');
    periodText.setAttribute('dominant-baseline', 'middle');
    periodText.setAttribute('class', 'period-text');
    periodText.textContent = String(state.year);
    periodText.style.fontSize = '48px';
    periodText.style.fontWeight = 'bold';
    periodText.style.fill = '#fff';

    group.appendChild(periodText);

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
    const monthDaysCount = new Date(year, month + 1, 0).getDate();

    // Get month events (first 4)
    const monthEvents = (this.eventsByYear[year]?.[month] || []).slice(0, 4);

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const isCurrentMonth = year === currentYear && month === currentMonth;

    // Draw days
    for (let day = 1; day <= monthDaysCount; day++) {
      const angle = ((day - 1) / monthDaysCount) * Math.PI * 2 - Math.PI / 2;
      const dayAngle = (day / monthDaysCount) * Math.PI * 2 - Math.PI / 2;
      const startAngle = angle - (Math.PI / monthDaysCount);
      const endAngle = angle + (Math.PI / monthDaysCount);

      // Check if Sunday
      const dayDate = new Date(year, month, day);
      const isSunday = dayDate.getDay() === 0;

      // Check if current day
      const isCurrent = isCurrentMonth && day === currentDay;

      // Draw day sector - use similar color scheme to year's
      let fillColor: string;
      if (isCurrent) {
        fillColor = `hsl(${(day * 11) % 360}, 80%, 50%)`; // Brighter for current day
      } else if (isSunday) {
        fillColor = `hsl(${(day * 11) % 360}, 75%, 55%)`; // Slightly different for Sunday
      } else {
        fillColor = `hsl(${(day * 11) % 360}, 70%, 60%)`; // Similar to year's color scheme
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
        // Much more visible stroke for current day
        sector.setAttribute('stroke', 'rgba(100, 200, 255, 1)');
        sector.setAttribute('stroke-width', '4');
        // Add a filter for glow effect
        const filterId = 'current-day-glow-month';
        let filter = this.svg.querySelector(`#${filterId}`) as SVGFilterElement;
        if (!filter && this.svg) {
          filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
          filter.setAttribute('id', filterId);
          const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
          feGaussianBlur.setAttribute('stdDeviation', '4');
          feGaussianBlur.setAttribute('result', 'coloredBlur');
          const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
          const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
          feMergeNode1.setAttribute('in', 'coloredBlur');
          const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
          feMergeNode2.setAttribute('in', 'SourceGraphic');
          feMerge.appendChild(feMergeNode1);
          feMerge.appendChild(feMergeNode2);
          filter.appendChild(feGaussianBlur);
          filter.appendChild(feMerge);
          // Get or create defs element in the SVG
          let defs = this.svg.querySelector('defs');
          if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svg.insertBefore(defs, this.svg.firstChild);
          }
          defs.appendChild(filter);
        }
        if (filter) {
          sector.setAttribute('filter', `url(#${filterId})`);
        }
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

      // Draw day label with background circle for maximum visibility FIRST
      // This ensures labels are always visible even if sectors are re-rendered
      const labelRadius = radius * 0.88; // Slightly further out for better visibility
      const labelX = centerX + Math.cos(dayAngle) * labelRadius;
      const labelY = centerY + Math.sin(dayAngle) * labelRadius;

      // Draw background circle behind the number for visibility
      const bgRadius = isCurrent ? 18 : 15; // Larger background for current day
      const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bgCircle.setAttribute('cx', String(labelX));
      bgCircle.setAttribute('cy', String(labelY));
      bgCircle.setAttribute('r', String(bgRadius));
      bgCircle.setAttribute('fill', isCurrent ? 'rgba(100, 200, 255, 0.9)' : 'rgba(0, 0, 0, 0.75)');
      bgCircle.setAttribute('stroke', isCurrent ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)');
      bgCircle.setAttribute('stroke-width', isCurrent ? '2' : '1');
      bgCircle.style.pointerEvents = 'none';
      bgCircle.setAttribute('opacity', '1');
      bgCircle.setAttribute('visibility', 'visible');
      group.appendChild(bgCircle);

      // Draw the number text
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(labelX));
      label.setAttribute('y', String(labelY));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('class', 'day-label');
      label.setAttribute('fill', '#ffffff'); // Set fill as attribute as well
      label.setAttribute('stroke', '#000000'); // Black stroke for contrast
      label.setAttribute('stroke-width', '1.5'); // Slightly thicker stroke for visibility
      label.setAttribute('stroke-linejoin', 'round'); // Smooth stroke
      label.setAttribute('paint-order', 'stroke fill'); // Stroke first, then fill (SVG attribute)
      label.textContent = String(day);
      label.style.fontSize = isCurrent ? '28px' : '24px'; // Much larger font for readability
      label.style.fontWeight = 'bold'; // Always bold
      label.style.fill = '#ffffff'; // Always white
      label.style.stroke = '#000000'; // Black stroke
      label.style.strokeWidth = '2px'; // Slightly thicker stroke for visibility
      label.style.paintOrder = 'stroke fill'; // Stroke first, then fill (CSS property)
      // SVG doesn't support CSS text-shadow, use stroke instead
      label.style.pointerEvents = 'none';
      label.setAttribute('opacity', '1'); // Ensure opacity is 1
      label.setAttribute('visibility', 'visible'); // Ensure visibility

      group.appendChild(label);

      // Append sector AFTER labels so it's behind (SVG renders in order)
      group.appendChild(sector);
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

    // Draw period text in center (month name and dates)
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const periodText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    periodText.setAttribute('x', String(centerX));
    periodText.setAttribute('y', String(centerY + 80));
    periodText.setAttribute('text-anchor', 'middle');
    periodText.setAttribute('dominant-baseline', 'middle');
    periodText.setAttribute('class', 'period-text');
    periodText.textContent = `${monthNames[month]} 1-${totalDaysInMonth}`;
    periodText.style.fontSize = '24px';
    periodText.style.fontWeight = 'bold';
    periodText.style.fill = '#fff';

    group.appendChild(periodText);

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

      // Draw day sector - use similar color scheme to year's
      // Color based on day index (i) to match year's pattern
      const fillColor = isCurrent
        ? `hsl(${(i * 51) % 360}, 80%, 50%)` // Brighter for current day
        : `hsl(${(i * 51) % 360}, 70%, 60%)`; // Similar to year's color scheme
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

      // Draw day name and number
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(labelX));
      label.setAttribute('y', String(labelY));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('class', 'day-label');
      label.textContent = `${dayNames[i]}\n${day}`;
      label.style.fontSize = isCurrent ? '16px' : '14px';
      label.style.fontWeight = 'bold';
      label.style.fill = isCurrent ? '#fff' : '#fff';
      label.style.textShadow = isCurrent ? '0 0 8px rgba(255, 255, 255, 0.8)' : 'none';
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

    // Draw period text in center (week number and date range)
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const monthNamesShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const startDay = weekStart.getDate();
    const startMonthName = monthNamesShort[weekStart.getMonth()];
    const endDay = weekEndDate.getDate();
    const endMonthName = monthNamesShort[weekEndDate.getMonth()];
    const periodText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    periodText.setAttribute('x', String(centerX));
    periodText.setAttribute('y', String(centerY + 80));
    periodText.setAttribute('text-anchor', 'middle');
    periodText.setAttribute('dominant-baseline', 'middle');
    periodText.setAttribute('class', 'period-text');
    // Format: "Week 12, dates 12-19 March" or "Week 12, dates 28 Mar - 4 Apr"
    if (startMonthName === endMonthName) {
      periodText.textContent = `Week ${week + 1}, dates ${startDay}-${endDay} ${startMonthName}`;
    } else {
      periodText.textContent = `Week ${week + 1}, dates ${startDay} ${startMonthName} - ${endDay} ${endMonthName}`;
    }
    periodText.style.fontSize = '20px';
    periodText.style.fontWeight = 'bold';
    periodText.style.fill = '#fff';

    group.appendChild(periodText);

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

      // Draw hour sector - use similar color scheme to year's
      const fillColor = isCurrent
        ? `hsl(${(hour * 30) % 360}, 80%, 50%)` // Brighter for current hour
        : `hsl(${(hour * 30) % 360}, 70%, 60%)`; // Similar to year's color scheme
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

    // Draw period text in center (date)
    const monthNamesShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const periodText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    periodText.setAttribute('x', String(centerX));
    periodText.setAttribute('y', String(centerY + 80));
    periodText.setAttribute('text-anchor', 'middle');
    periodText.setAttribute('dominant-baseline', 'middle');
    periodText.setAttribute('class', 'period-text');
    periodText.textContent = `${monthNamesShort[month]} ${day}, ${year}`;
    periodText.style.fontSize = '20px';
    periodText.style.fontWeight = 'bold';
    periodText.style.fill = '#fff';

    group.appendChild(periodText);

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
   * Check if navigation is going backwards
   */
  private isGoingBackwards = (oldLevel: ZoomLevel, newLevel: ZoomLevel): boolean => {
    const levelOrder: ZoomLevel[] = ['year', 'month', 'week', 'day'];
    const oldIndex = levelOrder.indexOf(oldLevel);
    const newIndex = levelOrder.indexOf(newLevel);
    return oldIndex > newIndex;
  };

  /**
   * Get level name for display
   */
  private getLevelName = (level: ZoomLevel): string => {
    if (level === 'month') {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      return monthNames[this.currentState.month];
    } else if (level === 'week') {
      return 'month';
    } else if (level === 'day') {
      return 'week';
    }
    return 'year';
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
    if (this.animating) {
      return;
    }

    if (!this.svg) {
      console.error('[ZoomMode] SVG element not found in render()!');
      return;
    }

    // Clear SVG but preserve defs element for filters
    const existingDefs = this.svg.querySelector('defs');
    this.svg.innerHTML = '';

    // Restore defs if it existed (needed for filters)
    if (existingDefs) {
      this.svg.appendChild(existingDefs);
    }

    // Render current circle
    const circle = this.renderCircle(this.currentState, 1);
    if (circle) {
      // For month level, always use center (not the month position)
      const center = this.currentState.level === 'month'
        ? this.getCircleTargetCenter(this.currentState)
        : this.getCircleCenter(this.currentState);
      const scale = this.getCircleScale(this.currentState);

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('transform', `translate(${center.x}, ${center.y}) scale(${scale})`);
      group.style.pointerEvents = 'auto'; // Ensure pointer events work through groups
      group.appendChild(circle);
      this.svg.appendChild(group);
    } else {
      console.error('[ZoomMode] renderCircle returned null!');
    }

    // Update back button visibility and text
    if (this.backButton) {
      if (this.currentState.level === 'year') {
        this.backButton.classList.add('hidden');
      } else {
        this.backButton.classList.remove('hidden');
        // Update button text based on current level
        const levelText = this.getLevelName(this.currentState.level);
        this.backButton.innerHTML = `← Zoom out to ${levelText}`;
        this.backButton.setAttribute('aria-label', `Zoom out to ${levelText}`);
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

