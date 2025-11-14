/**
 * @fileoverview Base Ring class for calendar rings
 */

import { CALENDAR_CONSTANTS, SVG_CONFIG } from './constants';

export interface Point {
  x: number;
  y: number;
}

/**
 * Abstract base class for calendar rings
 */
export abstract class Ring {
  public name: string;
  public gradientId: string;
  public innerRadius: number = 0;
  public outerRadius: number = 0;
  public cornerRadius: number = 0;
  public centerX: number = 0;
  public centerY: number = 0;
  public svgGroup: SVGGElement | null = null;
  public direction: number = 1; // 1 = CW, -1 = CCW

  constructor(name: string, gradientId: string) {
    this.name = name;
    this.gradientId = gradientId;
  }

  // Abstract methods (to be implemented by subclasses)
  abstract get sectorCount(): number;
  abstract getSectorLabel(index: number): string;

  getSectorColor(_index: number): string {
    return `url(#${this.gradientId})`;
  }

  // Concrete methods (shared implementation)

  render(container: SVGElement): void {
    // Create SVG group for this ring
    this.svgGroup = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g'
    ) as SVGGElement;
    this.svgGroup.setAttribute('class', `ring ring-${this.name}`);
    container.appendChild(this.svgGroup);
  }

  layout(
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    cornerRadius: number,
    direction: number = 1,
    rotationOffset: number = 0
  ): void {
    this.centerX = centerX;
    this.centerY = centerY;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
    this.cornerRadius = cornerRadius;
    this.direction = direction;

    if (!this.svgGroup) return;

    // Clear previous content
    this.svgGroup.innerHTML = '';

    // Draw all sectors
    const anglePerSector = CALENDAR_CONSTANTS.FULL_CIRCLE / this.sectorCount;
    // Offset so first sector is centered at top (12 o'clock)
    const baseOffset = CALENDAR_CONSTANTS.BASE_OFFSET - anglePerSector / 2;
    const rotationRad = (rotationOffset * Math.PI) / 180;
    const startOffset = baseOffset + rotationRad;

    for (let i = 0; i < this.sectorCount; i++) {
      const startAngle = startOffset + i * anglePerSector;
      const endAngle = startAngle + anglePerSector;

      // For CCW, mirror angles around vertical axis: θ → π - θ
      // IMPORTANT: Must swap start and end to maintain correct arc direction
      const mirroredStart =
        this.direction === -1 ? Math.PI - endAngle : startAngle;
      const mirroredEnd =
        this.direction === -1 ? Math.PI - startAngle : endAngle;

      this.drawSector(i, mirroredStart, mirroredEnd);
    }

    // Draw separator line (outer edge of ring)
    this.drawSeparator();
  }

  drawSector(index: number, startAngle: number, endAngle: number): void {
    if (!this.svgGroup) return;

    // Create a group for the sector to enable transform
    const sectorGroup = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g'
    );
    sectorGroup.setAttribute('class', 'ring-sector-group');
    sectorGroup.setAttribute('data-sector', index.toString());
    sectorGroup.setAttribute('data-ring-name', this.name);
    
    // Calculate center point for transform origin
    const midAngle = (startAngle + endAngle) / 2;
    const midRadius = (this.innerRadius + this.outerRadius) / 2;
    const centerPoint = this.getPointOnShape(midAngle, midRadius);
    
    // Store center point for hover transform
    (sectorGroup as any).__centerX = centerPoint.x;
    (sectorGroup as any).__centerY = centerPoint.y;

    const path = this.createSectorPath(startAngle, endAngle);
    const pathElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );
    pathElement.setAttribute('d', path);
    pathElement.setAttribute('fill', this.getSectorColor(index));
    pathElement.setAttribute('class', 'ring-sector');
    pathElement.setAttribute('data-sector', index.toString());
    pathElement.style.pointerEvents = 'all';
    pathElement.style.cursor = 'pointer';

    // Add click handler with proper event handling
    pathElement.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log(
        `${this.name} - Sector ${index}: ${this.getSectorLabel(index)}`
      );
      // Alert removed per user request - just log to console
    });

    // No hover effects in rings mode yet (removed per user request)

    sectorGroup.appendChild(pathElement);
    this.svgGroup.appendChild(sectorGroup);

    // Draw label
    this.drawLabel(index, (startAngle + endAngle) / 2);
  }

  createSectorPath(startAngle: number, endAngle: number): string {
    // Create path for a sector (wedge) with rounded corners
    const outerStart = this.getPointOnShape(startAngle, this.outerRadius);
    const outerEnd = this.getPointOnShape(endAngle, this.outerRadius);
    const innerStart = this.getPointOnShape(startAngle, this.innerRadius);
    const innerEnd = this.getPointOnShape(endAngle, this.innerRadius);

    // Build SVG path
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `
      M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}
      A ${this.outerRadius.toFixed(2)} ${this.outerRadius.toFixed(2)} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}
      L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}
      A ${this.innerRadius.toFixed(2)} ${this.innerRadius.toFixed(2)} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}
      Z
    `.trim();
  }

  getPointOnShape(angle: number, radius: number): Point {
    // Calculate point on shape (interpolated between circle and square)
    const t = this.cornerRadius;

    // Pure circle coordinates
    const circleX = this.centerX + radius * Math.cos(angle);
    const circleY = this.centerY + radius * Math.sin(angle);

    // Pure square coordinates (inscribed in circle)
    const normalizedAngle = angle % (Math.PI * 2);

    // Determine which side of the square we're on
    let squareX: number, squareY: number;
    const tan = Math.tan(normalizedAngle);
    const squareRadius = radius / Math.sqrt(2); // Half diagonal

    if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
      // Closer to left or right side
      squareX = this.centerX + Math.sign(Math.cos(angle)) * squareRadius;
      squareY =
        this.centerY + Math.sign(Math.cos(angle)) * squareRadius * tan;
    } else {
      // Closer to top or bottom side
      squareX =
        this.centerX + (Math.sign(Math.sin(angle)) * squareRadius) / tan;
      squareY = this.centerY + Math.sign(Math.sin(angle)) * squareRadius;
    }

    // Linear interpolation between circle and square
    const x = circleX * t + squareX * (1 - t);
    const y = circleY * t + squareY * (1 - t);

    return { x, y };
  }

  drawLabel(index: number, angle: number): void {
    if (!this.svgGroup) return;

    const label = this.getSectorLabel(index);
    if (!label) return;

    const midRadius = (this.innerRadius + this.outerRadius) / 2;
    const point = this.getPointOnShape(angle, midRadius);

    const text = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'text'
    );
    text.setAttribute('x', point.x.toFixed(2));
    text.setAttribute('y', point.y.toFixed(2));
    text.setAttribute('class', 'ring-label');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');

    // Rotate text to follow curve - always keep readable
    // Normalize angle to 0-360 range
    let normalizedAngle = ((angle * 180) / Math.PI) % 360;
    if (normalizedAngle < 0) normalizedAngle += 360;

    // Base rotation perpendicular to radius
    let rotation = normalizedAngle + 90;

    // Flip text if it would be upside down (reading from outside)
    if (rotation > 90 && rotation < 270) {
      rotation += 180;
    }

    text.setAttribute(
      'transform',
      `rotate(${rotation.toFixed(2)}, ${point.x.toFixed(2)}, ${point.y.toFixed(2)})`
    );
    text.textContent = label;

    this.svgGroup.appendChild(text);
  }

  drawSeparator(): void {
    if (!this.svgGroup) return;

    // Draw a circular/square line at the outer edge
    const path = this.createShapePath(this.outerRadius);
    const pathElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );
    pathElement.setAttribute('d', path);
    pathElement.setAttribute('class', 'ring-separator');
    this.svgGroup.appendChild(pathElement);
  }

  createShapePath(radius: number): string {
    const points: Point[] = [];
    const segments = SVG_CONFIG.PATH_SEGMENTS;

    for (let i = 0; i <= segments; i++) {
      const angle =
        (i / segments) * CALENDAR_CONSTANTS.FULL_CIRCLE +
        CALENDAR_CONSTANTS.BASE_OFFSET;
      const point = this.getPointOnShape(angle, radius);
      points.push(point);
    }

    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
    }
    path += ' Z';

    return path;
  }

  // Calculate actual perimeter of the shape
  calculatePerimeter(radius: number): number {
    const segments = SVG_CONFIG.PATH_SEGMENTS;
    let perimeter = 0;
    let prevPoint: Point | null = null;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * CALENDAR_CONSTANTS.FULL_CIRCLE;
      const point = this.getPointOnShape(angle, radius);

      if (prevPoint) {
        const dx = point.x - prevPoint.x;
        const dy = point.y - prevPoint.y;
        perimeter += Math.sqrt(dx * dx + dy * dy);
      }

      prevPoint = point;
    }

    return perimeter;
  }

  // Calculate radius needed to maintain target perimeter
  static calculatePerimeterConstantRadius(
    cornerRadius: number,
    targetPerimeter: number,
    centerX: number,
    centerY: number
  ): number {
    // Use binary search to find the radius that gives us the target perimeter
    let minRadius: number = CALENDAR_CONSTANTS.MIN_RADIUS;
    let maxRadius: number = CALENDAR_CONSTANTS.MAX_RADIUS;
    const tolerance = CALENDAR_CONSTANTS.PERIMETER_TOLERANCE;

    // Create a temporary ring for calculation
    class TempRing extends Ring {
      get sectorCount(): number {
        return 12; // Arbitrary, doesn't matter for perimeter calculation
      }
      getSectorLabel(_index: number): string {
        return '';
      }
    }

    const tempRing = new TempRing('temp', '');
    tempRing.centerX = centerX;
    tempRing.centerY = centerY;
    tempRing.cornerRadius = cornerRadius;
    tempRing.innerRadius = 0;

    for (
      let i = 0;
      i < CALENDAR_CONSTANTS.MAX_PERIMETER_ITERATIONS;
      i++
    ) {
      const testRadius = (minRadius + maxRadius) / 2;
      tempRing.outerRadius = testRadius;
      const perimeter = tempRing.calculatePerimeter(testRadius);

      if (Math.abs(perimeter - targetPerimeter) < tolerance) {
        return testRadius;
      }

      if (perimeter < targetPerimeter) {
        minRadius = testRadius;
      } else {
        maxRadius = testRadius;
      }
    }

    return (minRadius + maxRadius) / 2;
  }
}

