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

import type { CalendarEvent, Direction } from "../types";
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
  private direction: Direction = 1;

  // Rotation offset (for shifting months in year view)
  private rotationOffset: number = 0;

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
    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    this.svg.setAttribute("shape-rendering", "geometricPrecision");
    this.svg.classList.add("zoom-mode-svg");

    // Use event delegation on SVG for clicks
    const handleClick = (e: MouseEvent | TouchEvent): void => {
      let target = e.target as SVGElement;
      let depth = 0;
      while (target && target !== this.svg && depth < 10) {
        if (target.hasAttribute && target.hasAttribute("data-month")) {
          const monthIndex = parseInt(target.getAttribute("data-month") || "0", 10);
          e.stopPropagation();
          e.preventDefault();
          this.navigateToLevel("month", { month: monthIndex });
          return;
        }
        const parent = target.parentElement || target.parentNode;
        if (!parent || parent === this.svg) break;
        target = parent as SVGElement;
        depth++;
      }
    };

    this.svg.addEventListener("click", handleClick, true);

    // Handle pinch zoom
    let initialDistance = 0;
    let lastScale = 1;
    let isPinching = false;

    this.svg.addEventListener("touchstart", (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        lastScale = 1;
      } else {
        isPinching = false;
      }
    }, { passive: false });

    this.svg.addEventListener("touchmove", (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const scale = currentDistance / initialDistance;
        const scaleChange = scale / lastScale;
        lastScale = scale;

        if (scaleChange > 1.2) {
          const state = this.currentState;
          if (state.level === "year") this.navigateToLevel("month", { month: 0 });
          else if (state.level === "month") this.navigateToLevel("week", { week: 0 });
          else if (state.level === "week") this.navigateToLevel("day", { day: 1 });
          isPinching = false;
        } else if (scaleChange < 0.8) {
          this.handleBack();
          isPinching = false;
        }
      }
    }, { passive: false });

    this.svg.addEventListener("touchend", () => {
      isPinching = false;
      initialDistance = 0;
      lastScale = 1;
    }, { passive: false });

    // Global wheel event handler
    let globalWheelDelta = 0;
    let globalWheelTimeout: ReturnType<typeof setTimeout> | null = null;

    this.svg.addEventListener("wheel", (e: WheelEvent) => {
      const target = e.target as SVGElement;
      if (target.hasAttribute && (
        target.hasAttribute("data-day") ||
        target.hasAttribute("data-month") ||
        target.hasAttribute("data-week-day") ||
        target.hasAttribute("data-hour") ||
        target.hasAttribute("data-index")
      )) {
        return;
      }

      e.preventDefault();
      if (globalWheelTimeout) clearTimeout(globalWheelTimeout);
      globalWheelDelta += e.deltaY;
      globalWheelTimeout = setTimeout(() => { globalWheelDelta = 0; }, 200);

      const state = this.currentState;
      if (Math.abs(globalWheelDelta) >= 100) {
        if (globalWheelDelta < 0) {
          this.handleBack();
        } else {
          if (state.level === "year") {
            const now = new Date();
            this.navigateToLevel("month", { month: now.getMonth() });
          } else if (state.level === "month") {
            const now = new Date();
            const week = this.getWeekForDay(state.year, state.month, now.getDate());
            this.navigateToLevel("week", { week });
          } else if (state.level === "week") {
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
    }, { passive: false });

    this.container.appendChild(this.svg);
    this.container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: auto;
    `;
  };

  /**
   * Initialize back button
   */
  private initializeBackButton = (): void => {
    this.backButton = createElement("button", [
      "btn", "primary", "absolute", "bottom-4", "left-1/2", "-translate-x-1/2", "z-50", "hidden",
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
      if (e.key === "Escape" || e.key === "Esc") {
        if (this.currentState.level !== "year") {
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
    this.eventsByYear = {};
    this.eventsByDay = {};
    const currentYear = this.currentState.year;
    this.eventsByYear[currentYear] = {};
    for (let i = 0; i < 12; i++) this.eventsByYear[currentYear][i] = [];

    Object.values(eventsByWeek).forEach((weekEvents) => {
      weekEvents.forEach((event) => {
        if (!event.start) return;
        const eventDate = new Date(event.start);
        const year = eventDate.getFullYear();
        const month = eventDate.getMonth();
        const dayKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`;

        if (year === currentYear) {
          if (!this.eventsByYear[year][month]) this.eventsByYear[year][month] = [];
          this.eventsByYear[year][month].push(event);
        }
        if (!this.eventsByDay[dayKey]) this.eventsByDay[dayKey] = [];
        this.eventsByDay[dayKey].push(event);
      });
    });

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
    if (this.animating) this.animating = false;
    const oldState = { ...this.currentState };
    this.currentState.level = level;
    if (params.year !== undefined) this.currentState.year = params.year;
    if (params.month !== undefined) this.currentState.month = params.month;
    if (params.week !== undefined) this.currentState.week = params.week;
    if (params.day !== undefined) this.currentState.day = params.day;

    if (pushState) this.updateURLHash();
    if (this.onStateChange) this.onStateChange(this.currentState);
    this.animateTransition(oldState, this.currentState);
  };

  private updateURLHash = (): void => {
    const state = this.currentState;
    let hash = "#zoom";
    if (state.level === "month") hash += `/month/${state.year}/${state.month}`;
    else if (state.level === "week") hash += `/week/${state.year}/${state.week}`;
    else if (state.level === "day") hash += `/day/${state.year}/${state.month + 1}/${state.day}`;
    else hash += `/year/${state.year}`;
    window.history.pushState({ zoomLevel: state.level, params: state }, "", hash);
  };

  private animateTransition = (oldState: ZoomState, newState: ZoomState): void => {
    if (oldState.level === newState.level) {
      this.render();
      return;
    }
    this.animating = true;
    this.animationStartTime = Date.now();
    const isGoingBackwards = this.isGoingBackwards(oldState.level, newState.level);
    let oldCenter: { x: number; y: number };
    if (oldState.level === "month" || (isGoingBackwards && oldState.level !== "year")) {
      oldCenter = this.getCircleTargetCenter(oldState);
    } else {
      oldCenter = this.getCircleCenter(oldState);
    }

    const animate = () => {
      if (!this.animating) return;
      const elapsed = Date.now() - this.animationStartTime;
      const progress = Math.min(elapsed / this.animationDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      this.renderTransition(oldState, newState, oldCenter, eased);
      if (progress < 1) requestAnimationFrame(animate);
      else {
        this.animating = false;
        setTimeout(() => { this.render(); }, 50);
      }
    };
    requestAnimationFrame(animate);
  };

  private renderTransition = (
    oldState: ZoomState, newState: ZoomState, oldCenter: { x: number; y: number }, progress: number
  ): void => {
    this.svg.innerHTML = "";
    this.svg.style.pointerEvents = "auto";
    const newCenterStart = this.getCircleCenter(newState);
    let newCenterTarget: { x: number; y: number } = newState.level === "month" ? this.getCircleTargetCenter(newState) : newCenterStart;
    const isZoomingIn = this.getZoomLevelDepth(newState.level) > this.getZoomLevelDepth(oldState.level);
    let positionProgress: number, scaleProgress: number;
    if (isZoomingIn) {
      positionProgress = Math.min(progress * 2, 1);
      scaleProgress = Math.max((progress - 0.5) * 2, 0);
    } else {
      scaleProgress = Math.min(progress * 2, 1);
      positionProgress = Math.max((progress - 0.5) * 2, 0);
    }
    const currentCenterX = oldCenter.x + (newCenterTarget.x - oldCenter.x) * positionProgress;
    const currentCenterY = oldCenter.y + (newCenterTarget.y - oldCenter.y) * positionProgress;
    const oldScale = this.getCircleScale(oldState);
    const newScale = this.getCircleScale(newState);
    const currentScale = oldScale + (newScale - oldScale) * scaleProgress;
    const oldOpacity = 1 - progress;
    const newOpacity = progress;

    if (progress < 0.8) {
      const oldCircle = this.renderCircle(oldState, oldOpacity);
      if (oldCircle) {
        const oldGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        oldGroup.setAttribute("transform", `translate(${oldCenter.x}, ${oldCenter.y}) scale(${oldScale * (1 + progress * 2)})`);
        oldGroup.style.pointerEvents = "none";
        oldGroup.appendChild(oldCircle);
        this.svg.appendChild(oldGroup);
      }
    }
    if (progress > 0.1) {
      const newCircle = this.renderCircle(newState, newOpacity);
      if (newCircle) {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("transform", `translate(${currentCenterX}, ${currentCenterY}) scale(${currentScale})`);
        group.style.pointerEvents = "auto";
        group.appendChild(newCircle);
        this.svg.appendChild(group);
      }
    }
    if (progress >= 1) {
      setTimeout(() => { this.animating = false; this.render(); }, 10);
    }
  };

  private getCircleCenter = (_state: ZoomState): { x: number; y: number } => ({ x: 400, y: 400 });
  private getCircleTargetCenter = (_state: ZoomState): { x: number; y: number } => ({ x: 400, y: 400 });
  private getZoomLevelDepth = (level: ZoomLevel): number => {
    switch (level) {
      case "year": return 0;
      case "month": return 1;
      case "week": return 2;
      case "day": return 3;
    }
  };
  private getCircleScale = (state: ZoomState): number => {
    if (state.level === "year") return 1;
    if (state.level === "month") return 0.8;
    if (state.level === "week") return 0.9;
    return 0.95;
  };

  private renderCircle = (state: ZoomState, opacity: number = 1): SVGElement | null => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("opacity", String(opacity));
    group.style.pointerEvents = "auto";
    if (state.level === "year") return this.renderYearCircle(group, state);
    if (state.level === "month") return this.renderMonthCircle(group, state);
    if (state.level === "week") return this.renderWeekCircle(group, state);
    if (state.level === "day") return this.renderDayCircle(group, state);
    return null;
  };

  private renderYearCircle = (group: SVGElement, state: ZoomState): SVGElement => {
    const centerX = 0, centerY = 0, radius = 320;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date(), currentMonth = now.getMonth(), currentYear = now.getFullYear(), isCurrentYear = state.year === currentYear;
    const items: CircleItem[] = months.map((monthName, index) => ({
      index, label: monthName, value: index, isCurrent: isCurrentYear && index === currentMonth,
      events: this.eventsByYear[state.year]?.[index] || [],
    }));
    let wheelDelta = 0, wheelTimeout: ReturnType<typeof setTimeout> | null = null;

    this.circleRenderer.render(group, {
      centerX, centerY, radius, innerRadius: radius * 0.7, items,
      colorScheme: (item) => {
        const hue = (item.index * 30) % 360;
        return item.isCurrent ? `hsl(${hue}, 80%, 50%)` : `hsl(${hue}, 70%, 60%)`;
      },
      direction: this.direction, rotationOffset: this.rotationOffset,
      onItemClick: (item) => { this.navigateToLevel("month", { month: item.value }); },
      onItemWheel: (item, e) => {
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelDelta += e.deltaY;
        wheelTimeout = setTimeout(() => { wheelDelta = 0; }, 200);
        if (Math.abs(wheelDelta) >= 100) {
          if (wheelDelta > 0) this.navigateToLevel("month", { month: item.value });
          wheelDelta = 0;
          if (wheelTimeout) { clearTimeout(wheelTimeout); wheelTimeout = null; }
        }
      },
      onItemHover: () => {},
      renderCustomContent: (container, item, ctx) => {
        if (!item.events || item.events.length === 0) return;
        const dotCount = Math.min(item.events.length, 5);
        const dotRadiusBase = ctx.innerRadius + (ctx.outerRadius - ctx.innerRadius) * 0.25;
        const dotSpacing = 0.06;
        const dotsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        dotsGroup.classList.add("event-dots");
        const startAngle = ctx.midAngle - ((dotCount - 1) * dotSpacing) / 2;
        for (let i = 0; i < dotCount; i++) {
          const angle = startAngle + i * dotSpacing;
          const cx = ctx.centerX + Math.cos(angle) * dotRadiusBase, cy = ctx.centerY + Math.sin(angle) * dotRadiusBase;
          const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          dot.setAttribute("cx", String(cx)); dot.setAttribute("cy", String(cy)); dot.setAttribute("r", "3");
          dot.setAttribute("fill", "rgba(255, 255, 255, 0.7)"); dot.setAttribute("stroke", "none");
          dotsGroup.appendChild(dot);
        }
        container.appendChild(dotsGroup);
      },
      labelFontSize: 24, labelFontWeight: "bold", enableHover: true, hoverScale: 1.5, adjacentScale: 1.1, sectorClass: "month-sector",
    });

    if (isCurrentYear) {
      const currentDay = now.getDate();
      const monthDaysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
      const smoothMonthIndex = currentMonth + (currentDay - 1) / monthDaysCount;
      const angle = this.calculateArrowAngle(smoothMonthIndex, 12);
      const arrow = this.createCurrentIndicatorArrow(centerX, centerY, angle, radius, { size: 35, color: "#64c8ff", pulseAnimation: true });
      group.appendChild(arrow);
    }

    const periodText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    periodText.setAttribute("x", String(centerX)); periodText.setAttribute("y", String(centerY));
    periodText.setAttribute("text-anchor", "middle"); periodText.setAttribute("dominant-baseline", "middle");
    periodText.classList.add("period-text", "year"); periodText.textContent = String(state.year);
    group.appendChild(periodText);
    return group;
  };

  /**
   * Helper to calculate angle for arrow indicator consistent with CircleRenderer
   */
  private calculateArrowAngle = (index: number, totalItems: number, additionalOffset: number = 0): number => {
    const rotationRadians = ((this.rotationOffset + additionalOffset) * Math.PI) / 180;
    const baseAngle = (index / totalItems) * Math.PI * 2 - Math.PI / 2 + rotationRadians;
    return this.applyDirectionMirroring(baseAngle);
  };

  private createCurrentIndicatorArrow = (
    centerX: number, centerY: number, angle: number, radius: number,
    options: { size?: number; color?: string; pulseAnimation?: boolean; } = {}
  ): SVGElement => {
    const size = options.size || 30, color = options.color || "#64c8ff", pulseAnimation = options.pulseAnimation !== false;
    const arrowDistance = radius + size + 10, arrowX = centerX + Math.cos(angle) * arrowDistance, arrowY = centerY + Math.sin(angle) * arrowDistance;
    const arrowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    arrowGroup.classList.add("current-indicator-arrow");
    const tipX = centerX + Math.cos(angle) * radius, tipY = centerY + Math.sin(angle) * radius;
    const baseX = arrowX, baseY = arrowY, perpAngle1 = angle + Math.PI / 2, perpAngle2 = angle - Math.PI / 2;
    const wing1X = baseX + Math.cos(perpAngle1) * (size / 2), wing1Y = baseY + Math.sin(perpAngle1) * (size / 2);
    const wing2X = baseX + Math.cos(perpAngle2) * (size / 2), wing2Y = baseY + Math.sin(perpAngle2) * (size / 2);
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrow.setAttribute("points", `${tipX},${tipY} ${wing1X},${wing1Y} ${wing2X},${wing2Y}`);
    arrow.setAttribute("fill", color); arrow.setAttribute("stroke", "#ffffff"); arrow.setAttribute("stroke-width", "2");
    arrow.setAttribute("opacity", "0.9"); arrow.style.pointerEvents = "none";
    if (pulseAnimation) {
      const animateOpacity = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      animateOpacity.setAttribute("attributeName", "opacity"); animateOpacity.setAttribute("values", "0.9;0.5;0.9");
      animateOpacity.setAttribute("dur", "2s"); animateOpacity.setAttribute("repeatCount", "indefinite");
      arrow.appendChild(animateOpacity);
    }
    arrowGroup.appendChild(arrow);
    return arrowGroup;
  };

  private createLabel = (
    x: number, y: number, text: string,
    options: { fontSize?: string; fontWeight?: string; fill?: string; stroke?: string; strokeWidth?: string; className?: string; bgCircle?: { radius: number; fill: string; stroke: string; strokeWidth: string; }; isCurrent?: boolean; } = {}
  ): { label: SVGTextElement; bgCircle?: SVGCircleElement } => {
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(x)); label.setAttribute("y", String(y));
    label.setAttribute("text-anchor", "middle"); label.setAttribute("dominant-baseline", "middle");
    label.setAttribute("class", options.className || "label"); label.textContent = text;
    label.style.fontSize = options.fontSize || "28px"; label.style.fontWeight = options.fontWeight || "bold";
    label.style.fill = options.fill || "#fff";
    if (options.stroke) {
      label.setAttribute("stroke", options.stroke); label.style.stroke = options.stroke;
      label.style.strokeWidth = options.strokeWidth || "2px"; label.setAttribute("stroke-width", options.strokeWidth || "2");
      label.setAttribute("stroke-linejoin", "round"); label.setAttribute("paint-order", "stroke fill"); label.style.paintOrder = "stroke fill";
    }
    label.style.pointerEvents = "none";
    let bgCircle: SVGCircleElement | undefined;
    if (options.bgCircle) {
      bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      bgCircle.setAttribute("cx", String(x)); bgCircle.setAttribute("cy", String(y));
      bgCircle.setAttribute("r", String(options.bgCircle.radius)); bgCircle.setAttribute("fill", options.bgCircle.fill);
      bgCircle.setAttribute("stroke", options.bgCircle.stroke); bgCircle.setAttribute("stroke-width", options.bgCircle.strokeWidth);
      bgCircle.style.pointerEvents = "none";
    }
    return { label, bgCircle };
  };

  private renderMonthCircle = (group: SVGElement, state: ZoomState): SVGElement => {
    const centerX = 0, centerY = 0, radius = 320, month = state.month, year = state.year, monthDaysCount = new Date(year, month + 1, 0).getDate();
    const monthEvents = (this.eventsByYear[year]?.[month] || []).slice(0, 4);
    const now = new Date(), currentYear = now.getFullYear(), currentMonth = now.getMonth(), currentDay = now.getDate(), isCurrentMonth = year === currentYear && month === currentMonth;
    const items: CircleItem[] = [];
    for (let day = 1; day <= monthDaysCount; day++) {
      const dayDate = new Date(year, month, day), isSunday = dayDate.getDay() === 0, isCurrent = isCurrentMonth && day === currentDay;
      items.push({ index: day - 1, label: String(day), value: day, isCurrent, isSpecial: isSunday, dataAttributes: { day: String(day - 1) } });
    }
    let wheelDelta = 0, wheelTimeout: ReturnType<typeof setTimeout> | null = null;
    this.circleRenderer.render(group, {
      centerX, centerY, radius, innerRadius: radius * 0.7, items,
      colorScheme: (item) => {
        const day = item.value;
        if (item.isCurrent) return `hsl(${(day * 11) % 360}, 80%, 50%)`;
        if (item.isSpecial) return `hsl(${(day * 11) % 360}, 75%, 55%)`;
        return `hsl(${(day * 11) % 360}, 70%, 60%)`;
      },
      direction: this.direction, rotationOffset: this.rotationOffset,
      onItemClick: (item) => { const week = this.getWeekForDay(year, month, item.value); this.navigateToLevel("week", { week }); },
      onItemWheel: (item, e) => {
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelDelta += e.deltaY;
        wheelTimeout = setTimeout(() => { wheelDelta = 0; }, 200);
        if (Math.abs(wheelDelta) >= 100) {
          if (wheelDelta < 0) this.navigateToLevel("month", { month });
          else this.navigateToLevel("day", { day: item.value });
          wheelDelta = 0;
          if (wheelTimeout) { clearTimeout(wheelTimeout); wheelTimeout = null; }
        } else if (Math.abs(wheelDelta) >= 30) {
          if (wheelDelta >= 0) { const week = this.getWeekForDay(year, month, item.value); this.navigateToLevel("week", { week }); }
          wheelDelta = 0;
          if (wheelTimeout) { clearTimeout(wheelTimeout); wheelTimeout = null; }
        }
      },
      onItemHover: () => {},
      renderCustomLabel: (container, item, ctx) => {
        const { label, bgCircle } = this.createLabel(ctx.x, ctx.y, item.label, {
          fontSize: item.isCurrent ? "40px" : "32px", fill: "#ffffff", stroke: "#000000", strokeWidth: "2", className: "day-label", isCurrent: item.isCurrent,
          bgCircle: { radius: item.isCurrent ? 24 : 20, fill: item.isCurrent ? "rgba(100, 200, 255, 0.9)" : "rgba(0, 0, 0, 0.75)", stroke: item.isCurrent ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.5)", strokeWidth: item.isCurrent ? "2" : "1" },
        });
        if (bgCircle) container.appendChild(bgCircle);
        container.appendChild(label);
      },
      hoverScale: 1.5, sectorClass: "day-sector",
    });

    if (isCurrentMonth) {
      const smoothDayIndex = currentDay - 1 + (now.getHours() + now.getMinutes() / 60) / 24;
      const angle = this.calculateArrowAngle(smoothDayIndex, monthDaysCount);
      const arrow = this.createCurrentIndicatorArrow(centerX, centerY, angle, radius, { size: 35, color: "#64c8ff", pulseAnimation: true });
      group.appendChild(arrow);
    }

    if (monthEvents.length > 0) {
      const eventsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      monthEvents.forEach((event, index) => {
        const eventText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        eventText.setAttribute("x", String(centerX)); eventText.setAttribute("y", String(centerY - 60 + index * 20));
        eventText.setAttribute("text-anchor", "middle"); eventText.setAttribute("dominant-baseline", "middle");
        eventText.classList.add("event-text"); eventText.textContent = event.summary.substring(0, 30);
        eventsGroup.appendChild(eventText);
      });
      group.appendChild(eventsGroup);
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const periodText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    periodText.setAttribute("x", String(centerX)); periodText.setAttribute("y", String(centerY + 80));
    periodText.setAttribute("text-anchor", "middle"); periodText.setAttribute("dominant-baseline", "middle");
    periodText.classList.add("period-text", "month"); periodText.textContent = `${monthNames[month]} 1-${monthDaysCount}`;
    group.appendChild(periodText);
    return group;
  };

  private renderWeekCircle = (group: SVGElement, state: ZoomState): SVGElement => {
    const centerX = 0, centerY = 0, radius = 320, week = state.week, year = state.year, weekStart = this.getWeekStartDate(year, week);
    const weekEvents = (this.eventsByWeek[week] || []).slice(0, 4);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date(), currentYear = now.getFullYear(), currentMonth = now.getMonth(), currentDay = now.getDate();
    const items: CircleItem[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart); dayDate.setDate(dayDate.getDate() + i);
      const day = dayDate.getDate(), dayMonth = dayDate.getMonth(), dayYear = dayDate.getFullYear();
      const isCurrent = dayYear === currentYear && dayMonth === currentMonth && day === currentDay;
      items.push({ index: i, label: `${dayNames[i]}\n${day}`, value: { day, month: dayMonth, year: dayYear }, isCurrent, dataAttributes: { day: String(i) } });
    }
    let wheelDelta = 0, wheelTimeout: ReturnType<typeof setTimeout> | null = null;
    this.circleRenderer.render(group, {
      centerX, centerY, radius, innerRadius: radius * 0.7, items,
      colorScheme: (item) => { const i = item.index; return item.isCurrent ? `hsl(${(i * 51) % 360}, 80%, 50%)` : `hsl(${(i * 51) % 360}, 70%, 60%)`; },
      direction: this.direction, rotationOffset: this.rotationOffset,
      onItemClick: (item) => { const val = item.value; this.navigateToLevel("day", { year: val.year, month: val.month, day: val.day }); },
      onItemWheel: (item, e) => {
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelDelta += e.deltaY;
        wheelTimeout = setTimeout(() => { wheelDelta = 0; }, 200);
        if (Math.abs(wheelDelta) >= 100) {
          if (wheelDelta < 0) this.navigateToLevel("month", { month: item.value.month });
          else this.navigateToLevel("day", { year: item.value.year, month: item.value.month, day: item.value.day });
          wheelDelta = 0;
          if (wheelTimeout) { clearTimeout(wheelTimeout); wheelTimeout = null; }
        }
      },
      onItemHover: () => {},
      renderCustomLabel: (container, item, ctx) => {
        const { label } = this.createLabel(ctx.x, ctx.y, item.label, { fontSize: item.isCurrent ? "24px" : "20px", fill: "#fff", className: "day-label", isCurrent: item.isCurrent });
        label.style.whiteSpace = "pre"; container.appendChild(label);
      },
      hoverScale: 1.5, sectorClass: "day-sector",
    });

    const currentWeekDayIndex = items.findIndex((item) => item.isCurrent);
    if (currentWeekDayIndex !== -1) {
      const smoothWeekIndex = currentWeekDayIndex + (now.getHours() + now.getMinutes() / 60) / 24;
      const angle = this.calculateArrowAngle(smoothWeekIndex, 7);
      const arrow = this.createCurrentIndicatorArrow(centerX, centerY, angle, radius, { size: 35, color: "#64c8ff", pulseAnimation: true });
      group.appendChild(arrow);
    }

    if (weekEvents.length > 0) {
      const eventsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      weekEvents.forEach((event, index) => {
        const eventText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        eventText.setAttribute("x", String(centerX)); eventText.setAttribute("y", String(centerY - 60 + index * 20));
        eventText.setAttribute("text-anchor", "middle"); eventText.setAttribute("dominant-baseline", "middle");
        eventText.classList.add("event-text"); eventText.textContent = event.summary.substring(0, 30);
        eventsGroup.appendChild(eventText);
      });
      group.appendChild(eventsGroup);
    }

    const weekEndDate = new Date(weekStart); weekEndDate.setDate(weekEndDate.getDate() + 6);
    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const startDay = weekStart.getDate(), startMonthName = monthNamesShort[weekStart.getMonth()], endDay = weekEndDate.getDate(), endMonthName = monthNamesShort[weekEndDate.getMonth()];
    const periodText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    periodText.setAttribute("x", String(centerX)); periodText.setAttribute("y", String(centerY + 60));
    periodText.setAttribute("text-anchor", "middle"); periodText.setAttribute("dominant-baseline", "middle");
    periodText.classList.add("period-text", "week");
    const tspan1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan1.setAttribute("x", String(centerX)); tspan1.setAttribute("dy", "0"); tspan1.textContent = `Week ${week + 1}`;
    periodText.appendChild(tspan1);
    const tspan2 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan2.setAttribute("x", String(centerX)); tspan2.setAttribute("dy", "1.2em");
    tspan2.textContent = startMonthName === endMonthName ? `${startDay}-${endDay} ${startMonthName}` : `${startDay} ${startMonthName} - ${endDay} ${endMonthName}`;
    periodText.appendChild(tspan2);
    group.appendChild(periodText);
    return group;
  };

  private renderDayCircle = (group: SVGElement, state: ZoomState): SVGElement => {
    const centerX = 0, centerY = 0, radius = 320, year = state.year, month = state.month, day = state.day;
    const dayKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = (this.eventsByDay[dayKey] || []).slice(0, 4);
    const now = new Date(), currentYear = now.getFullYear(), currentMonth = now.getMonth(), currentDay = now.getDate(), currentHour12 = now.getHours() % 12 || 12, isCurrentDay = year === currentYear && month === currentMonth && day === currentDay;
    const items: CircleItem[] = [];
    for (let hour = 1; hour <= 12; hour++) {
      items.push({ index: hour - 1, label: String(hour), value: hour, isCurrent: isCurrentDay && hour === currentHour12, dataAttributes: { hour: String(hour) } });
    }
    let wheelDelta = 0, wheelTimeout: ReturnType<typeof setTimeout> | null = null;
    this.circleRenderer.render(group, {
      centerX, centerY, radius, innerRadius: radius * 0.7, items,
      colorScheme: (item) => { const hour = item.value; return item.isCurrent ? `hsl(${(hour * 30) % 360}, 80%, 50%)` : `hsl(${(hour * 30) % 360}, 70%, 60%)`; },
      direction: this.direction, rotationOffset: this.rotationOffset + 30,
      onItemClick: () => {},
      onItemWheel: (_item, e) => {
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelDelta += e.deltaY;
        wheelTimeout = setTimeout(() => { wheelDelta = 0; }, 200);
        if (Math.abs(wheelDelta) >= 100) {
          if (wheelDelta < 0) this.handleBack();
          wheelDelta = 0;
          if (wheelTimeout) { clearTimeout(wheelTimeout); wheelTimeout = null; }
        }
      },
      onItemHover: () => {},
      renderCustomLabel: (container, item, ctx) => {
        const { label } = this.createLabel(ctx.x, ctx.y, item.label, { fontSize: item.isCurrent ? "28px" : "24px", fill: item.isCurrent ? "#64c8ff" : "#fff", className: "hour-label", isCurrent: item.isCurrent });
        container.appendChild(label);
      },
      hoverScale: 1.5, sectorClass: "hour-sector",
    });

    if (isCurrentDay) {
      const hourFloat = (now.getHours() % 12) + now.getMinutes() / 60;
      const smoothHourIndex = (hourFloat + 11) % 12;
      const angle = this.calculateArrowAngle(smoothHourIndex, 12, 30);
      const arrow = this.createCurrentIndicatorArrow(centerX, centerY, angle, radius, { size: 35, color: "#64c8ff", pulseAnimation: true });
      group.appendChild(arrow);
    }

    dayEvents.forEach((event) => {
      if (!event.start) return;
      const eventDate = new Date(event.start), hours = eventDate.getHours(), minutes = eventDate.getMinutes();
      let hour12 = hours % 12; if (hour12 === 0) hour12 = 12;
      const isPM = hours >= 12, hourAngle = ((hour12 - 3) / 12) * Math.PI * 2, minuteOffset = (minutes / 60) * (Math.PI / 6), angle = hourAngle + minuteOffset;
      const dotRadius = 6, dotX = centerX + Math.cos(angle) * (radius * 0.75), dotY = centerY + Math.sin(angle) * (radius * 0.75);
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", String(dotX)); dot.setAttribute("cy", String(dotY)); dot.setAttribute("r", String(dotRadius));
      dot.setAttribute("fill", isPM ? "#ff6464" : "#4a9eff"); dot.setAttribute("class", "event-dot"); dot.style.cursor = "pointer";
      dot.setAttribute("title", event.summary); group.appendChild(dot);
    });

    if (dayEvents.length > 0) {
      const eventsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      dayEvents.forEach((event, index) => {
        const eventText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        eventText.setAttribute("x", String(centerX)); eventText.setAttribute("y", String(centerY - 60 + index * 20));
        eventText.setAttribute("text-anchor", "middle"); eventText.setAttribute("dominant-baseline", "middle");
        eventText.classList.add("event-text"); eventText.textContent = event.summary.substring(0, 30);
        eventsGroup.appendChild(eventText);
      });
      group.appendChild(eventsGroup);
    }

    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const periodText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    periodText.setAttribute("x", String(centerX)); periodText.setAttribute("y", String(centerY + 80));
    periodText.setAttribute("text-anchor", "middle"); periodText.setAttribute("dominant-baseline", "middle");
    periodText.classList.add("period-text", "day"); periodText.textContent = `${monthNamesShort[month]} ${day}, ${year}`;
    group.appendChild(periodText);
    return group;
  };

  private getWeekForDay = (year: number, month: number, day: number): number => {
    const date = new Date(year, month, day), dayOfWeek = date.getDay(), sundayOfWeek = new Date(date);
    sundayOfWeek.setDate(date.getDate() - dayOfWeek);
    const startOfYear = new Date(year, 0, 1), startDayOfWeek = startOfYear.getDay(), firstSunday = new Date(startOfYear);
    firstSunday.setDate(1 - startDayOfWeek);
    const diffInMs = sundayOfWeek.getTime() - firstSunday.getTime(), diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(51, Math.floor(diffInDays / 7)));
  };

  private getWeekStartDate = (year: number, week: number): Date => {
    const startOfYear = new Date(year, 0, 1), startDayOfWeek = startOfYear.getDay(), firstSunday = new Date(startOfYear);
    firstSunday.setDate(1 - startDayOfWeek);
    const weekStart = new Date(firstSunday); weekStart.setDate(firstSunday.getDate() + week * 7);
    return weekStart;
  };

  private isGoingBackwards = (oldLevel: ZoomLevel, newLevel: ZoomLevel): boolean => {
    const levelOrder: ZoomLevel[] = ["year", "month", "week", "day"];
    return levelOrder.indexOf(oldLevel) > levelOrder.indexOf(newLevel);
  };

  private handleBack = (): void => {
    const state = this.currentState;
    if (state.level === "day") this.navigateToLevel("week", { week: state.week });
    else if (state.level === "week") this.navigateToLevel("month", { month: state.month });
    else if (state.level === "month") this.navigateToLevel("year", {});
  };

  private render = (): void => {
    if (this.animating || !this.svg) return;
    const existingDefs = this.svg.querySelector("defs");
    while (this.svg.firstChild) {
      if (this.svg.firstChild !== existingDefs) this.svg.removeChild(this.svg.firstChild);
      else {
        const next = this.svg.firstChild.nextSibling; if (!next) break;
        this.svg.removeChild(this.svg.firstChild); if (next === existingDefs) continue; this.svg.removeChild(next);
      }
    }
    if (!existingDefs) {
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      this.svg.insertBefore(defs, this.svg.firstChild);
    } else if (!this.svg.contains(existingDefs)) this.svg.insertBefore(existingDefs, this.svg.firstChild);

    const circle = this.renderCircle(this.currentState, 1);
    if (circle) {
      const center = this.currentState.level === "month" ? this.getCircleTargetCenter(this.currentState) : this.getCircleCenter(this.currentState);
      const scale = this.getCircleScale(this.currentState);
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("transform", `translate(${center.x}, ${center.y}) scale(${scale})`);
      group.style.pointerEvents = "auto"; group.appendChild(circle); this.svg.appendChild(group);
    }

    if (this.backButton) {
      if (this.currentState.level === "year") this.backButton.classList.add("hidden");
      else {
        this.backButton.classList.remove("hidden");
        const state = this.currentState;
        let buttonText = "←";
        if (state.level === "month") {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          buttonText = `← ${state.month + 1} ${monthNames[state.month]}`;
        } else if (state.level === "week") {
          const weekStart = this.getWeekStartDate(state.year, state.week);
          buttonText = `← ${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
        } else if (state.level === "day") {
          buttonText = `← ${state.day}/${state.month + 1}`;
        }
        this.backButton.textContent = buttonText;
      }
    }
  };

  private applyDirectionMirroring = (angle: number): number => (this.direction === 1 ? angle : Math.PI - angle);
  public getDirection = (): Direction => this.direction;
  public setDirection = (direction: Direction): void => { this.direction = direction; this.render(); };
  public toggleDirection = (): Direction => { this.direction = this.direction === 1 ? -1 : 1; this.render(); return this.direction; };
  public setRotationOffset = (offset: number): void => { this.rotationOffset = offset; this.render(); };
  public shiftSeasons = (): number => { this.rotationOffset = (this.rotationOffset + 90) % 360; this.render(); return this.rotationOffset; };
  public setOnStateChange = (callback: (state: ZoomState) => void): void => { this.onStateChange = callback; };
  public setYear = (year: number): void => { this.currentState.year = year; this.render(); };
  public getCurrentState = (): ZoomState => ({ ...this.currentState });

  /**
   * Navigate to previous period based on current level
   */
  public navigatePrev = (): void => {
    const state = this.currentState;
    if (state.level === "year") {
      this.setYear(state.year - 1);
    } else if (state.level === "month") {
      if (state.month > 0) this.navigateToLevel("month", { month: state.month - 1 });
      else this.navigateToLevel("month", { year: state.year - 1, month: 11 });
    }
  };

  /**
   * Navigate to next period based on current level
   */
  public navigateNext = (): void => {
    const state = this.currentState;
    if (state.level === "year") {
      this.setYear(state.year + 1);
    } else if (state.level === "month") {
      if (state.month < 11) this.navigateToLevel("month", { month: state.month + 1 });
      else this.navigateToLevel("month", { year: state.year + 1, month: 0 });
    }
  };

  public destroy = (): void => { document.removeEventListener("keydown", this.initializeKeyboardHandlers as any); };
}
