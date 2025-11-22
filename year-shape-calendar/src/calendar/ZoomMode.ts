/**
 * @fileoverview Zoom Mode - Interactive calendar with nested zoom levels
 *
 * ZoomMode provides a hierarchical calendar view with smooth animations between levels:
 * - Year level: Shows 12 months in a circular layout
 * - Month level: Shows all days of the selected month
 * - Week level: Shows 7 days of the selected week
 * - Day level: Shows 12-hour clock view with events
 *
 * Features:
 * - Smooth zoom transitions with ease-out-quart easing
 * - Click to zoom in, back button to zoom out
 * - Wheel/pinch gestures for zoom control
 * - Swipe navigation for prev/next periods
 * - Hover effects with scale transformations
 * - Google Calendar event integration
 *
 * @module calendar/ZoomMode
 */

import type { CalendarEvent } from "../types";
import { createElement } from "../utils/dom";
import { CircleRenderer, type CircleItem } from "./CircleRenderer";

/**
 * Zoom level type - represents the current view granularity
 */
export type ZoomLevel = "year" | "month" | "week" | "day";

/**
 * Interface representing the current state of the zoom view
 */
export interface ZoomState {
  level: ZoomLevel; // Current zoom level
  year: number; // Current year (e.g., 2025)
  month: number; // Current month (0-11, 0 = January)
  week: number; // Current week (0-51)
  day: number; // Current day (1-31)
}

/**
 * ZoomMode class - manages the interactive hierarchical calendar view
 *
 * Architecture:
 * - Uses SVG for rendering all visual elements
 * - Event delegation for efficient click handling
 * - RequestAnimationFrame for smooth animations
 * - Separate label layers to prevent occlusion
 * - Transform-based scaling for performance
 *
 * @class
 */
export class ZoomMode {
  private container: HTMLElement;
  private svg!: SVGElement;
  private currentState: ZoomState;
  private eventsByYear: Record<number, Record<number, CalendarEvent[]>> = {}; // year -> month -> events
  private eventsByWeek: Record<number, CalendarEvent[]> = {}; // week -> events
  private eventsByDay: Record<string, CalendarEvent[]> = {}; // "YYYY-MM-DD" -> events

  // Circle renderer for DRY code
  private circleRenderer: CircleRenderer = new CircleRenderer();

  // Animation state
  private animating: boolean = false;
  private animationStartTime: number = 0;
  private animationDuration: number = 800; // ms - fast and fluent animation

  // Direction (1 = CW, -1 = CCW)
  private direction: number = 1;

  // Rotation offset (for shifting months in year view)
  private rotationOffset: number = 0;

  // Hover state (month hover now handled by CircleRenderer)
  private hoveredDay: number | null = null; // For month circle
  private hoveredWeekDay: number | null = null; // For week circle (0-6)
  private hoveredHour: number | null = null; // For day circle (1-12)

  // Back button
  private backButton: HTMLButtonElement | null = null;

  // Callbacks
  private onStateChange: ((state: ZoomState) => void) | null = null;

  constructor(
    container: HTMLElement,
    initialYear: number = new Date().getFullYear(),
    initialState?: Partial<ZoomState>
  ) {
    this.container = container;
    this.currentState = {
      level: initialState?.level || "year",
      year: initialState?.year || initialYear,
      month: initialState?.month || 0,
      week: initialState?.week || 0,
      day: initialState?.day || 1,
    };

    this.initializeSVG();
    this.initializeBackButton();
    this.initializeKeyboardHandlers();
    this.render();
    this.setupBrowserBackButton();
  }

  /**
   * Initialize SVG element
   */
  private initializeSVG = (): void => {
    // Clear container
    this.container.innerHTML = "";

    // Create SVG
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("viewBox", "0 0 800 800");
    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");
    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet"); // Maintain aspect ratio - no ellipsis!
    this.svg.setAttribute("shape-rendering", "geometricPrecision");
    this.svg.classList.add("zoom-mode-svg");

    // Use event delegation on SVG for clicks (works even when elements are recreated)
    // This is critical for zoom mode since hover re-renders can remove direct handlers
    const handleClick = (e: MouseEvent | TouchEvent): void => {
      let target = e.target as SVGElement;

      // Traverse up the DOM tree to find the element with data-month
      // Check up to 10 levels deep to catch any nested elements
      let depth = 0;
      while (target && target !== this.svg && depth < 10) {
        if (target.hasAttribute && target.hasAttribute("data-month")) {
          const monthIndex = parseInt(
            target.getAttribute("data-month") || "0",
            10
          );
          e.stopPropagation();
          e.preventDefault();
          this.navigateToLevel("month", { month: monthIndex });
          return;
        }
        // Move to parent
        const parent = target.parentElement || target.parentNode;
        if (!parent || parent === this.svg) break;
        target = parent as SVGElement;
        depth++;
      }
    };

    this.svg.addEventListener("click", handleClick, true); // Use capture phase to catch events early

    // Handle pinch zoom for zoom in/out
    let initialDistance = 0;
    let lastScale = 1;
    let isPinching = false;

    this.svg.addEventListener(
      "touchstart",
      (e: TouchEvent) => {
        if (e.touches.length === 2) {
          isPinching = true;
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          initialDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );
          lastScale = 1;
        } else {
          isPinching = false;
        }
      },
      { passive: false }
    );

    this.svg.addEventListener(
      "touchmove",
      (e: TouchEvent) => {
        if (e.touches.length === 2 && isPinching) {
          e.preventDefault();
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );

          const scale = currentDistance / initialDistance;
          const scaleChange = scale / lastScale;
          lastScale = scale;

          // Zoom in/out based on pinch scale
          if (scaleChange > 1.2) {
            // Pinch out (zoom in)
            const state = this.currentState;
            if (state.level === "year") {
              // Zoom into first month
              this.navigateToLevel("month", { month: 0 });
            } else if (state.level === "month") {
              // Zoom into first day of month
              this.navigateToLevel("week", { week: 0 });
            } else if (state.level === "week") {
              // Zoom into first day of week
              this.navigateToLevel("day", { day: 1 });
            }
            isPinching = false;
          } else if (scaleChange < 0.8) {
            // Pinch in (zoom out)
            this.handleBack();
            isPinching = false;
          }
        }
      },
      { passive: false }
    );

    this.svg.addEventListener(
      "touchend",
      () => {
        isPinching = false;
        initialDistance = 0;
        lastScale = 1;
      },
      { passive: false }
    );

    // Global wheel event handler for zoom in/out on entire SVG
    let globalWheelDelta = 0;
    let globalWheelTimeout: ReturnType<typeof setTimeout> | null = null;

    this.svg.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        // Only handle if not over a specific sector (to avoid double-handling)
        const target = e.target as SVGElement;
        if (
          target.hasAttribute &&
          (target.hasAttribute("data-day") || target.hasAttribute("data-month"))
        ) {
          return; // Let sector handlers deal with it
        }

        e.preventDefault();

        // Reset timeout on each wheel event
        if (globalWheelTimeout) {
          clearTimeout(globalWheelTimeout);
        }

        // Accumulate delta
        globalWheelDelta += e.deltaY;

        // Set timeout to reset after wheel stops
        globalWheelTimeout = setTimeout(() => {
          globalWheelDelta = 0;
        }, 200);

        const state = this.currentState;

        if (Math.abs(globalWheelDelta) >= 100) {
          if (globalWheelDelta < 0) {
            // Scroll up = zoom out
            this.handleBack();
          } else {
            // Scroll down = zoom in
            if (state.level === "year") {
              // Zoom into current month
              const now = new Date();
              this.navigateToLevel("month", { month: now.getMonth() });
            } else if (state.level === "month") {
              // Zoom into current day's week
              const now = new Date();
              const week = this.getWeekForDay(
                state.year,
                state.month,
                now.getDate()
              );
              this.navigateToLevel("week", { week });
            } else if (state.level === "week") {
              // Zoom into current day
              const now = new Date();
              this.navigateToLevel("day", { day: now.getDate() });
            }
          }
          globalWheelDelta = 0;
          if (globalWheelTimeout) {
            clearTimeout(globalWheelTimeout);
            globalWheelTimeout = null;
          }
        }
      },
      { passive: false }
    );

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
    this.backButton = createElement("button", [
      "btn",
      "primary",
      "absolute",
      "bottom-4",
      "left-1/2",
      "-translate-x-1/2",
      "z-50",
      "hidden",
    ]) as HTMLButtonElement;

    this.backButton.innerHTML = "← Back";
    this.backButton.addEventListener("click", this.handleBack);
    this.backButton.setAttribute("aria-label", "Go back");

    this.container.appendChild(this.backButton);
  };

  /**
   * Setup browser back button handling
   */
  private setupBrowserBackButton = (): void => {
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.zoomLevel) {
        this.navigateToLevel(e.state.zoomLevel, e.state.params || {}, false);
      }
    });
  };

  /**
   * Initialize keyboard event handlers
   */
  private initializeKeyboardHandlers = (): void => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // ESC key - go back one level or close modals
      if (e.key === "Escape" || e.key === "Esc") {
        const state = this.currentState;
        // Only handle if not at year level (top level)
        if (state.level !== "year") {
          e.preventDefault();
          this.handleBack();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
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
    Object.values(eventsByWeek).forEach((weekEvents) => {
      weekEvents.forEach((event) => {
        if (!event.start) return;

        const eventDate = new Date(event.start);
        const year = eventDate.getFullYear();
        const month = eventDate.getMonth();
        const dayKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
          eventDate.getDate()
        ).padStart(2, "0")}`;

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
    Object.keys(this.eventsByYear[currentYear]).forEach((monthStr) => {
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

    // Notify state change callback
    if (this.onStateChange) {
      this.onStateChange(this.currentState);
    }

    // Animate transition
    this.animateTransition(oldState, this.currentState);
  };

  /**
   * Update URL hash
   */
  private updateURLHash = (): void => {
    const state = this.currentState;
    let hash = "#zoom";

    if (state.level === "month") {
      hash += `/month/${state.year}/${state.month}`;
    } else if (state.level === "week") {
      hash += `/week/${state.year}/${state.week}`;
    } else if (state.level === "day") {
      hash += `/day/${state.year}/${state.month + 1}/${state.day}`;
    } else {
      hash += `/year/${state.year}`;
    }

    window.history.pushState(
      { zoomLevel: state.level, params: state },
      "",
      hash
    );
  };

  /**
   * Animate transition between levels
   */
  private animateTransition = (
    oldState: ZoomState,
    newState: ZoomState
  ): void => {
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
    const isGoingBackwards = this.isGoingBackwards(
      oldState.level,
      newState.level
    );
    let oldCenter: { x: number; y: number };
    if (oldState.level === "month") {
      // Month level is always centered on screen, so use target center
      oldCenter = this.getCircleTargetCenter(oldState);
    } else if (isGoingBackwards && oldState.level !== "year") {
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

      // Easing function (ease-out-quart) - more fluid and natural
      // Starts fast, decelerates smoothly
      const eased = 1 - Math.pow(1 - progress, 4);

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
    this.svg.innerHTML = "";
    // Always enable pointer events so clicks work during animation
    this.svg.style.pointerEvents = "auto";

    // Calculate new circle center (starting position for new state)
    const newCenterStart = this.getCircleCenter(newState);

    // For month level, animate to the center of the screen, not the month position
    // For other transitions, use the calculated centers
    let newCenterTarget: { x: number; y: number };
    if (newState.level === "month") {
      // Month circle should animate to center
      newCenterTarget = this.getCircleTargetCenter(newState);
    } else {
      newCenterTarget = newCenterStart;
    }

    // Determine if we're zooming in (to a deeper level) or zooming out (to a shallower level)
    const isZoomingIn =
      this.getZoomLevelDepth(newState.level) >
      this.getZoomLevelDepth(oldState.level);

    // For zoom in: first move to center (0-0.5), then scale (0.5-1.0)
    // For zoom out: first scale (0-0.5), then move to position (0.5-1.0)
    let positionProgress: number;
    let scaleProgress: number;

    if (isZoomingIn) {
      // Zoom in: move first, then scale
      positionProgress = Math.min(progress * 2, 1); // 0-0.5 maps to 0-1
      scaleProgress = Math.max((progress - 0.5) * 2, 0); // 0.5-1 maps to 0-1
    } else {
      // Zoom out: scale first, then move
      scaleProgress = Math.min(progress * 2, 1); // 0-0.5 maps to 0-1
      positionProgress = Math.max((progress - 0.5) * 2, 0); // 0.5-1 maps to 0-1
    }

    // Interpolate center position from old center to new target center
    const currentCenterX =
      oldCenter.x + (newCenterTarget.x - oldCenter.x) * positionProgress;
    const currentCenterY =
      oldCenter.y + (newCenterTarget.y - oldCenter.y) * positionProgress;

    // Interpolate scale
    const oldScale = this.getCircleScale(oldState);
    const newScale = this.getCircleScale(newState);
    const currentScale = oldScale + (newScale - oldScale) * scaleProgress;

    // Interpolate opacity
    const oldOpacity = 1 - progress;
    const newOpacity = progress;

    // Render old circle (fading out) - disable pointer events during fade
    if (progress < 0.8) {
      const oldCircle = this.renderCircle(oldState, oldOpacity);
      if (oldCircle) {
        const oldGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        oldGroup.setAttribute(
          "transform",
          `translate(${oldCenter.x}, ${oldCenter.y}) scale(${
            oldScale * (1 + progress * 2)
          })`
        );
        oldGroup.style.pointerEvents = "none"; // Disable clicks on old circle
        oldGroup.appendChild(oldCircle);
        this.svg.appendChild(oldGroup);
      }
    }

    // Render new circle (fading in) - always enable pointer events for clicks
    // Start rendering new circle earlier for smoother transition
    if (progress > 0.1) {
      const newCircle = this.renderCircle(newState, newOpacity);
      if (newCircle) {
        const group = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        // Use interpolated center (already calculated to animate to target)
        group.setAttribute(
          "transform",
          `translate(${currentCenterX}, ${currentCenterY}) scale(${currentScale})`
        );
        group.style.pointerEvents = "auto"; // Always enable clicks
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
  private getCircleCenter = (_state: ZoomState): { x: number; y: number } => {
    const centerX = 400; // Center of 800x800 viewBox
    const centerY = 400;

    // All circles should be centered - always use screen center
    return { x: centerX, y: centerY };
  };

  /**
   * Get target center for a state (where it should end up)
   * For month level, the target is always the screen center
   */
  private getCircleTargetCenter = (
    _state: ZoomState
  ): { x: number; y: number } => {
    const centerX = 400; // Center of 800x800 viewBox
    const centerY = 400;

    // All levels should end up centered
    return { x: centerX, y: centerY };
  };

  /**
   * Get zoom level depth (0 = year, 1 = month, 2 = week, 3 = day)
   */
  private getZoomLevelDepth = (level: ZoomLevel): number => {
    switch (level) {
      case "year":
        return 0;
      case "month":
        return 1;
      case "week":
        return 2;
      case "day":
        return 3;
    }
  };

  /**
   * Get circle scale for a state
   */
  private getCircleScale = (state: ZoomState): number => {
    if (state.level === "year") return 1;
    if (state.level === "month") return 0.8;
    if (state.level === "week") return 0.9;
    return 0.95;
  };

  /**
   * Render circle for a state
   */
  private renderCircle = (
    state: ZoomState,
    opacity: number = 1
  ): SVGElement | null => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("opacity", String(opacity));
    group.style.pointerEvents = "auto"; // Ensure pointer events work through groups

    if (state.level === "year") {
      return this.renderYearCircle(group, state);
    } else if (state.level === "month") {
      return this.renderMonthCircle(group, state);
    } else if (state.level === "week") {
      return this.renderWeekCircle(group, state);
    } else if (state.level === "day") {
      return this.renderDayCircle(group, state);
    }

    return null;
  };

  /**
   * Render year circle (12 months) - REFACTORED to use CircleRenderer
   */
  private renderYearCircle = (
    group: SVGElement,
    state: ZoomState
  ): SVGElement => {
    const centerX = 0;
    const centerY = 0;
    const radius = 320;

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Get current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const isCurrentYear = state.year === currentYear;

    // Prepare circle items
    const items: CircleItem[] = months.map((monthName, index) => ({
      index,
      label: monthName,
      value: index,
      isCurrent: isCurrentYear && index === currentMonth,
    }));

    // Use CircleRenderer for unified rendering
    this.circleRenderer.render(group, {
      centerX,
      centerY,
      radius,
      innerRadius: radius * 0.7,
      items,
      colorScheme: (item) => {
        const hue = (item.index * 30) % 360;
        return item.isCurrent
          ? `hsl(${hue}, 80%, 50%)` // Brighter for current
          : `hsl(${hue}, 70%, 60%)`;
      },
      direction: this.direction,
      rotationOffset: this.rotationOffset,
      onItemClick: (item) => {
        this.navigateToLevel("month", { month: item.value });
      },
      onItemHover: () => {
        // Hover state is managed internally by CircleRenderer
      },
      labelFontSize: 24,
      labelFontWeight: "bold",
      enableHover: true,
      hoverScale: 1.5,
      adjacentScale: 1.1,
      sectorClass: "month-sector",
    });

    // Add arrow indicator for current month
    if (isCurrentYear) {
      // Calculate angle for current month - must match CircleRenderer exactly!
      // CircleRenderer uses svg.ts applyDirectionMirroring(angle, direction)
      const totalItems = 12;
      const rotationRadians = (this.rotationOffset * Math.PI) / 180;
      const baseAngle =
        (currentMonth / totalItems) * Math.PI * 2 -
        Math.PI / 2 +
        rotationRadians;
      // Use svg.ts formula: direction === 1 ? angle : -angle
      const angle = this.direction === 1 ? baseAngle : -baseAngle;

      const arrow = this.createCurrentIndicatorArrow(
        centerX,
        centerY,
        angle,
        radius,
        {
          size: 35,
          color: "#64c8ff",
          pulseAnimation: true,
        }
      );
      group.appendChild(arrow);
    }

    // Draw period text in center (year)
    const periodText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    periodText.setAttribute("x", String(centerX));
    periodText.setAttribute("y", String(centerY));
    periodText.setAttribute("text-anchor", "middle");
    periodText.setAttribute("dominant-baseline", "middle");
    periodText.classList.add("period-text", "year");
    periodText.textContent = String(state.year);

    group.appendChild(periodText);

    return group;
  };

  /**
   * SVG STRUCTURE DOCUMENTATION:
   *
   * When a circle is rendered, the SVG structure is:
   *   <svg>
   *     <g transform="translate(400,400) scale(1)">  <!-- Wrapper group with transform -->
   *       <g data-month="0" class="sector-group">     <!-- Sector group -->
   *         <path class="month-sector">...</path>     <!-- Sector path -->
   *         <text>...</text>                          <!-- Label (for year/week/day) -->
   *       </g>
   *       <g data-day="1" class="sector-group">...</g>
   *       ...
   *       <g class="labels-layer">                    <!-- Labels layer (month circle only) -->
   *         <circle data-day="1">...</circle>         <!-- Background circle -->
   *         <text class="day-label" data-day="1">...</text>
   *       </g>
   *     </g>
   *   </svg>
   *
   * Key points:
   * - The wrapper group has transform="translate(...) scale(...)"
   * - Sector groups have data-month, data-day, data-week-day, or data-hour attributes
   * - Month circle labels are in a separate .labels-layer group (rendered AFTER sectors)
   * - Year/Week/Day circles have labels INSIDE sector groups (they scale together)
   */

  /**
   * Helper: Find the wrapper group that contains all sectors for the current level
   * This is the group with transform="translate(...) scale(...)" attribute
   */
  private findWrapperGroup = (): SVGGElement | null => {
    const wrapper = this.svg.querySelector(
      'g[transform*="scale"]'
    ) as SVGGElement;
    return wrapper || null;
  };

  /**
   * Helper: Ensure labels layer is visible and on top
   * Used for month circle where labels are in a separate layer
   */
  private ensureLabelsLayerVisible = (wrapperGroup: SVGGElement): void => {
    const labelsGroup = wrapperGroup.querySelector(
      ".labels-layer"
    ) as SVGGElement;
    if (!labelsGroup) return;

    // Force visibility
    labelsGroup.style.visibility = "visible";
    labelsGroup.style.opacity = "1";
    labelsGroup.style.display = "block";
    labelsGroup.style.pointerEvents = "none";

    // Move to end to ensure it renders on top
    wrapperGroup.appendChild(labelsGroup);

    // Ensure all labels are visible
    const labels = labelsGroup.querySelectorAll(".day-label");
    labels.forEach((label) => {
      const textEl = label as SVGTextElement;
      textEl.style.transform = "none"; // NEVER use transforms on labels
      textEl.style.visibility = "visible";
      textEl.style.opacity = "1";
      textEl.style.display = "block";
      textEl.style.pointerEvents = "none";
    });

    // Ensure all background circles are visible
    const bgCircles = labelsGroup.querySelectorAll("circle[data-day]");
    bgCircles.forEach((circle) => {
      const circleEl = circle as SVGCircleElement;
      circleEl.style.transform = "none";
      circleEl.style.visibility = "visible";
      circleEl.style.opacity = "1";
      circleEl.style.display = "block";
      circleEl.style.pointerEvents = "none";
    });
  };

  /**
   * Update day sector scales in month circle based on hover state
   *
   * Structure: monthGroup > sectorGroups[data-day] > sector
   *            monthGroup > .labels-layer > labels + bgCircles
   *
   * IMPORTANT: Labels are in a SEPARATE layer to prevent occlusion.
   * They must NEVER use transforms, and must always be visible.
   */
  private updateDayScales = (): void => {
    if (this.currentState.level !== "month") return;

    const monthGroup = this.findWrapperGroup();
    if (!monthGroup) return;

    // Update sector scales
    const sectorGroups = monthGroup.querySelectorAll("g[data-day]");
    sectorGroups.forEach((g) => {
      const sectorGroup = g as SVGGElement;
      const dayIndex = parseInt(
        sectorGroup.getAttribute("data-day") || "0",
        10
      );
      const scaleValue = this.hoveredDay === dayIndex ? 1.5 : 1;
      sectorGroup.style.transform = `scale(${scaleValue})`;
    });

    // CRITICAL: Ensure labels layer is always visible and on top
    // This prevents labels from disappearing when sectors scale
    this.ensureLabelsLayerVisible(monthGroup);
  };

  /**
   * Update week day sector scales in week circle based on hover state
   *
   * Structure: weekGroup > sectorGroups[data-week-day] > sector + label
   *
   * NOTE: Labels are INSIDE sector groups, so they scale with sectors.
   * This is different from month circle where labels are separate.
   */
  private updateWeekDayScales = (): void => {
    if (this.currentState.level !== "week") return;

    const weekGroup = this.findWrapperGroup();
    if (!weekGroup) return;

    const sectorGroups = weekGroup.querySelectorAll("g[data-week-day]");
    sectorGroups.forEach((g) => {
      const sectorGroup = g as SVGGElement;
      const dayIndex = parseInt(
        sectorGroup.getAttribute("data-week-day") || "0",
        10
      );
      const scaleValue = this.hoveredWeekDay === dayIndex ? 1.5 : 1;
      sectorGroup.style.transform = `scale(${scaleValue})`;
    });
  };

  /**
   * Update hour sector scales in day circle based on hover state
   *
   * Structure: dayGroup > sectorGroups[data-hour] > sector + label
   *
   * NOTE: Labels are INSIDE sector groups, so they scale with sectors.
   */
  private updateHourScales = (): void => {
    if (this.currentState.level !== "day") return;

    const dayGroup = this.findWrapperGroup();
    if (!dayGroup) return;

    const sectorGroups = dayGroup.querySelectorAll("g[data-hour]");
    sectorGroups.forEach((g) => {
      const sectorGroup = g as SVGGElement;
      const hourIndex = parseInt(
        sectorGroup.getAttribute("data-hour") || "0",
        10
      );
      const scaleValue = this.hoveredHour === hourIndex ? 1.5 : 1;
      sectorGroup.style.transform = `scale(${scaleValue})`;
    });
  };

  /**
   * Create an arrow indicator pointing at a specific angle (for current items)
   */
  private createCurrentIndicatorArrow = (
    centerX: number,
    centerY: number,
    angle: number,
    radius: number,
    options: {
      size?: number;
      color?: string;
      pulseAnimation?: boolean;
    } = {}
  ): SVGElement => {
    const size = options.size || 30;
    const color = options.color || "#64c8ff";
    const pulseAnimation = options.pulseAnimation !== false;

    // Position arrow outside the circle
    const arrowDistance = radius + size + 10;
    const arrowX = centerX + Math.cos(angle) * arrowDistance;
    const arrowY = centerY + Math.sin(angle) * arrowDistance;

    // Create arrow group
    const arrowGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    arrowGroup.classList.add("current-indicator-arrow");

    // Calculate arrow points (pointing toward center)
    // Arrow is an equilateral triangle pointing inward
    const tipX = centerX + Math.cos(angle) * radius;
    const tipY = centerY + Math.sin(angle) * radius;

    const baseX = arrowX;
    const baseY = arrowY;

    // Perpendicular angle for arrow wings
    const perpAngle1 = angle + Math.PI / 2;
    const perpAngle2 = angle - Math.PI / 2;

    const wing1X = baseX + Math.cos(perpAngle1) * (size / 2);
    const wing1Y = baseY + Math.sin(perpAngle1) * (size / 2);
    const wing2X = baseX + Math.cos(perpAngle2) * (size / 2);
    const wing2Y = baseY + Math.sin(perpAngle2) * (size / 2);

    // Create arrow path
    const arrow = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    arrow.setAttribute(
      "points",
      `${tipX},${tipY} ${wing1X},${wing1Y} ${wing2X},${wing2Y}`
    );
    arrow.setAttribute("fill", color);
    arrow.setAttribute("stroke", "#ffffff");
    arrow.setAttribute("stroke-width", "2");
    arrow.setAttribute("opacity", "0.9");
    arrow.style.pointerEvents = "none";

    // Add pulse animation if enabled
    if (pulseAnimation) {
      const animateOpacity = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "animate"
      );
      animateOpacity.setAttribute("attributeName", "opacity");
      animateOpacity.setAttribute("values", "0.9;0.5;0.9");
      animateOpacity.setAttribute("dur", "2s");
      animateOpacity.setAttribute("repeatCount", "indefinite");
      arrow.appendChild(animateOpacity);
    }

    arrowGroup.appendChild(arrow);
    return arrowGroup;
  };

  /**
   * Create a standardized label element with consistent styling
   */
  private createLabel = (
    x: number,
    y: number,
    text: string,
    options: {
      fontSize?: string;
      fontWeight?: string;
      fill?: string;
      stroke?: string;
      strokeWidth?: string;
      className?: string;
      bgCircle?: {
        radius: number;
        fill: string;
        stroke: string;
        strokeWidth: string;
      };
      isCurrent?: boolean;
    } = {}
  ): { label: SVGTextElement; bgCircle?: SVGCircleElement } => {
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", String(x));
    label.setAttribute("y", String(y));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.setAttribute("class", options.className || "label");
    label.textContent = text;
    label.style.fontSize = options.fontSize || "28px";
    label.style.fontWeight = options.fontWeight || "bold";
    label.style.fill = options.fill || "#fff";
    if (options.stroke) {
      label.setAttribute("stroke", options.stroke);
      label.style.stroke = options.stroke;
      label.style.strokeWidth = options.strokeWidth || "2px";
      label.setAttribute("stroke-width", options.strokeWidth || "2");
      label.setAttribute("stroke-linejoin", "round");
      label.setAttribute("paint-order", "stroke fill");
      label.style.paintOrder = "stroke fill";
    }
    label.style.pointerEvents = "none";

    let bgCircle: SVGCircleElement | undefined;
    if (options.bgCircle) {
      bgCircle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      bgCircle.setAttribute("cx", String(x));
      bgCircle.setAttribute("cy", String(y));
      bgCircle.setAttribute("r", String(options.bgCircle.radius));
      bgCircle.setAttribute("fill", options.bgCircle.fill);
      bgCircle.setAttribute("stroke", options.bgCircle.stroke);
      bgCircle.setAttribute("stroke-width", options.bgCircle.strokeWidth);
      bgCircle.style.pointerEvents = "none";
    }

    return { label, bgCircle };
  };

  /**
   * Render month circle (days 1-31)
   */
  private renderMonthCircle = (
    group: SVGElement,
    state: ZoomState
  ): SVGElement => {
    const centerX = 0;
    const centerY = 0;
    const radius = 320;

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

    // Store label data for rendering in separate layer
    const labelData: Array<{
      day: number;
      x: number;
      y: number;
      isCurrent: boolean;
      scale: number;
    }> = [];

    // Draw days - first pass: create sectors only
    for (let day = 1; day <= monthDaysCount; day++) {
      const baseAngle =
        ((day - 1) / monthDaysCount) * Math.PI * 2 - Math.PI / 2;
      const angle = this.applyDirectionMirroring(baseAngle);
      const baseDayAngle = (day / monthDaysCount) * Math.PI * 2 - Math.PI / 2;
      const dayAngle = this.applyDirectionMirroring(baseDayAngle);
      const startAngle = angle - Math.PI / monthDaysCount;
      const endAngle = angle + Math.PI / monthDaysCount;

      // Check if Sunday
      const dayDate = new Date(year, month, day);
      const isSunday = dayDate.getDay() === 0;

      // Check if current day
      const isCurrent = isCurrentMonth && day === currentDay;

      // Calculate scale based on hover
      const scaleValue = this.hoveredDay === day ? 1.5 : 1;

      // Create a group for this sector with transform origin at center
      const sectorGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      const midAngle = (startAngle + endAngle) / 2;
      const midRadius = (radius * 0.7 + radius) / 2;
      const transformOriginX = centerX + Math.cos(midAngle) * midRadius;
      const transformOriginY = centerY + Math.sin(midAngle) * midRadius;

      // Apply smooth CSS transition for scale transform (fast and fluid)
      sectorGroup.style.transition =
        "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      sectorGroup.style.transformOrigin = `${transformOriginX}px ${transformOriginY}px`;
      sectorGroup.style.transform = `scale(${scaleValue})`;
      sectorGroup.setAttribute("data-day", String(day));
      sectorGroup.setAttribute("data-hover-type", "day");

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
        radius, // Always base radius, scale via transform
        startAngle,
        endAngle,
        fillColor
      );

      sector.classList.add("sector", "day-sector");
      sector.setAttribute("data-day", String(day));
      if (isCurrent) {
        sector.classList.add("current");
        sector.setAttribute("data-current", "true");
        // Much more visible stroke for current day
        sector.setAttribute("stroke", "rgba(100, 200, 255, 1)");
        sector.setAttribute("stroke-width", "4");
        // Add a filter for glow effect
        const filterId = "current-day-glow-month";
        let filter = this.svg.querySelector(`#${filterId}`) as SVGFilterElement;
        if (!filter && this.svg) {
          filter = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "filter"
          );
          filter.setAttribute("id", filterId);
          const feGaussianBlur = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "feGaussianBlur"
          );
          feGaussianBlur.setAttribute("stdDeviation", "4");
          feGaussianBlur.setAttribute("result", "coloredBlur");
          const feMerge = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "feMerge"
          );
          const feMergeNode1 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "feMergeNode"
          );
          feMergeNode1.setAttribute("in", "coloredBlur");
          const feMergeNode2 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "feMergeNode"
          );
          feMergeNode2.setAttribute("in", "SourceGraphic");
          feMerge.appendChild(feMergeNode1);
          feMerge.appendChild(feMergeNode2);
          filter.appendChild(feGaussianBlur);
          filter.appendChild(feMerge);
          // Get or create defs element in the SVG
          let defs = this.svg.querySelector("defs");
          if (!defs) {
            defs = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "defs"
            );
            this.svg.insertBefore(defs, this.svg.firstChild);
          }
          defs.appendChild(filter);
        }
        if (filter) {
          sector.setAttribute("filter", `url(#${filterId})`);
        }
      }
      // Click handler - zoom to week or day based on wheel
      let wheelDelta = 0;
      let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
      sector.addEventListener("wheel", (e) => {
        e.preventDefault();

        // Reset timeout on each wheel event
        if (wheelTimeout) {
          clearTimeout(wheelTimeout);
        }

        // Accumulate delta (positive = scroll down = zoom in, negative = scroll up = zoom out)
        wheelDelta += e.deltaY;

        // Set timeout to reset wheelDelta after wheel stops
        wheelTimeout = setTimeout(() => {
          wheelDelta = 0;
        }, 200);

        if (Math.abs(wheelDelta) >= 100) {
          if (wheelDelta < 0) {
            // Scroll up (negative) = zoom out - go to month
            this.navigateToLevel("month", { month });
          } else {
            // Scroll down (positive) = zoom in - go to day
            this.navigateToLevel("day", { day });
          }
          wheelDelta = 0;
          if (wheelTimeout) {
            clearTimeout(wheelTimeout);
            wheelTimeout = null;
          }
        } else if (Math.abs(wheelDelta) >= 30) {
          if (wheelDelta < 0) {
            // Scroll up = zoom out - stay at month level
            wheelDelta = 0; // Reset to prevent further actions
          } else {
            // Scroll down = zoom in - go to week
            const week = this.getWeekForDay(year, month, day);
            this.navigateToLevel("week", { week });
          }
          wheelDelta = 0;
          if (wheelTimeout) {
            clearTimeout(wheelTimeout);
            wheelTimeout = null;
          }
        }
      });

      sector.addEventListener("click", () => {
        // Default: go to week
        const week = this.getWeekForDay(year, month, day);
        this.navigateToLevel("week", { week });
      });

      // Add hover handlers
      sector.addEventListener("mouseenter", () => {
        this.hoveredDay = day;
        if (this.currentState.level === "month" && !this.animating) {
          this.updateDayScales();
          // Move hovered sector group to end so it renders on top
          const parent = sectorGroup.parentElement;
          if (parent) {
            parent.appendChild(sectorGroup);
          }
        }
      });

      sector.addEventListener("mouseleave", () => {
        this.hoveredDay = null;
        if (this.currentState.level === "month" && !this.animating) {
          this.updateDayScales();
        }
      });

      // Add sector to group
      sectorGroup.appendChild(sector);

      // Append sector group to main group (labels will be added separately)
      group.appendChild(sectorGroup);

      // Store label data for rendering in separate layer (after all sectors)
      const labelRadius = radius * 0.88;
      const labelX = centerX + Math.cos(dayAngle) * labelRadius;
      const labelY = centerY + Math.sin(dayAngle) * labelRadius;
      labelData.push({
        day,
        x: labelX,
        y: labelY,
        isCurrent,
        scale: scaleValue,
      });
    }

    // Second pass: render all labels in a separate layer (always on top, no occlusion)
    const labelsGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    labelsGroup.classList.add("labels-layer");

    labelData.forEach(({ day, x, y, isCurrent }) => {
      // Create label with consistent styling (using CSS classes)
      const { label, bgCircle } = this.createLabel(x, y, String(day), {
        fontSize: isCurrent ? "40px" : "32px",
        fill: "#ffffff",
        stroke: "#000000",
        strokeWidth: "2",
        className: "day-label",
        isCurrent,
        bgCircle: {
          radius: isCurrent ? 24 : 20,
          fill: isCurrent ? "rgba(100, 200, 255, 0.9)" : "rgba(0, 0, 0, 0.75)",
          stroke: isCurrent
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(255, 255, 255, 0.5)",
          strokeWidth: isCurrent ? "2" : "1",
        },
      });

      // Use CSS classes for styling - labels stay fixed size (no scaling) to avoid occlusion
      label.classList.add("label-scalable", "day-label");
      label.setAttribute("data-day", String(day));
      // CRITICAL: Set explicit position and ensure label is always visible
      // Don't use transforms on labels - they cause issues with visibility
      label.style.transform = "none";
      label.style.visibility = "visible";
      label.style.opacity = "1";
      label.style.display = "block";

      if (bgCircle) {
        bgCircle.classList.add("label-scalable");
        bgCircle.setAttribute("data-day", String(day));
        bgCircle.style.transform = "none";
        bgCircle.style.visibility = "visible";
        bgCircle.style.opacity = "1";
        bgCircle.style.display = "block";
        labelsGroup.appendChild(bgCircle);
      }
      labelsGroup.appendChild(label);
    });

    // Add labels group AFTER all sectors so labels are always on top
    group.appendChild(labelsGroup);

    // Add arrow indicator for current day
    if (isCurrentMonth) {
      // Calculate angle for current day - point to CENTER of sector
      // baseAngle = (day-1)/total gives START of sector
      // Sectors span from (angle - halfSector) to (angle + halfSector)
      // So CENTER is at START + halfSector = (day - 1 + 0.5)/total = (day - 0.5)/total
      const totalItems = monthDaysCount;
      const baseDayAngle =
        ((currentDay - 0.5) / totalItems) * Math.PI * 2 - Math.PI / 2;
      // Apply same mirroring as sectors use
      const angle = this.applyDirectionMirroring(baseDayAngle);
      const arrow = this.createCurrentIndicatorArrow(
        centerX,
        centerY,
        angle,
        radius,
        {
          size: 35,
          color: "#64c8ff",
          pulseAnimation: true,
        }
      );
      group.appendChild(arrow);
    }

    // Draw events in center
    if (monthEvents.length > 0) {
      const eventsGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      monthEvents.forEach((event, index) => {
        const eventText = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        eventText.setAttribute("x", String(centerX));
        eventText.setAttribute("y", String(centerY - 60 + index * 20));
        eventText.setAttribute("text-anchor", "middle");
        eventText.setAttribute("dominant-baseline", "middle");
        eventText.classList.add("event-text");
        eventText.textContent = event.summary.substring(0, 30);

        eventsGroup.appendChild(eventText);
      });
      group.appendChild(eventsGroup);
    }

    // Draw period text in center (month name and dates)
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const periodText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    periodText.setAttribute("x", String(centerX));
    periodText.setAttribute("y", String(centerY + 80));
    periodText.setAttribute("text-anchor", "middle");
    periodText.setAttribute("dominant-baseline", "middle");
    periodText.classList.add("period-text", "month");
    periodText.textContent = `${monthNames[month]} 1-${totalDaysInMonth}`;

    group.appendChild(periodText);

    return group;
  };

  /**
   * Render week circle (7 days, Sunday on top)
   */
  private renderWeekCircle = (
    group: SVGElement,
    state: ZoomState
  ): SVGElement => {
    const centerX = 0;
    const centerY = 0;
    const radius = 320;

    const week = state.week;
    const year = state.year;

    // Calculate week start date (Sunday)
    const weekStart = this.getWeekStartDate(year, week);

    // Get week events (first 4)
    const weekEvents = (this.eventsByWeek[week] || []).slice(0, 4);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Draw days
    for (let i = 0; i < 7; i++) {
      const baseAngle = (i / 7) * Math.PI * 2 - Math.PI / 2;
      const angle = this.applyDirectionMirroring(baseAngle);
      const startAngle = angle - Math.PI / 7;
      const endAngle = angle + Math.PI / 7;

      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const day = dayDate.getDate();
      const dayMonth = dayDate.getMonth();
      const dayYear = dayDate.getFullYear();

      // Check if current day
      const isCurrent =
        dayYear === currentYear &&
        dayMonth === currentMonth &&
        day === currentDay;

      // Calculate scale based on hover
      const scaleValue = this.hoveredWeekDay === i ? 1.5 : 1;

      // Create a group for this sector with transform origin at center
      const sectorGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      const midAngle = (startAngle + endAngle) / 2;
      const midRadius = (radius * 0.7 + radius) / 2;
      const transformOriginX = centerX + Math.cos(midAngle) * midRadius;
      const transformOriginY = centerY + Math.sin(midAngle) * midRadius;

      // Use CSS classes
      sectorGroup.classList.add("sector-group");
      // Use pixel values for transform origin (same as month circles) - this ensures correct scaling
      sectorGroup.style.transformOrigin = `${transformOriginX}px ${transformOriginY}px`;
      sectorGroup.style.transform = `scale(${scaleValue})`;
      sectorGroup.setAttribute("data-week-day", String(i));
      sectorGroup.setAttribute("data-hover-type", "week-day");

      // Draw day sector - use similar color scheme to year's
      // Color based on day index (i) to match year's pattern
      const fillColor = isCurrent
        ? `hsl(${(i * 51) % 360}, 80%, 50%)` // Brighter for current day
        : `hsl(${(i * 51) % 360}, 70%, 60%)`; // Similar to year's color scheme
      const sector = this.createSector(
        centerX,
        centerY,
        radius * 0.7,
        radius, // Always base radius, scale via transform
        startAngle,
        endAngle,
        fillColor
      );

      sector.classList.add("sector", "day-sector");
      sector.setAttribute("data-day", String(i));
      if (isCurrent) {
        sector.classList.add("current");
        sector.setAttribute("data-current", "true");
        sector.setAttribute("stroke", "rgba(100, 200, 255, 0.8)");
        sector.setAttribute("stroke-width", "2");
      }
      sector.style.cursor = "pointer";

      // Click handler - navigate to day circle (clock view)
      sector.addEventListener("click", () => {
        // Navigate to the day circle showing hours (clock view)
        this.navigateToLevel("day", {
          year: dayYear,
          month: dayMonth,
          day: day,
        });
      });

      // Add hover handlers
      sector.addEventListener("mouseenter", () => {
        this.hoveredWeekDay = i;
        if (this.currentState.level === "week" && !this.animating) {
          this.updateWeekDayScales();
          // Move hovered sector group to end so it renders on top
          const parent = sectorGroup.parentElement;
          if (parent) {
            parent.appendChild(sectorGroup);
          }
        }
      });

      sector.addEventListener("mouseleave", () => {
        this.hoveredWeekDay = null;
        if (this.currentState.level === "week" && !this.animating) {
          this.updateWeekDayScales();
        }
      });

      // Add sector to group
      sectorGroup.appendChild(sector);

      // Draw day label (inside the sector group so it scales with the sector)
      const labelRadius = radius * 0.85;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;

      // Use standardized label creation
      const { label } = this.createLabel(
        labelX,
        labelY,
        `${dayNames[i]}\n${day}`,
        {
          fontSize: isCurrent ? "24px" : "20px",
          fill: "#fff",
          className: "day-label",
          isCurrent,
        }
      );
      label.style.whiteSpace = "pre";

      // Add label to sector group so it scales with the sector
      sectorGroup.appendChild(label);

      // Append sector group to main group
      group.appendChild(sectorGroup);
    }

    // Add arrow indicator for current day in week
    const currentWeekDay = dayNames.findIndex((_, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      return (
        dayDate.getFullYear() === currentYear &&
        dayDate.getMonth() === currentMonth &&
        dayDate.getDate() === currentDay
      );
    });
    if (currentWeekDay !== -1) {
      // Calculate angle - week view doesn't use CircleRenderer but should use same formula
      // (index / totalItems) * 2π - π/2 where currentWeekDay is already 0-based index
      const baseAngle = (currentWeekDay / 7) * Math.PI * 2 - Math.PI / 2;
      const angle = this.applyDirectionMirroring(baseAngle);
      const arrow = this.createCurrentIndicatorArrow(
        centerX,
        centerY,
        angle,
        radius,
        {
          size: 35,
          color: "#64c8ff",
          pulseAnimation: true,
        }
      );
      group.appendChild(arrow);
    }

    // Draw events in center
    if (weekEvents.length > 0) {
      const eventsGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      weekEvents.forEach((event, index) => {
        const eventText = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        eventText.setAttribute("x", String(centerX));
        eventText.setAttribute("y", String(centerY - 60 + index * 20));
        eventText.setAttribute("text-anchor", "middle");
        eventText.setAttribute("dominant-baseline", "middle");
        eventText.classList.add("event-text");
        eventText.textContent = event.summary.substring(0, 30);

        eventsGroup.appendChild(eventText);
      });
      group.appendChild(eventsGroup);
    }

    // Draw period text in center (week number and date range)
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const monthNamesShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const startDay = weekStart.getDate();
    const startMonthName = monthNamesShort[weekStart.getMonth()];
    const endDay = weekEndDate.getDate();
    const endMonthName = monthNamesShort[weekEndDate.getMonth()];
    // Create text element with two lines using tspan
    const periodText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    periodText.setAttribute("x", String(centerX));
    periodText.setAttribute("y", String(centerY + 60));
    periodText.setAttribute("text-anchor", "middle");
    periodText.setAttribute("dominant-baseline", "middle");
    periodText.classList.add("period-text", "week");

    // First line: Week number
    const tspan1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan"
    );
    tspan1.setAttribute("x", String(centerX));
    tspan1.setAttribute("dy", "0");
    tspan1.textContent = `Week ${week + 1}`;
    periodText.appendChild(tspan1);

    // Second line: Date range
    const tspan2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan"
    );
    tspan2.setAttribute("x", String(centerX));
    tspan2.setAttribute("dy", "1.2em"); // Line spacing
    if (startMonthName === endMonthName) {
      tspan2.textContent = `${startDay}-${endDay} ${startMonthName}`;
    } else {
      tspan2.textContent = `${startDay} ${startMonthName} - ${endDay} ${endMonthName}`;
    }
    periodText.appendChild(tspan2);

    group.appendChild(periodText);

    return group;
  };

  /**
   * Render day circle (12-hour clock)
   */
  private renderDayCircle = (
    group: SVGElement,
    state: ZoomState
  ): SVGElement => {
    const centerX = 0;
    const centerY = 0;
    const radius = 320;

    const year = state.year;
    const month = state.month;
    const day = state.day;

    const dayKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const dayEvents = (this.eventsByDay[dayKey] || []).slice(0, 4);

    // Get current date and time
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentHour12 = now.getHours() % 12 || 12; // Convert to 12-hour format (1-12)
    const isCurrentDay =
      year === currentYear && month === currentMonth && day === currentDay;

    // Draw hours (12-hour clock, 12 at top)
    for (let hour = 1; hour <= 12; hour++) {
      const baseAngle = ((hour - 3) / 12) * Math.PI * 2; // 12 at top
      const angle = this.applyDirectionMirroring(baseAngle);
      const startAngle = angle - Math.PI / 12;
      const endAngle = angle + Math.PI / 12;

      // Check if current hour
      const isCurrent = isCurrentDay && hour === currentHour12;

      // Calculate scale based on hover
      const scaleValue = this.hoveredHour === hour ? 1.5 : 1;

      // Create a group for this sector with transform origin at center
      const sectorGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      const midAngle = (startAngle + endAngle) / 2;
      const midRadius = (radius * 0.7 + radius) / 2;
      const transformOriginX = centerX + Math.cos(midAngle) * midRadius;
      const transformOriginY = centerY + Math.sin(midAngle) * midRadius;

      // Use CSS classes
      sectorGroup.classList.add("sector-group");
      // Use pixel values for transform origin (same as month circles) - this ensures correct scaling
      sectorGroup.style.transformOrigin = `${transformOriginX}px ${transformOriginY}px`;
      sectorGroup.style.transform = `scale(${scaleValue})`;
      sectorGroup.setAttribute("data-hour", String(hour));
      sectorGroup.setAttribute("data-hover-type", "hour");

      // Draw hour sector - use similar color scheme to year's
      const fillColor = isCurrent
        ? `hsl(${(hour * 30) % 360}, 80%, 50%)` // Brighter for current hour
        : `hsl(${(hour * 30) % 360}, 70%, 60%)`; // Similar to year's color scheme
      const sector = this.createSector(
        centerX,
        centerY,
        radius * 0.7,
        radius, // Always base radius, scale via transform
        startAngle,
        endAngle,
        fillColor
      );

      sector.classList.add("sector", "hour-sector");
      sector.setAttribute("data-hour", String(hour));
      if (isCurrent) {
        sector.classList.add("current");
        sector.setAttribute("data-current", "true");
        sector.setAttribute("stroke", "rgba(100, 200, 255, 0.8)");
        sector.setAttribute("stroke-width", "2");
      }
      // Pointer events handled by CSS class

      // Add hover handlers
      sector.addEventListener("mouseenter", () => {
        this.hoveredHour = hour;
        if (this.currentState.level === "day" && !this.animating) {
          this.updateHourScales();
          // Move hovered sector group to end so it renders on top
          const parent = sectorGroup.parentElement;
          if (parent) {
            parent.appendChild(sectorGroup);
          }
        }
      });

      sector.addEventListener("mouseleave", () => {
        this.hoveredHour = null;
        if (this.currentState.level === "day" && !this.animating) {
          this.updateHourScales();
        }
      });

      // Add sector to group
      sectorGroup.appendChild(sector);

      // Draw hour label (inside the sector group so it scales with the sector)
      const labelRadius = radius * 0.85;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;

      // Use standardized label creation
      const { label } = this.createLabel(labelX, labelY, String(hour), {
        fontSize: isCurrent ? "28px" : "24px",
        fill: isCurrent ? "#64c8ff" : "#fff",
        className: "hour-label",
        isCurrent,
      });

      // Add label to sector group so it scales with the sector
      sectorGroup.appendChild(label);

      // Append sector group to main group
      group.appendChild(sectorGroup);
    }

    // Add arrow indicator for current hour
    if (isCurrentDay) {
      // Calculate angle for current hour - must use same formula as other views
      // currentHour12 is 1-12, so convert to 0-based index (12->0, 1->1, 2->2, ..., 11->11)
      // Then adjust by -3 to put 12 at top (-π/2) instead of 0 at top
      const hourIndex = currentHour12 === 12 ? 0 : currentHour12;
      const baseAngle = ((hourIndex - 3) / 12) * Math.PI * 2; // Shift by 3 to put 12 at top
      const angle = this.applyDirectionMirroring(baseAngle);
      const arrow = this.createCurrentIndicatorArrow(
        centerX,
        centerY,
        angle,
        radius,
        {
          size: 35,
          color: "#64c8ff",
          pulseAnimation: true,
        }
      );
      group.appendChild(arrow);
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

      const dot = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      dot.setAttribute("cx", String(dotX));
      dot.setAttribute("cy", String(dotY));
      dot.setAttribute("r", String(dotRadius));
      dot.setAttribute("fill", isPM ? "#ff6464" : "#4a9eff");
      dot.setAttribute("class", "event-dot");
      dot.style.cursor = "pointer";

      // Tooltip
      dot.setAttribute("title", event.summary);

      // Click handler
      dot.addEventListener("click", () => {
        // Could show event details here
      });

      group.appendChild(dot);
    });

    // Draw events list in center
    if (dayEvents.length > 0) {
      const eventsGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      dayEvents.forEach((event, index) => {
        const eventText = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        eventText.setAttribute("x", String(centerX));
        eventText.setAttribute("y", String(centerY - 60 + index * 20));
        eventText.setAttribute("text-anchor", "middle");
        eventText.setAttribute("dominant-baseline", "middle");
        eventText.classList.add("event-text");
        eventText.textContent = event.summary.substring(0, 30);

        eventsGroup.appendChild(eventText);
      });
      group.appendChild(eventsGroup);
    }

    // Draw period text in center (date)
    const monthNamesShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const periodText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    periodText.setAttribute("x", String(centerX));
    periodText.setAttribute("y", String(centerY + 80));
    periodText.setAttribute("text-anchor", "middle");
    periodText.setAttribute("dominant-baseline", "middle");
    periodText.classList.add("period-text", "day");
    periodText.textContent = `${monthNamesShort[month]} ${day}, ${year}`;

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
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

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
      `A ${outerRadius.toFixed(2)} ${outerRadius.toFixed(
        2
      )} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
      `A ${innerRadius.toFixed(2)} ${innerRadius.toFixed(
        2
      )} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
      "Z",
    ].join(" ");

    path.setAttribute("d", d);
    path.setAttribute("fill", fill);
    path.setAttribute("stroke", "rgba(255, 255, 255, 0.2)");
    path.setAttribute("stroke-width", "1");
    path.setAttribute("shape-rendering", "geometricPrecision"); // Smooth rendering
    path.setAttribute("vector-effect", "non-scaling-stroke"); // Keep stroke consistent

    return path;
  };

  /**
   * Get week number for a day (0-51, Sunday-based weeks)
   *
   * This method calculates which week a given date falls into, using Sunday as the
   * first day of the week. Week 0 starts on the first Sunday on or before January 1st.
   *
   * @param year - The year
   * @param month - The month (0-11)
   * @param day - The day (1-31)
   * @returns Week number (0-51)
   */
  private getWeekForDay = (
    year: number,
    month: number,
    day: number
  ): number => {
    const date = new Date(year, month, day);

    // Find the Sunday of the week containing this date
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const sundayOfWeek = new Date(date);
    sundayOfWeek.setDate(date.getDate() - dayOfWeek);

    // Find the first Sunday on or before January 1st of this year
    const startOfYear = new Date(year, 0, 1);
    const startDayOfWeek = startOfYear.getDay();
    const firstSunday = new Date(startOfYear);
    firstSunday.setDate(1 - startDayOfWeek);

    // Calculate the number of weeks between first Sunday and the Sunday of our date
    const diffInMs = sundayOfWeek.getTime() - firstSunday.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffInDays / 7);

    // Clamp to valid range (0-51)
    return Math.max(0, Math.min(51, weekNumber));
  };

  /**
   * Get week start date (Sunday) for a given week number
   * Uses the same logic as getWeekForDay to ensure consistency:
   * Week 0 starts on the Sunday on or before January 1st
   */
  private getWeekStartDate = (year: number, week: number): Date => {
    // Find the first Sunday on or before January 1st of this year
    const startOfYear = new Date(year, 0, 1);
    const startDayOfWeek = startOfYear.getDay();
    const firstSunday = new Date(startOfYear);
    firstSunday.setDate(1 - startDayOfWeek);

    // Add the appropriate number of weeks
    const weekStart = new Date(firstSunday);
    weekStart.setDate(firstSunday.getDate() + week * 7);

    return weekStart;
  };

  /**
   * Check if navigation is going backwards
   */
  private isGoingBackwards = (
    oldLevel: ZoomLevel,
    newLevel: ZoomLevel
  ): boolean => {
    const levelOrder: ZoomLevel[] = ["year", "month", "week", "day"];
    const oldIndex = levelOrder.indexOf(oldLevel);
    const newIndex = levelOrder.indexOf(newLevel);
    return oldIndex > newIndex;
  };

  /**
   * Handle back button
   */
  private handleBack = (): void => {
    const state = this.currentState;

    if (state.level === "day") {
      this.navigateToLevel("week", { week: state.week });
    } else if (state.level === "week") {
      this.navigateToLevel("month", { month: state.month });
    } else if (state.level === "month") {
      this.navigateToLevel("year", {});
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
      console.error("[ZoomMode] SVG element not found in render()!");
      return;
    }

    // Clear SVG but preserve defs element for filters
    const existingDefs = this.svg.querySelector("defs");
    // Remove all children except defs
    while (this.svg.firstChild) {
      if (this.svg.firstChild !== existingDefs) {
        this.svg.removeChild(this.svg.firstChild);
      } else {
        // Skip defs, move to next
        const next = this.svg.firstChild.nextSibling;
        if (!next) break;
        this.svg.removeChild(this.svg.firstChild);
        if (next === existingDefs) continue;
        this.svg.removeChild(next);
      }
    }
    // Ensure defs exists
    if (!existingDefs) {
      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
      );
      this.svg.insertBefore(defs, this.svg.firstChild);
    } else if (!this.svg.contains(existingDefs)) {
      this.svg.insertBefore(existingDefs, this.svg.firstChild);
    }

    // Render current circle
    const circle = this.renderCircle(this.currentState, 1);
    if (circle) {
      // For month level, always use center (not the month position)
      const center =
        this.currentState.level === "month"
          ? this.getCircleTargetCenter(this.currentState)
          : this.getCircleCenter(this.currentState);
      const scale = this.getCircleScale(this.currentState);

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute(
        "transform",
        `translate(${center.x}, ${center.y}) scale(${scale})`
      );
      group.style.pointerEvents = "auto"; // Ensure pointer events work through groups
      group.appendChild(circle);
      this.svg.appendChild(group);
    } else {
      console.error("[ZoomMode] renderCircle returned null!");
    }

    // Update back button visibility and text
    if (this.backButton) {
      if (this.currentState.level === "year") {
        this.backButton.classList.add("hidden");
      } else {
        this.backButton.classList.remove("hidden");
        // Format: "← [month number]" or "← [date]" instead of "zoom out to"
        const state = this.currentState;
        let buttonText = "←";
        if (state.level === "month") {
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          buttonText = `← ${state.month + 1} ${monthNames[state.month]}`;
        } else if (state.level === "week") {
          const weekStart = this.getWeekStartDate(state.year, state.week);
          const monthNamesShort = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          buttonText = `← ${weekStart.getDate()} ${
            monthNamesShort[weekStart.getMonth()]
          }`;
        } else if (state.level === "day") {
          const monthNamesShort = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          buttonText = `← ${state.day} ${monthNamesShort[state.month]}`;
        }
        this.backButton.innerHTML = buttonText;
        this.backButton.setAttribute("aria-label", buttonText);
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
   * Get current zoom state (for swipe navigation)
   */
  getCurrentState = (): ZoomState => {
    return { ...this.currentState };
  };

  /**
   * Set callback for state changes (for persistence)
   */
  setOnStateChange = (callback: (state: ZoomState) => void): void => {
    this.onStateChange = callback;
  };

  /**
   * Toggle rotation direction (CW/CCW)
   *
   * @returns The new direction value (1 = CW, -1 = CCW)
   */
  toggleDirection = (): number => {
    this.direction = this.direction === 1 ? -1 : 1;
    this.render(); // Re-render to apply new direction
    return this.direction;
  };

  /**
   * Get current rotation direction
   *
   * @returns The current direction value (1 = CW, -1 = CCW)
   */
  getDirection = (): number => {
    return this.direction;
  };

  /**
   * Set rotation direction
   *
   * @param direction - The direction to set (1 = CW, -1 = CCW)
   */
  setDirection = (direction: number): void => {
    this.direction = direction;
    if (!this.animating) {
      this.render(); // Re-render to apply new direction
    }
  };

  /**
   * Shift seasons (rotate year view by 90 degrees / 3 months)
   *
   * @returns The new rotation offset
   */
  shiftSeasons = (): number => {
    this.rotationOffset = (this.rotationOffset + 90) % 360;
    if (!this.animating) {
      this.render(); // Re-render to apply new offset
    }
    return this.rotationOffset;
  };

  /**
   * Set rotation offset
   *
   * @param offset - The rotation offset in degrees
   */
  setRotationOffset = (offset: number): void => {
    this.rotationOffset = offset;
    if (!this.animating) {
      this.render();
    }
  };

  /**
   * Apply direction mirroring to an angle
   * When direction is CCW (-1), mirror the angle around the vertical axis
   *
   * @param angle - The angle in radians
   * @returns The mirrored angle if CCW, or the original angle if CW
   */
  private applyDirectionMirroring = (angle: number): number => {
    return this.direction === -1 ? Math.PI - angle : angle;
  };

  /**
   * Navigate to previous period (year/month/week/day based on current level)
   */
  navigatePrev = (): void => {
    const state = this.currentState;

    if (state.level === "year") {
      // Navigate to previous year
      this.currentState.year--;
      this.updateEvents(this.eventsByWeek);
      this.render();
    } else if (state.level === "month") {
      // Navigate to previous month
      if (state.month === 0) {
        this.currentState.month = 11;
        this.currentState.year--;
      } else {
        this.currentState.month--;
      }
      this.navigateToLevel("month", {
        month: this.currentState.month,
        year: this.currentState.year,
      });
    } else if (state.level === "week") {
      // Navigate to previous week
      if (state.week === 0) {
        this.currentState.week = 51;
        this.currentState.year--;
      } else {
        this.currentState.week--;
      }
      this.navigateToLevel("week", {
        week: this.currentState.week,
        year: this.currentState.year,
      });
    } else if (state.level === "day") {
      // Navigate to previous day
      const currentDate = new Date(state.year, state.month, state.day);
      currentDate.setDate(currentDate.getDate() - 1);
      this.currentState.year = currentDate.getFullYear();
      this.currentState.month = currentDate.getMonth();
      this.currentState.day = currentDate.getDate();
      this.currentState.week = this.getWeekForDay(
        this.currentState.year,
        this.currentState.month,
        this.currentState.day
      );
      this.navigateToLevel("day", {
        year: this.currentState.year,
        month: this.currentState.month,
        day: this.currentState.day,
      });
    }
  };

  /**
   * Navigate to next period (year/month/week/day based on current level)
   */
  navigateNext = (): void => {
    const state = this.currentState;

    if (state.level === "year") {
      // Navigate to next year
      this.currentState.year++;
      this.updateEvents(this.eventsByWeek);
      this.render();
    } else if (state.level === "month") {
      // Navigate to next month
      if (state.month === 11) {
        this.currentState.month = 0;
        this.currentState.year++;
      } else {
        this.currentState.month++;
      }
      this.navigateToLevel("month", {
        month: this.currentState.month,
        year: this.currentState.year,
      });
    } else if (state.level === "week") {
      // Navigate to next week
      if (state.week === 51) {
        this.currentState.week = 0;
        this.currentState.year++;
      } else {
        this.currentState.week++;
      }
      this.navigateToLevel("week", {
        week: this.currentState.week,
        year: this.currentState.year,
      });
    } else if (state.level === "day") {
      // Navigate to next day
      const currentDate = new Date(state.year, state.month, state.day);
      currentDate.setDate(currentDate.getDate() + 1);
      this.currentState.year = currentDate.getFullYear();
      this.currentState.month = currentDate.getMonth();
      this.currentState.day = currentDate.getDate();
      this.currentState.week = this.getWeekForDay(
        this.currentState.year,
        this.currentState.month,
        this.currentState.day
      );
      this.navigateToLevel("day", {
        year: this.currentState.year,
        month: this.currentState.month,
        day: this.currentState.day,
      });
    }
  };

  /**
   * Destroy and cleanup
   */
  destroy = (): void => {
    // Cleanup event listeners
    if (this.backButton) {
      this.backButton.removeEventListener("click", this.handleBack);
    }

    // Clear container
    this.container.innerHTML = "";
  };
}
