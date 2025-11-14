/**
 * @fileoverview RingSystem - Manager for multiple calendar rings
 */

import { Ring } from './Ring';
import { CALENDAR_CONSTANTS } from './constants';

export interface RingSystemSettings {
  cornerRadius: number;
  ringWidth: number;
  direction: number; // 1 = CW, -1 = CCW
  rotationOffset: number; // 0, 90, 180, 270
  ringOrder: string[];
  ringVisibility: Record<string, boolean>;
}

/**
 * RingSystem manages multiple calendar rings and their layout
 */
export class RingSystem {
  private svgContainer: SVGElement;
  private centerX: number;
  private centerY: number;
  private rings: Ring[] = [];
  private ringVisibility: Record<string, boolean> = {};
  private baseRadius: number = 250; // Will be adjusted for perimeter preservation
  private ringWidth: number = 50; // Increased from 40 for better spacing
  private ringGap: number = 5; // Gap between rings
  private cornerRadius: number = 0.5;
  private targetPerimeter: number | null = null;
  private direction: number = 1; // 1 = CW (clockwise), -1 = CCW (counter-clockwise)
  private rotationOffset: number = 0; // Rotation offset in degrees (0, 90, 180, 270)

  constructor(svgContainer: SVGElement, centerX: number, centerY: number) {
    this.svgContainer = svgContainer;
    this.centerX = centerX;
    this.centerY = centerY;
  }

  addRing(ring: Ring, visible: boolean = true): void {
    ring.render(this.svgContainer);
    this.rings.push(ring);
    this.ringVisibility[ring.name] = visible; // Visible by default unless specified
  }

  setRingVisibility(ringName: string, visible: boolean): void {
    this.ringVisibility[ringName] = visible;
    const ring = this.rings.find((r) => r.name === ringName);
    if (ring && ring.svgGroup) {
      ring.svgGroup.style.display = visible ? 'block' : 'none';
    }
    this.layout();
    this.saveSettings();
  }

  reorderRings(newOrder: string[]): void {
    // newOrder is array of ring names from outermost to innermost
    const reorderedRings: Ring[] = [];
    for (const name of newOrder) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ring = this.rings.find((r) => r.name === name);
      if (ring) {
        reorderedRings.push(ring);
      }
    }
    this.rings = reorderedRings;
    this.layout();
    this.saveSettings();
  }

  layout(): void {
    // Calculate base radius to maintain constant perimeter
    if (this.targetPerimeter === null) {
      // First layout - establish target perimeter at cornerRadius = 1 (circle)
      class TempRing extends Ring {
        get sectorCount(): number {
          return 12;
        }
        getSectorLabel(_index: number): string {
          return '';
        }
      }

      const tempRing = new TempRing('temp', '');
      tempRing.centerX = this.centerX;
      tempRing.centerY = this.centerY;
      tempRing.cornerRadius = 1;
      tempRing.outerRadius = this.baseRadius;
      this.targetPerimeter = tempRing.calculatePerimeter(this.baseRadius);
    }

    // Calculate adjusted radius for current corner radius
    const adjustedRadius = Ring.calculatePerimeterConstantRadius(
      this.cornerRadius,
      this.targetPerimeter,
      this.centerX,
      this.centerY
    );

    // Layout each ring from outermost to innermost (only visible rings)
    let currentOuterRadius = adjustedRadius;

    for (const ring of this.rings) {

      if (!this.ringVisibility[ring.name]) {
        continue; // Skip hidden rings
      }

      const innerRadius = currentOuterRadius - this.ringWidth;

      ring.layout(
        this.centerX,
        this.centerY,
        innerRadius,
        currentOuterRadius,
        this.cornerRadius,
        this.direction,
        this.rotationOffset
      );

      // Add gap before next ring
      currentOuterRadius = innerRadius - this.ringGap;
    }

    // Update today indicator
    this.updateTodayIndicator(adjustedRadius);
  }

  setRingWidth(width: number): void {
    this.ringWidth = width;
    this.layout();
    this.saveSettings();
  }

  setCornerRadius(radius: number): void {
    this.cornerRadius = radius;
    this.layout();
    this.saveSettings();
  }

  toggleDirection(): number {
    this.direction = this.direction === 1 ? -1 : 1;
    this.layout();
    this.saveSettings();
    return this.direction;
  }

  rotateYear(): number {
    this.rotationOffset = (this.rotationOffset + 90) % 360;
    this.layout();
    this.saveSettings();
    return this.rotationOffset;
  }

  getRingOrder(): string[] {
    return this.rings.map((r) => r.name);
  }

  getDirection(): number {
    return this.direction;
  }

  getRotationOffset(): number {
    return this.rotationOffset;
  }

  getRingVisibility(): Record<string, boolean> {
    return { ...this.ringVisibility };
  }

  updateTodayIndicator(adjustedRadius: number): void {
    // Calculate today's day of year (0-364)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay) - 1; // 0-indexed

    // Calculate angle for today
    const daysInYear = CALENDAR_CONSTANTS.DAYS_IN_YEAR;
    const baseOffset = CALENDAR_CONSTANTS.BASE_OFFSET; // Start at top
    const rotationRad = (this.rotationOffset * Math.PI) / 180;
    const progress =
      (dayOfYear / daysInYear) * CALENDAR_CONSTANTS.FULL_CIRCLE;
    const angle = baseOffset + rotationRad + progress;

    // For CCW, mirror angle around vertical axis: θ → π - θ
    const mirroredAngle = this.direction === -1 ? Math.PI - angle : angle;

    // Calculate line end point (just beyond outermost ring)
    const lineLength = adjustedRadius + 15; // Extend 15px beyond
    const endX = this.centerX + lineLength * Math.cos(mirroredAngle);
    const endY = this.centerY + lineLength * Math.sin(mirroredAngle);

    // Update line
    const todayLine = document.getElementById('todayLine');
    if (todayLine) {
      todayLine.setAttribute('x1', this.centerX.toString());
      todayLine.setAttribute('y1', this.centerY.toString());
      todayLine.setAttribute('x2', endX.toFixed(2));
      todayLine.setAttribute('y2', endY.toFixed(2));
    }

    // Update dot
    const todayDot = document.getElementById('todayDot');
    if (todayDot) {
      todayDot.setAttribute('cx', endX.toFixed(2));
      todayDot.setAttribute('cy', endY.toFixed(2));
    }
  }

  saveSettings(): void {
    const settings: RingSystemSettings = {
      cornerRadius: this.cornerRadius,
      ringWidth: this.ringWidth,
      direction: this.direction,
      rotationOffset: this.rotationOffset,
      ringOrder: this.getRingOrder(),
      ringVisibility: this.ringVisibility,
    };
    localStorage.setItem(
      'multiRingCalendarSettings',
      JSON.stringify(settings)
    );
  }

  loadSettings(): RingSystemSettings | false {
    const saved = localStorage.getItem('multiRingCalendarSettings');
    if (!saved) return false;

    try {
      const settings = JSON.parse(saved) as RingSystemSettings;
      this.cornerRadius = settings.cornerRadius ?? 0.5;
      this.ringWidth = settings.ringWidth ?? 50;
      this.direction = settings.direction ?? 1;
      this.rotationOffset = settings.rotationOffset ?? 0;
      if (settings.ringVisibility) {
        this.ringVisibility = settings.ringVisibility;
      }
      return settings;
    } catch (e) {
      console.error('Failed to load settings:', e);
      return false;
    }
  }
}

