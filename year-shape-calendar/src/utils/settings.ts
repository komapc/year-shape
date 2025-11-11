/**
 * Settings management using localStorage
 * All application configuration is stored here for future server-side sync
 */

import type { Direction, Season } from '../types';

export interface AppSettings {
  // Display settings
  showMoonPhase: boolean;
  showZodiac: boolean;
  
  // Calendar configuration
  cornerRadius: number;           // 0-50 (slider value)
  direction: Direction;           // -1 (CCW) or 1 (CW)
  seasons: Season[];              // Order of seasons
  rotationOffset: number;         // 0, 90, 180, or 270
  
  // UI preferences (future)
  theme?: 'light' | 'dark';
  language?: string;
}

const SETTINGS_KEY = 'yearwheel_settings';

const DEFAULT_SETTINGS: AppSettings = {
  // Display
  showMoonPhase: true,
  showZodiac: false,
  
  // Calendar
  cornerRadius: 50,
  direction: -1,
  seasons: ['winter', 'spring', 'summer', 'autumn'],
  rotationOffset: 0,
};

/**
 * Load settings from localStorage
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

