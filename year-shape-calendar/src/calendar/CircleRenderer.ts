/**
 * @fileoverview Circle Renderer - Unified rendering for circular calendar views
 *
 * This module eliminates ~70% code duplication in ZoomMode's four circle rendering methods
 * (renderYearCircle, renderMonthCircle, renderWeekCircle, renderDayCircle) by extracting
 * the common patterns into a reusable, configurable renderer.
 *
 * @module calendar/CircleRenderer
 */

import type { CalendarEvent } from "../types";
import {
  createSectorPath,
  createSectorGroup,
  createLabel,
  applyDirectionMirroring,
  type SectorConfig,
  type SectorGroupConfig,
  type LabelConfig,
} from "../utils/svg";

/**
 * Represents a single item in the circle (month, day, hour, etc.)
 */
export interface CircleItem {
  /** Position in circle (0-based index) */
  index: number;
  /** Display label text */
  label: string;
  /** The actual data value (month index, day number, etc.) */
  value: any;
  /** Is this the current active period? */
  isCurrent?: boolean;
  /** Special styling (e.g., Sunday, holiday) */
  isSpecial?: boolean;
  /** Associated calendar events */
  events?: CalendarEvent[];
  /** Additional data */
  [key: string]: any;
}

/**
 * Color scheme function type
 * Takes an item and returns its fill color
 */
export type ColorScheme = (item: CircleItem, isHovered: boolean) => string;

/**
 * Configuration for rendering a complete circle
 */
export interface CircleConfig {
  /** Center X coordinate */
  centerX: number;
  /** Center Y coordinate */
  centerY: number;
  /** Outer radius of the circle */
  radius: number;
  /** Inner radius (ring thickness) */
  innerRadius: number;
  /** Array of items to render */
  items: CircleItem[];
  /** Function to determine item color */
  colorScheme: ColorScheme;
  /** Rendering direction (1 = CW, -1 = CCW) */
  direction: number;
  /** Callback when item is clicked */
  onItemClick: (item: CircleItem, event: Event) => void;
  /** Callback when item is hovered (null when no hover) */
  onItemHover?: (item: CircleItem | null) => void;
  /** Label font size (default: 16) */
  labelFontSize?: number;
  /** Label font weight (default: 'normal') */
  labelFontWeight?: string;
  /** Enable hover effects (default: true) */
  enableHover?: boolean;
  /** Hover scale factor (default: 1.5) */
  hoverScale?: number;
  /** Adjacent item scale when neighbor is hovered (default: 1.1) */
  adjacentScale?: number;
  /** CSS transition for hover (default: smooth transition) */
  hoverTransition?: string;
  /** Additional CSS classes for sectors */
  sectorClass?: string;
  /** Additional CSS classes for labels */
  labelClass?: string;
  /** Rotation offset in degrees (default: 0) */
  rotationOffset?: number;
}

/**
 * Circle Renderer
 *
 * Unified renderer for all circular calendar views.
 * Handles:
 * - Sector creation with proper angles
 * - Hover effects with scaling
 * - Click/touch event handling
 * - Label rendering
 * - Direction (CW/CCW) control
 *
 * @example
 * const renderer = new CircleRenderer();
 * renderer.render(svgGroup, {
 *   centerX: 0,
 *   centerY: 0,
 *   radius: 320,
 *   innerRadius: 224,
 *   items: months.map((name, i) => ({ index: i, label: name, value: i })),
 *   colorScheme: (item) => `hsl(${item.index * 30}, 70%, 60%)`,
 *   direction: 1,
 *   onItemClick: (item) => console.log('Clicked:', item.label)
 * });
 */
export class CircleRenderer {
  private hoveredIndex: number | null = null;
  private hoverUpdateTimeout: number | ReturnType<typeof setTimeout> | null = null;

  /**
   * Render a complete circle with sectors
   *
   * @param group - SVG group element to render into
   * @param config - Circle configuration
   */
  render(group: SVGElement, config: CircleConfig): void {
    const {
      items,
      enableHover = true,
    } = config;

    // Clear any existing content
    group.innerHTML = "";

    // Create separate layers for sectors and labels
    const sectorLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    sectorLayer.classList.add("sector-layer");

    const labelLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    labelLayer.classList.add("label-layer");
    labelLayer.style.pointerEvents = "none";

    // Render each item
    items.forEach((item) => {
      const { sectorGroup: itemGroup, label } = this.renderItem(
        item,
        config
      );
      sectorLayer.appendChild(itemGroup);
      if (label) {
        labelLayer.appendChild(label);
      }
    });

    // Add layers to group
    group.appendChild(sectorLayer);
    group.appendChild(labelLayer);

    // Setup hover handlers if enabled
    if (enableHover && config.onItemHover) {
      this.setupHoverHandlers(sectorLayer, items, config);
    }
  }

  /**
   * Render a single item (sector + label)
   *
   * @param item - Item to render
   * @param config - Circle configuration
   * @returns Sector group and label elements
   */
  private renderItem(
    item: CircleItem,
    config: CircleConfig
  ): { sectorGroup: SVGGElement; label: SVGTextElement | null } {
    const {
      centerX,
      centerY,
      radius,
      innerRadius,
      items,
      direction,
      colorScheme,
      hoverScale = 1.5,
      adjacentScale = 1.1,
      hoverTransition = "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      sectorClass = "sector",
      labelFontSize = 16,
      labelFontWeight = "normal",
      labelClass = "label",
    } = config;

    const totalItems = items.length;
    const { startAngle, endAngle, midAngle } = this.calculateAngles(
      item.index,
      totalItems,
      direction,
      config.rotationOffset || 0
    );

    // Calculate scale based on hover state
    let scale = 1;
    if (this.hoveredIndex === item.index) {
      scale = hoverScale;
    } else if (this.hoveredIndex !== null) {
      // Check if this is adjacent to hovered item
      const hoverDist = Math.min(
        Math.abs(item.index - this.hoveredIndex),
        Math.abs(item.index - this.hoveredIndex + totalItems),
        Math.abs(item.index - this.hoveredIndex - totalItems)
      );
      if (hoverDist === 1) {
        scale = adjacentScale;
      }
    }

    // Create sector group
    const midRadius = (innerRadius + radius) / 2;
    const sectorGroupConfig: SectorGroupConfig = {
      centerX,
      centerY,
      angle: midAngle,
      radius: midRadius,
      scale,
      transition: hoverTransition,
      dataAttributes: {
        index: String(item.index),
        value: String(item.value),
        "hover-type": "item",
      },
      classList: ["sector-group"],
    };

    const sectorGroup = createSectorGroup(sectorGroupConfig);

    // Create sector path
    const isHovered = this.hoveredIndex === item.index;
    const fillColor = colorScheme(item, isHovered);

    const sectorConfig: SectorConfig = {
      centerX,
      centerY,
      innerRadius,
      outerRadius: radius,
      startAngle,
      endAngle,
      fillColor,
    };

    // Add stroke for current item
    if (item.isCurrent) {
      sectorConfig.strokeColor = "rgba(255, 255, 255, 0.6)";
      sectorConfig.strokeWidth = 2;
    }

    const sector = createSectorPath(sectorConfig);
    sector.classList.add(sectorClass);
    sector.setAttribute("data-index", String(item.index));
    sector.setAttribute("data-value", String(item.value));

    // Make sector interactive
    sector.style.cursor = "pointer";
    sector.style.pointerEvents = "all";
    sector.style.touchAction = "manipulation";
    (sector.style as any).webkitTouchCallout = "none";
    sector.style.userSelect = "none";
    (sector as any).setAttribute("pointer-events", "all");

    // Setup event handlers
    this.setupItemEventHandlers(sector, item, config);

    sectorGroup.appendChild(sector);

    // Create label
    const labelRadius = (innerRadius + radius) / 2;
    const labelX = centerX + Math.cos(midAngle) * labelRadius;
    const labelY = centerY + Math.sin(midAngle) * labelRadius;

    const labelConfig: LabelConfig = {
      x: labelX,
      y: labelY,
      text: item.label,
      fontSize: labelFontSize,
      fontWeight: item.isCurrent ? "bold" : labelFontWeight,
      fill: item.isCurrent ? "white" : "rgba(255, 255, 255, 0.9)",
      classList: [labelClass],
      dataAttributes: {
        index: String(item.index),
      },
    };

    const label = createLabel(labelConfig);

    return { sectorGroup, label };
  }

  /**
   * Setup event handlers for an item
   *
   * @param sector - Sector element
   * @param item - Item data
   * @param config - Circle configuration
   */
  private setupItemEventHandlers(
    sector: SVGPathElement,
    item: CircleItem,
    config: CircleConfig
  ): void {
    const { onItemClick } = config;

    // Navigation handler
    const handleNavigation = (e: Event): void => {
      // Cancel any pending hover updates
      if (this.hoverUpdateTimeout) {
        if (typeof this.hoverUpdateTimeout === "number") {
          clearTimeout(this.hoverUpdateTimeout);
        } else {
          cancelAnimationFrame(this.hoverUpdateTimeout);
        }
      }

      // Clear hover state
      this.hoveredIndex = null;
      if (config.onItemHover) {
        config.onItemHover(null);
      }

      e.stopPropagation();
      e.preventDefault();

      onItemClick(item, e);
    };

    // Click handler for desktop
    sector.addEventListener("click", handleNavigation, true);

    // Touch handlers for mobile
    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;

    sector.addEventListener(
      "touchstart",
      (e: TouchEvent) => {
        // Cancel hover updates
        if (this.hoverUpdateTimeout) {
          if (typeof this.hoverUpdateTimeout === "number") {
            clearTimeout(this.hoverUpdateTimeout);
          } else {
            cancelAnimationFrame(this.hoverUpdateTimeout);
          }
        }

        if (e.touches.length === 1) {
          touchStartTime = Date.now();
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      },
      { passive: true }
    );

    sector.addEventListener(
      "touchend",
      (e: TouchEvent) => {
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;

        // Only treat as tap if < 300ms and minimal movement
        if (touchDuration < 300 && e.changedTouches.length === 1) {
          const touchEndX = e.changedTouches[0].clientX;
          const touchEndY = e.changedTouches[0].clientY;
          const distance = Math.sqrt(
            Math.pow(touchEndX - touchStartX, 2) +
              Math.pow(touchEndY - touchStartY, 2)
          );

          if (distance < 10) {
            // Minimal movement, treat as tap
            handleNavigation(e);
          }
        }
      },
      { passive: false }
    );
  }

  /**
   * Setup hover handlers for the sector layer
   *
   * @param sectorLayer - Sector layer element
   * @param items - Array of items
   * @param config - Circle configuration
   */
  private setupHoverHandlers(
    sectorLayer: SVGGElement,
    items: CircleItem[],
    config: CircleConfig
  ): void {
    const { onItemHover } = config;
    if (!onItemHover) return;

    sectorLayer.addEventListener("mousemove", (e) => {
      const target = e.target as SVGElement;
      const sectorGroup = target.closest("[data-hover-type='item']");

      if (sectorGroup) {
        const indexStr = sectorGroup.getAttribute("data-index");
        if (indexStr !== null) {
          const newIndex = parseInt(indexStr, 10);
          if (newIndex !== this.hoveredIndex) {
            this.hoveredIndex = newIndex;
            const item = items.find((i) => i.index === newIndex);
            if (item) {
              onItemHover(item);
            }
          }
        }
      } else if (this.hoveredIndex !== null) {
        this.hoveredIndex = null;
        onItemHover(null);
      }
    });

    sectorLayer.addEventListener("mouseleave", () => {
      if (this.hoveredIndex !== null) {
        this.hoveredIndex = null;
        onItemHover(null);
      }
    });
  }

  /**
   * Calculate angles for an item in the circle
   *
   * @param index - Item index (0-based)
   * @param totalItems - Total number of items
   * @param direction - Direction (1 = CW, -1 = CCW)
   * @returns Start, end, and mid angles in radians
   */
  private calculateAngles(
    index: number,
    totalItems: number,
    direction: number,
    rotationOffset: number = 0
  ): { startAngle: number; endAngle: number; midAngle: number } {
    const rotationRadians = (rotationOffset * Math.PI) / 180;
    const baseAngle = (index / totalItems) * Math.PI * 2 - Math.PI / 2 + rotationRadians;
    const angle = applyDirectionMirroring(baseAngle, direction);
    const angleSpan = Math.PI / totalItems;

    return {
      startAngle: angle - angleSpan,
      endAngle: angle + angleSpan,
      midAngle: angle,
    };
  }

  /**
   * Update hover state externally
   * Useful when hover is managed by parent component
   *
   * @param index - Hovered item index (null for no hover)
   */
  setHoverIndex(index: number | null): void {
    this.hoveredIndex = index;
  }

  /**
   * Get current hover index
   * @returns Current hovered index or null
   */
  getHoverIndex(): number | null {
    return this.hoveredIndex;
  }

  /**
   * Clear hover state
   */
  clearHover(): void {
    this.hoveredIndex = null;
    if (this.hoverUpdateTimeout) {
      if (typeof this.hoverUpdateTimeout === "number") {
        clearTimeout(this.hoverUpdateTimeout);
      } else {
        cancelAnimationFrame(this.hoverUpdateTimeout);
      }
      this.hoverUpdateTimeout = null;
    }
  }
}

