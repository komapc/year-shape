/**
 * @fileoverview Base class for rings that use day-based positioning
 * 
 * This abstract class provides common functionality for rings that position
 * sectors based on day-of-year calculations (months, Hebrew months, holidays).
 */

import { Ring } from './Ring';
import { CALENDAR_CONSTANTS } from './constants';

/**
 * Interface for day-based sector data
 */
export interface DayBasedSector {
  startDay: number;  // Day of year (0-364)
  endDay: number;    // Day of year (0-364)
}

/**
 * Abstract base class for rings with day-based positioning
 */
export abstract class DayBasedRing extends Ring {
  /**
   * Get sectors with their day ranges
   */
  protected abstract getSectors(): DayBasedSector[];

  /**
   * Calculate angles for a day-based sector
   */
  protected calculateSectorAngles(
    sector: DayBasedSector,
    rotationOffset: number = 0
  ): { startAngle: number; endAngle: number } {
    const daysInYear = CALENDAR_CONSTANTS.DAYS_IN_YEAR;
    const baseOffset = CALENDAR_CONSTANTS.BASE_OFFSET;
    const rotationRad = (rotationOffset * Math.PI) / 180;
    const angleOffset = baseOffset + rotationRad;

    const startProgress = (sector.startDay / daysInYear) * CALENDAR_CONSTANTS.FULL_CIRCLE;
    const endProgress = (sector.endDay / daysInYear) * CALENDAR_CONSTANTS.FULL_CIRCLE;

    return {
      startAngle: angleOffset + startProgress,
      endAngle: angleOffset + endProgress,
    };
  }

  /**
   * Apply CCW mirroring to angles if needed
   */
  protected applyDirectionMirroring(
    startAngle: number,
    endAngle: number
  ): { startAngle: number; endAngle: number } {
    if (this.direction === -1) {
      // For CCW, mirror angles around vertical axis: θ → π - θ
      // IMPORTANT: Must swap start and end to maintain correct arc direction
      return {
        startAngle: Math.PI - endAngle,
        endAngle: Math.PI - startAngle,
      };
    }
    return { startAngle, endAngle };
  }

  /**
   * Default layout implementation for day-based rings
   * Can be overridden for special cases (e.g., seasons with wrap-around)
   */
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

    const sectors = this.getSectors();

    // Draw each sector
    for (let i = 0; i < sectors.length; i++) {
      const sector = sectors[i];
      const { startAngle, endAngle } = this.calculateSectorAngles(sector, rotationOffset);
      const { startAngle: mirroredStart, endAngle: mirroredEnd } = 
        this.applyDirectionMirroring(startAngle, endAngle);

      this.drawSector(i, mirroredStart, mirroredEnd);
    }

    // Draw separator line
    this.drawSeparator();
  }
}

