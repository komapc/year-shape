/**
 * Mathematical utilities for calendar positioning
 */

import type { Position } from '../types';

/**
 * Convert degrees to radians
 */
export const degreesToRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculate position on circular/rounded-square path
 */
export const calculatePositionOnPath = (
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
  cornerRadius = 0.5
): Position => {
  const modulation = getRadialModulation(angle, cornerRadius);
  const modulatedRadius = radius * modulation;
  
  return {
    x: centerX + Math.cos(angle) * modulatedRadius,
    y: centerY + Math.sin(angle) * modulatedRadius,
  };
};

/**
 * Radial modulation to create rounded-corner square path
 * This creates a smooth transition between circle and square
 * Uses superellipse formula for proper square with rounded corners
 */
export const getRadialModulation = (angle: number, cornerRadius = 0.5): number => {
  // Normalize angle to 0-2π
  const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  
  const x = Math.cos(normalizedAngle);
  const y = Math.sin(normalizedAngle);
  
  // Superellipse formula with INVERTED mapping
  // cornerRadius: 0 = circle weeks, 1 = square weeks (opposite of border!)
  // This way when border is square (0), weeks are circular, and vice versa
  // Higher n = more square-like, lower n = more circle-like
  const n = 2.0 + ((1 - cornerRadius) * 10); // Inverted: 12 when cornerRadius=0, 2 when cornerRadius=1
  
  // Calculate radius using superellipse formula
  const denominator = Math.pow(Math.abs(x), n) + Math.pow(Math.abs(y), n);
  const r = Math.pow(denominator, -1 / n);
  
  // Normalize to ensure consistent size
  const normalizationFactor = 1.0 + cornerRadius * 0.41;
  
  return r * normalizationFactor;
};

/**
 * Map a value from one range to another
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

