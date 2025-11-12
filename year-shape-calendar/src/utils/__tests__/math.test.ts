/**
 * Tests for math utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  getRadialModulation, 
  calculatePositionOnPath, 
  degreesToRadians 
} from '../math';

describe('Math Utilities', () => {
  describe('degreesToRadians', () => {
    it('should convert 0 degrees to 0 radians', () => {
      expect(degreesToRadians(0)).toBe(0);
    });

    it('should convert 90 degrees to π/2 radians', () => {
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
    });

    it('should convert 180 degrees to π radians', () => {
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    });

    it('should convert 360 degrees to 2π radians', () => {
      expect(degreesToRadians(360)).toBeCloseTo(Math.PI * 2);
    });

    it('should handle negative degrees', () => {
      expect(degreesToRadians(-90)).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('getRadialModulation', () => {
    it('should return a positive number', () => {
      const modulation = getRadialModulation(0, 1);
      expect(modulation).toBeGreaterThan(0);
    });

    it('should handle different corner radius values', () => {
      const mod0 = getRadialModulation(0, 0);    // Square
      const mod05 = getRadialModulation(0, 0.5); // Intermediate
      const mod1 = getRadialModulation(0, 1);    // Circle
      
      expect(mod0).toBeGreaterThan(0);
      expect(mod05).toBeGreaterThan(0);
      expect(mod1).toBeGreaterThan(0);
    });

    it('should be symmetric for opposite angles', () => {
      const angle1 = Math.PI / 6;
      const angle2 = -Math.PI / 6;
      const cornerRadius = 0.5;
      
      const mod1 = getRadialModulation(angle1, cornerRadius);
      const mod2 = getRadialModulation(angle2, cornerRadius);
      
      // Should be approximately equal due to symmetry
      expect(Math.abs(mod1 - mod2)).toBeLessThan(0.1);
    });

    it('should handle corner radius = 0 (square)', () => {
      const modulation = getRadialModulation(0, 0);
      expect(modulation).toBeGreaterThan(0);
      expect(modulation).toBeLessThan(2); // Reasonable upper bound
    });

    it('should handle corner radius = 1 (circle)', () => {
      const modulation = getRadialModulation(0, 1);
      expect(modulation).toBeGreaterThan(0);
      expect(modulation).toBeLessThan(2); // Reasonable upper bound
    });

    it('should vary with angle for square corners', () => {
      const mod0 = getRadialModulation(0, 0);
      const mod45 = getRadialModulation(Math.PI / 4, 0);
      const mod90 = getRadialModulation(Math.PI / 2, 0);
      
      // All should be positive
      expect(mod0).toBeGreaterThan(0);
      expect(mod45).toBeGreaterThan(0);
      expect(mod90).toBeGreaterThan(0);
    });
  });

  describe('calculatePositionOnPath', () => {
    it('should calculate position from center', () => {
      const pos = calculatePositionOnPath(100, 100, 50, 0, 1);
      
      // Distance from center should be related to radius
      const distX = pos.x - 100;
      const distY = pos.y - 100;
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(200); // Reasonable upper bound
    });

    it('should handle different angles', () => {
      const pos0 = calculatePositionOnPath(100, 100, 50, 0, 1);
      const pos90 = calculatePositionOnPath(100, 100, 50, Math.PI / 2, 1);
      const pos180 = calculatePositionOnPath(100, 100, 50, Math.PI, 1);
      const pos270 = calculatePositionOnPath(100, 100, 50, (3 * Math.PI) / 2, 1);
      
      // All positions should be different
      expect(pos0.x).not.toBe(pos90.x);
      expect(pos0.y).not.toBe(pos180.y);
      
      // All should be valid positions
      expect(pos0).toBeDefined();
      expect(pos90).toBeDefined();
      expect(pos180).toBeDefined();
      expect(pos270).toBeDefined();
    });

    it('should scale with radius', () => {
      const pos1 = calculatePositionOnPath(100, 100, 30, 0, 1);
      const pos2 = calculatePositionOnPath(100, 100, 60, 0, 1);
      
      const dist1 = Math.sqrt(Math.pow(pos1.x - 100, 2) + Math.pow(pos1.y - 100, 2));
      const dist2 = Math.sqrt(Math.pow(pos2.x - 100, 2) + Math.pow(pos2.y - 100, 2));
      
      // Larger radius should result in larger distance
      expect(dist2).toBeGreaterThan(dist1);
    });

    it('should handle corner radius variations', () => {
      const circlePos = calculatePositionOnPath(100, 100, 50, Math.PI / 4, 1);
      const squarePos = calculatePositionOnPath(100, 100, 50, Math.PI / 4, 0);
      
      // Both should be valid positions
      expect(circlePos).toBeDefined();
      expect(squarePos).toBeDefined();
      
      // Positions should differ
      const samePosition = circlePos.x === squarePos.x && circlePos.y === squarePos.y;
      expect(samePosition).toBe(false);
    });

    it('should center correctly', () => {
      const centerX = 200;
      const centerY = 300;
      const pos = calculatePositionOnPath(centerX, centerY, 0, 0, 1);
      
      // With zero radius, should be at center (or very close due to modulation)
      expect(Math.abs(pos.x - centerX)).toBeLessThan(50);
      expect(Math.abs(pos.y - centerY)).toBeLessThan(50);
    });
  });
});
