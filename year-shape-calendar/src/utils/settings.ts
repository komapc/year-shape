/**
 * @fileoverview Settings Management - localStorage persistence for user preferences
 *
 * This module provides type-safe access to all application settings, including:
 * - Display preferences (moon phase, zodiac, Hebrew months)
 * - Calendar configuration (radius, direction, rotation)
 * - State persistence (current year, zoom navigation state)
 * - UI preferences (theme, locale)
 *
 * All settings are automatically saved to localStorage and restored on app launch.
 * Future enhancement: Server-side sync for multi-device support
 *
 * @module utils/settings
 */

import type { Direction, Season } from '../types';

export type CalendarMode = 'old' | 'rings' | 'zoom';
export type ZoomLevel = 'year' | 'month' | 'week' | 'day';

/**
 * Zoom mode state - persists the current navigation level and position
 */
export interface ZoomState {
  level: ZoomLevel;     // Current zoom level
  year: number;         // Current year being viewed
  month?: number;       // Current month (0-11) if in month/week/day level
  week?: number;        // Current week (0-51) if in week level
  day?: number;         // Current day (1-31) if in day level
}

/**
 * Application settings - all persisted user preferences
 */
export interface AppSettings {
  // Display settings
  showMoonPhase: boolean;
  showZodiac: boolean;
  showHebrewMonth: boolean;
  
  // Calendar configuration
  cornerRadius: number;           // 0-50 (slider value)
  direction: Direction;           // -1 (CCW) or 1 (CW)
  seasons: Season[];              // Order of seasons
  rotationOffset: number;         // 0, 90, 180, or 270
  mode: CalendarMode;             // 'old' | 'rings' | 'zoom'
  
  // State persistence
  currentYear: number;            // Last viewed year (all modes)
  zoomState?: ZoomState;          // Zoom mode navigation state
  
  // UI preferences
  theme?: 'light' | 'dark' | 'auto';
  locale?: 'en' | 'he' | 'ru' | 'es' | 'fr' | 'de' | 'eo' | 'uk' | 'tok' | 'pl' | 'be' | 'io';
}

const SETTINGS_KEY = 'yearwheel_settings';

const DEFAULT_SETTINGS: AppSettings = {
  // Display
  showMoonPhase: true,
  showZodiac: false,
  showHebrewMonth: false,
  
  // Calendar
  cornerRadius: 50,
  direction: -1,
  seasons: ['winter', 'spring', 'summer', 'autumn'],
  rotationOffset: 0,
  mode: 'zoom',
  
  // State persistence
  currentYear: new Date().getFullYear(),
  zoomState: {
    level: 'year',
    year: new Date().getFullYear(),
  },
  
  // UI preferences
  theme: 'auto',
  locale: 'en',
};

/**
 * Load settings from localStorage
 * 
 * Retrieves all saved user preferences and application state.
 * If localStorage is empty or corrupted, returns default settings.
 * Merges stored settings with defaults to ensure all required fields exist.
 * 
 * @returns {AppSettings} Complete settings object with all required fields
 * 
 * @example
 * ```typescript
 * const settings = loadSettings();
 * console.log(settings.theme); // 'auto' | 'light' | 'dark'
 * console.log(settings.currentYear); // 2025
 * ```
 */
export const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
};

/**
 * Save settings to localStorage
 * 
 * Persists all user preferences and application state.
 * Automatically called when settings change (year navigation, mode switch, etc).
 * 
 * @param {AppSettings} settings - Complete settings object to save
 * 
 * @example
 * ```typescript
 * const settings = loadSettings();
 * settings.theme = 'dark';
 * saveSettings(settings);
 * ```
 */
export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

/**
 * Update a specific setting
 * 
 * Convenience function to update a single setting without loading/saving manually.
 * Atomically loads current settings, updates the specified field, and saves.
 * 
 * @template K - Setting key type (ensures type safety)
 * @param {K} key - Setting key to update
 * @param {AppSettings[K]} value - New value for the setting
 * @returns {AppSettings} Updated settings object
 * 
 * @example
 * ```typescript
 * updateSetting('theme', 'dark');
 * updateSetting('currentYear', 2024);
 * updateSetting('zoomState', { level: 'month', year: 2024, month: 5 });
 * ```
 */
export const updateSetting = <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): AppSettings => {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
  return settings;
};

