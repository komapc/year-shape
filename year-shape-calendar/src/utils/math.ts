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
  
  // Improved superellipse formula with smooth transition
  // cornerRadius: 0 = square weeks, 1 = circle weeks
  // Use higher exponent for sharper corners, lower for rounder
  const n = 2.5 + ((1 - cornerRadius) * 8); // Range: 2.5 (circle) to 10.5 (square)
  
  // Calculate radius using superellipse formula
  const denominator = Math.pow(Math.abs(x), n) + Math.pow(Math.abs(y), n);
  const r = denominator > 0 ? Math.pow(denominator, -1 / n) : 1.0;
  
  // Better normalization for consistent perimeter
  // As shape gets squarer, we need less adjustment
  const normalizationFactor = 1.0 + cornerRadius * 0.35;
  
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

