/**
 * @fileoverview SVG utility functions
 *
 * Provides reusable utilities for creating and manipulating SVG elements.
 * Eliminates code duplication across calendar modes (Classic, Rings, Zoom).
 *
 * @module utils/svg
 */

/**
 * Configuration for creating a circular sector
 */
export interface SectorConfig {
  /** Center X coordinate */
  centerX: number;
  /** Center Y coordinate */
  centerY: number;
  /** Inner radius (for ring thickness) */
  innerRadius: number;
  /** Outer radius */
  outerRadius: number;
  /** Start angle in radians */
  startAngle: number;
  /** End angle in radians */
  endAngle: number;
  /** Fill color */
  fillColor: string;
  /** Optional stroke color */
  strokeColor?: string;
  /** Optional stroke width */
  strokeWidth?: number;
}

/**
 * Configuration for creating a sector group with transform
 */
export interface SectorGroupConfig {
  /** Center X coordinate */
  centerX: number;
  /** Center Y coordinate */
  centerY: number;
  /** Midpoint angle for transform origin */
  angle: number;
  /** Radius for transform origin calculation */
  radius: number;
  /** Scale factor (default: 1) */
  scale?: number;
  /** CSS transition (default: none) */
  transition?: string;
  /** Data attributes to set */
  dataAttributes?: Record<string, string>;
  /** CSS classes to add */
  classList?: string[];
}

/**
 * Configuration for creating a text label
 */
export interface LabelConfig {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Text content */
  text: string;
  /** Font size in pixels (default: 16) */
  fontSize?: number;
  /** Font weight (default: 'normal') */
  fontWeight?: string;
  /** Text fill color (default: 'currentColor') */
  fill?: string;
  /** CSS classes to add */
  classList?: string[];
  /** Data attributes to set */
  dataAttributes?: Record<string, string>;
}

/**
 * Create an SVG element with attributes and styles
 *
 * @template K - SVG element tag name
 * @param tagName - The SVG element tag name
 * @param attributes - Optional attributes to set
 * @param styles - Optional CSS styles to set
 * @returns The created SVG element
 *
 * @example
 * const circle = createSVGElement('circle', {
 *   cx: '50',
 *   cy: '50',
 *   r: '40'
 * }, {
 *   fill: 'blue',
 *   stroke: 'black'
 * });
 */
export function createSVGElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes?: Record<string, string>,
  styles?: Partial<CSSStyleDeclaration>
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    tagName
  );

  // Set attributes
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
  }

  // Set styles
  if (styles) {
    for (const [key, value] of Object.entries(styles)) {
      if (value !== undefined) {
        (element.style as any)[key] = value;
      }
    }
  }

  return element;
}

/**
 * Create a circular sector path
 *
 * Creates an SVG path element representing a sector (pizza slice) of a circle.
 * Used extensively in all calendar modes for rendering month/day/week segments.
 *
 * @param config - Sector configuration
 * @returns SVG path element
 *
 * @example
 * const sector = createSectorPath({
 *   centerX: 0,
 *   centerY: 0,
 *   innerRadius: 100,
 *   outerRadius: 200,
 *   startAngle: 0,
 *   endAngle: Math.PI / 6, // 30 degrees
 *   fillColor: 'hsl(180, 70%, 60%)',
 *   strokeColor: 'white',
 *   strokeWidth: 2
 * });
 */
export function createSectorPath(config: SectorConfig): SVGPathElement {
  const {
    centerX,
    centerY,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fillColor,
    strokeColor,
    strokeWidth,
  } = config;

  // Calculate outer arc points
  const x1 = centerX + Math.cos(startAngle) * outerRadius;
  const y1 = centerY + Math.sin(startAngle) * outerRadius;
  const x2 = centerX + Math.cos(endAngle) * outerRadius;
  const y2 = centerY + Math.sin(endAngle) * outerRadius;

  // Calculate inner arc points
  const x3 = centerX + Math.cos(endAngle) * innerRadius;
  const y3 = centerY + Math.sin(endAngle) * innerRadius;
  const x4 = centerX + Math.cos(startAngle) * innerRadius;
  const y4 = centerY + Math.sin(startAngle) * innerRadius;

  // Determine if we need large arc flag (> 180 degrees)
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  // Build path data: outer arc CW, line to inner, inner arc CCW, close
  const pathData = [
    `M ${x1} ${y1}`, // Move to start of outer arc
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Outer arc
    `L ${x3} ${y3}`, // Line to start of inner arc
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`, // Inner arc (reverse)
    "Z", // Close path
  ].join(" ");

  const attributes: Record<string, string> = {
    d: pathData,
    fill: fillColor,
  };

  if (strokeColor) {
    attributes.stroke = strokeColor;
  }
  if (strokeWidth) {
    attributes["stroke-width"] = String(strokeWidth);
  }

  return createSVGElement("path", attributes);
}

/**
 * Create a sector group with transform origin
 *
 * Creates an SVG group element configured for scaling transformations
 * around the sector's center point. Used for hover effects.
 *
 * @param config - Sector group configuration
 * @returns SVG group element
 *
 * @example
 * const group = createSectorGroup({
 *   centerX: 0,
 *   centerY: 0,
 *   angle: Math.PI / 4, // 45 degrees
 *   radius: 150,
 *   scale: 1.2, // 20% larger on hover
 *   transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
 *   dataAttributes: { month: '0', hoverType: 'month' },
 *   classList: ['sector-group', 'month-sector-group']
 * });
 */
export function createSectorGroup(config: SectorGroupConfig): SVGGElement {
  const {
    centerX,
    centerY,
    angle,
    radius,
    scale = 1,
    transition,
    dataAttributes,
    classList,
  } = config;

  const group = createSVGElement("g");

  // Calculate transform origin (center of the sector)
  const transformOriginX = centerX + Math.cos(angle) * radius;
  const transformOriginY = centerY + Math.sin(angle) * radius;

  // Set transform properties
  group.style.transformOrigin = `${transformOriginX}px ${transformOriginY}px`;
  group.style.transform = `scale(${scale})`;

  if (transition) {
    group.style.transition = transition;
  }

  // Add CSS classes
  if (classList) {
    group.classList.add(...classList);
  }

  // Set data attributes
  if (dataAttributes) {
    for (const [key, value] of Object.entries(dataAttributes)) {
      group.setAttribute(`data-${key}`, value);
    }
  }

  return group;
}

/**
 * Create a text label element
 *
 * Creates an SVG text element with consistent styling.
 * Used for day numbers, month names, week labels, etc.
 *
 * @param config - Label configuration
 * @returns SVG text element
 *
 * @example
 * const label = createLabel({
 *   x: 100,
 *   y: 100,
 *   text: 'Jan',
 *   fontSize: 16,
 *   fontWeight: 'bold',
 *   fill: 'white',
 *   classList: ['month-label'],
 *   dataAttributes: { month: '0' }
 * });
 */
export function createLabel(config: LabelConfig): SVGTextElement {
  const {
    x,
    y,
    text,
    fontSize = 16,
    fontWeight = "normal",
    fill = "currentColor",
    classList,
    dataAttributes,
  } = config;

  const textElement = createSVGElement(
    "text",
    {
      x: String(x),
      y: String(y),
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      fill,
      "font-size": String(fontSize),
      "font-weight": fontWeight,
    },
    {
      pointerEvents: "none",
      userSelect: "none",
    }
  );

  textElement.textContent = text;

  // Add CSS classes
  if (classList) {
    textElement.classList.add(...classList);
  }

  // Set data attributes
  if (dataAttributes) {
    for (const [key, value] of Object.entries(dataAttributes)) {
      textElement.setAttribute(`data-${key}`, value);
    }
  }

  return textElement;
}

/**
 * Calculate angle with direction mirroring
 *
 * Mirrors angle for counter-clockwise rendering.
 * Used consistently across all calendar modes for CW/CCW direction control.
 *
 * @param angle - Base angle in radians
 * @param direction - 1 for clockwise, -1 for counter-clockwise
 * @returns Mirrored angle
 *
 * @example
 * const cwAngle = Math.PI / 4; // 45 degrees clockwise
 * const ccwAngle = applyDirectionMirroring(cwAngle, -1); // 45 degrees counter-clockwise
 */
export function applyDirectionMirroring(
  angle: number,
  direction: number
): number {
  return direction === 1 ? angle : -angle;
}

/**
 * Create SVG filter for glow effect
 *
 * Creates a reusable SVG filter for highlighting current day/month/week.
 *
 * @param id - Unique filter ID
 * @param stdDeviation - Blur amount (default: 4)
 * @param color - Glow color (default: 'rgba(100, 200, 255, 0.8)')
 * @returns SVG filter element
 *
 * @example
 * const filter = createGlowFilter('current-day-glow', 4, 'rgba(100, 200, 255, 0.8)');
 * defs.appendChild(filter);
 * element.setAttribute('filter', 'url(#current-day-glow)');
 */
export function createGlowFilter(
  id: string,
  stdDeviation: number = 4,
  color: string = "rgba(100, 200, 255, 0.8)"
): SVGFilterElement {
  const filter = createSVGElement("filter", { id });

  const feGaussianBlur = createSVGElement("feGaussianBlur", {
    stdDeviation: String(stdDeviation),
    result: "coloredBlur",
  });

  const feFlood = createSVGElement("feFlood", {
    "flood-color": color,
    result: "floodColor",
  });

  const feComposite = createSVGElement("feComposite", {
    in: "floodColor",
    in2: "coloredBlur",
    operator: "in",
    result: "coloredBlur",
  });

  const feMerge = createSVGElement("feMerge");
  const feMergeNode1 = createSVGElement("feMergeNode", { in: "coloredBlur" });
  const feMergeNode2 = createSVGElement("feMergeNode", { in: "SourceGraphic" });

  feMerge.appendChild(feMergeNode1);
  feMerge.appendChild(feMergeNode2);

  filter.appendChild(feGaussianBlur);
  filter.appendChild(feFlood);
  filter.appendChild(feComposite);
  filter.appendChild(feMerge);

  return filter;
}

