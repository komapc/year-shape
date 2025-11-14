/**
 * @fileoverview Shared utilities for calendar mode navigation
 * 
 * Provides common functions for:
 * - Determining base path for navigation across deployment environments
 * - Building URLs for mode switching
 * - Getting mode from URL hash
 */

import type { CalendarMode } from './settings';

/**
 * Determines the base path for navigation based on current location.
 * Handles different deployment environments (root, /year-shape/, etc.)
 * 
 * @returns {string} Base path (e.g., "", "/year-shape")
 */
export const getBasePath = (): string => {
  const currentPath = window.location.pathname;
  
  if (currentPath.includes('/year-shape/')) {
    return '/year-shape';
  } else if (currentPath !== '/' && currentPath !== '/index.html' && currentPath !== '/rings.html') {
    // Extract base path from current path (e.g., /year-shape/rings.html -> /year-shape)
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      // Remove the file name, keep only base path
      return '/' + pathParts[0];
    }
  }
  
  return '';
};

/**
 * Builds a URL for navigating to a specific calendar mode
 * 
 * @param {CalendarMode} mode - The calendar mode to navigate to
 * @param {number} [year] - Optional year for zoom mode
 * @returns {string} Full URL path for the mode
 */
export const buildModeUrl = (mode: CalendarMode, year?: number): string => {
  const basePath = getBasePath();
  
  switch (mode) {
    case 'old':
      return `${basePath}/index.html#old`;
    case 'rings':
      return `${basePath}/rings.html`;
    case 'zoom':
      const currentYear = year || new Date().getFullYear();
      return `${basePath}/index.html#zoom/year/${currentYear}`;
    default:
      return `${basePath}/index.html#old`;
  }
};

/**
 * Extracts calendar mode from URL hash
 * 
 * @returns {CalendarMode | null} The mode from URL, or null if not found
 */
export const getModeFromHash = (): CalendarMode | null => {
  const hash = window.location.hash;
  
  if (hash.startsWith('#zoom/')) {
    return 'zoom';
  } else if (hash === '#old' || hash === '') {
    return 'old';
  } else if (window.location.pathname.includes('rings.html')) {
    return 'rings';
  }
  
  return null;
};

/**
 * Navigates to a specific calendar mode
 * 
 * @param {CalendarMode} mode - The calendar mode to navigate to
 * @param {number} [year] - Optional year for zoom mode
 */
export const navigateToMode = (mode: CalendarMode, year?: number): void => {
  const url = buildModeUrl(mode, year);
  window.location.href = url;
};

