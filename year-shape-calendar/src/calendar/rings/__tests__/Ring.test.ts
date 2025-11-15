/**
 * Tests for Ring base class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Ring } from '../Ring';

// Mock ring implementation for testing
class TestRing extends Ring {
  private sectors: string[];

  constructor(sectors: string[] = ['Sector 1', 'Sector 2', 'Sector 3']) {
    super('test-ring', 'gradient-test');
    this.sectors = sectors;
  }

  get sectorCount(): number {
    return this.sectors.length;
  }

  getSectorLabel(index: number): string {
    return this.sectors[index] || '';
  }
}

describe('Ring', () => {
  let container: SVGElement;
  let ring: TestRing;

  beforeEach(() => {
    // Create a mock SVG container
    container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(container);
    ring = new TestRing();
  });

  describe('constructor', () => {
    it('should initialize with name and gradientId', () => {
      expect(ring.name).toBe('test-ring');
      expect(ring.gradientId).toBe('gradient-test');
    });
  });

  describe('render', () => {
    it('should create SVG group and append to container', () => {
      ring.render(container);
      expect(ring.svgGroup).not.toBeNull();
      expect(container.querySelector('.ring-test-ring')).not.toBeNull();
    });

    it('should create group with correct class name', () => {
      ring.render(container);
      expect(ring.svgGroup?.getAttribute('class')).toBe('ring ring-test-ring');
    });
  });

  describe('layout', () => {
    beforeEach(() => {
      ring.render(container);
    });

    it('should layout sectors with correct count', () => {
      ring.layout(350, 350, 100, 150, 0.5, 1, 0);
      const sectors = ring.svgGroup?.querySelectorAll('.ring-sector-group');
      expect(sectors?.length).toBe(3);
    });

    it('should set center and radius properties', () => {
      ring.layout(350, 350, 100, 150, 0.5, 1, 0);
      expect(ring.centerX).toBe(350);
      expect(ring.centerY).toBe(350);
      expect(ring.innerRadius).toBe(100);
      expect(ring.outerRadius).toBe(150);
      expect(ring.cornerRadius).toBe(0.5);
      expect(ring.direction).toBe(1);
    });

    it('should clear previous content on layout', () => {
      ring.layout(350, 350, 100, 150, 0.5, 1, 0);
      const firstSectorCount = ring.svgGroup?.querySelectorAll('.ring-sector-group').length;
      
      ring.layout(350, 350, 100, 150, 0.5, 1, 0);
      const secondSectorCount = ring.svgGroup?.querySelectorAll('.ring-sector-group').length;
      
      expect(firstSectorCount).toBe(secondSectorCount);
    });
  });

  describe('getSectorColor', () => {
    it('should return gradient URL by default', () => {
      const color = ring.getSectorColor(0);
      expect(color).toBe('url(#gradient-test)');
    });
  });

  describe('calculatePerimeter', () => {
    it('should calculate perimeter for circle (cornerRadius = 1)', () => {
      ring.centerX = 350;
      ring.centerY = 350;
      ring.cornerRadius = 1;
      ring.outerRadius = 100;
      
      const perimeter = ring.calculatePerimeter(100);
      const expectedPerimeter = 2 * Math.PI * 100;
      
      // Allow small tolerance for numerical precision
      expect(Math.abs(perimeter - expectedPerimeter)).toBeLessThan(1);
    });

    it('should calculate perimeter for square (cornerRadius = 0)', () => {
      ring.centerX = 350;
      ring.centerY = 350;
      ring.cornerRadius = 0;
      ring.outerRadius = 100;
      
      const perimeter = ring.calculatePerimeter(100);
      // For a square inscribed in a circle of radius 100:
      // Side length = 2 * radius / sqrt(2) = 2 * 100 / sqrt(2) = 100 * sqrt(2)
      // Perimeter = 4 * side = 4 * 100 * sqrt(2) = 400 * sqrt(2) ≈ 565.69
      const expectedPerimeter = 400 * Math.sqrt(2);
      
      // Allow tolerance for numerical precision (path approximation)
      expect(Math.abs(perimeter - expectedPerimeter)).toBeLessThan(10);
    });
  });

  describe('getPointOnShape', () => {
    beforeEach(() => {
      ring.centerX = 350;
      ring.centerY = 350;
      ring.cornerRadius = 1; // Circle
    });

    it('should return point on circle when cornerRadius is 1', () => {
      const point = ring.getPointOnShape(0, 100); // Angle 0 (right)
      const expectedX = 350 + 100; // centerX + radius
      const expectedY = 350; // centerY
      
      expect(Math.abs(point.x - expectedX)).toBeLessThan(0.1);
      expect(Math.abs(point.y - expectedY)).toBeLessThan(0.1);
    });

    it('should interpolate between circle and square', () => {
      ring.cornerRadius = 0.5;
      const point = ring.getPointOnShape(0, 100);
      
      // Point should be between circle and square positions
      expect(point.x).toBeGreaterThan(350);
      expect(point.x).toBeLessThan(450);
    });
  });
});

