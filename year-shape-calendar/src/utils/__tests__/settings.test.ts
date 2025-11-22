/**
 * Tests for settings utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadSettings, saveSettings } from '../settings';
import type { AppSettings } from '../settings';

describe('Settings Utilities', () => {
  const SETTINGS_KEY = 'yearwheel_settings';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('loadSettings', () => {
    it('should return default settings when localStorage is empty', () => {
      const settings = loadSettings();
      
      expect(settings).toBeDefined();
      expect(settings.showMoonPhase).toBe(true);
      expect(settings.showZodiac).toBe(false);
      expect(settings.showHebrewMonth).toBe(false);
      expect(settings.cornerRadius).toBe(50);
      expect(settings.direction).toBe(-1);
      expect(settings.theme).toBe('auto');
    });

    it('should load saved settings from localStorage', () => {
      const customSettings: AppSettings = {
        showMoonPhase: false,
        showZodiac: true,
        showHebrewMonth: true,
        cornerRadius: 25,
        direction: 1,
        seasons: ['spring', 'summer', 'autumn', 'winter'],
        rotationOffset: 90,
        mode: 'old',
        currentYear: 2023,
        theme: 'light',
      };

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(customSettings));
      
      const loaded = loadSettings();
      
      expect(loaded.showMoonPhase).toBe(false);
      expect(loaded.showZodiac).toBe(true);
      expect(loaded.showHebrewMonth).toBe(true);
      expect(loaded.cornerRadius).toBe(25);
      expect(loaded.direction).toBe(1);
      expect(loaded.theme).toBe('light');
    });

    it('should merge with defaults if partial settings are stored', () => {
      const partialSettings = {
        showMoonPhase: false,
        showZodiac: true,
      };

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(partialSettings));
      
      const loaded = loadSettings();
      
      expect(loaded.showMoonPhase).toBe(false);
      expect(loaded.showZodiac).toBe(true);
      expect(loaded.cornerRadius).toBe(50); // Default value
      expect(loaded.direction).toBe(-1); // Default value
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem(SETTINGS_KEY, 'invalid json{');
      
      const settings = loadSettings();
      
      // Should return defaults
      expect(settings).toBeDefined();
      expect(settings.showMoonPhase).toBe(true);
    });
  });

  describe('saveSettings', () => {
    it('should save settings to localStorage', () => {
      const settings: AppSettings = {
        showMoonPhase: false,
        showZodiac: true,
        showHebrewMonth: true,
        cornerRadius: 30,
        direction: 1,
        seasons: ['winter', 'spring', 'summer', 'autumn'],
        rotationOffset: 0,
        mode: 'old',
        currentYear: 2024,
        theme: 'light',
      };

      saveSettings(settings);
      
      const stored = localStorage.getItem(SETTINGS_KEY);
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.showMoonPhase).toBe(false);
      expect(parsed.showZodiac).toBe(true);
      expect(parsed.cornerRadius).toBe(30);
      expect(parsed.theme).toBe('light');
    });

    it('should overwrite existing settings', () => {
      const settings1: AppSettings = {
        showMoonPhase: true,
        showZodiac: false,
        showHebrewMonth: false,
        cornerRadius: 50,
        direction: -1,
        seasons: ['winter', 'spring', 'summer', 'autumn'],
        rotationOffset: 0,
        mode: 'old',
        currentYear: 2025,
        theme: 'dark',
      };

      const settings2: AppSettings = {
        ...settings1,
        showMoonPhase: false,
        theme: 'light',
      };

      saveSettings(settings1);
      saveSettings(settings2);
      
      const loaded = loadSettings();
      expect(loaded.showMoonPhase).toBe(false);
      expect(loaded.theme).toBe('light');
    });

    it('should persist all settings fields', () => {
      const settings: AppSettings = {
        showMoonPhase: true,
        showZodiac: true,
        showHebrewMonth: true,
        cornerRadius: 42,
        direction: 1,
        seasons: ['spring', 'summer', 'autumn', 'winter'],
        rotationOffset: 180,
        mode: 'old',
        currentYear: 2024,
        zoomState: {
          level: 'month',
          year: 2024,
          month: 5,
        },
        theme: 'dark',
        locale: 'en',
      };

      saveSettings(settings);
      const loaded = loadSettings();
      
      expect(loaded).toEqual(settings);
    });
  });

  describe('Settings persistence', () => {
    it('should persist settings across load/save cycles', () => {
      const original: AppSettings = {
        showMoonPhase: false,
        showZodiac: true,
        showHebrewMonth: true,
        cornerRadius: 33,
        direction: 1,
        seasons: ['winter', 'spring', 'summer', 'autumn'],
        rotationOffset: 270,
        mode: 'old',
        currentYear: 2023,
        zoomState: {
          level: 'week',
          year: 2023,
          week: 25,
        },
        theme: 'light',
        locale: 'he',
      };

      saveSettings(original);
      const loaded1 = loadSettings();
      saveSettings(loaded1);
      const loaded2 = loadSettings();
      
      expect(loaded2).toEqual(original);
    });
    
    it('should persist zoom state correctly', () => {
      const settings: AppSettings = {
        ...loadSettings(),
        mode: 'zoom',
        currentYear: 2024,
        zoomState: {
          level: 'day',
          year: 2024,
          month: 10,
          week: 45,
          day: 15,
        },
      };

      saveSettings(settings);
      const loaded = loadSettings();
      
      expect(loaded.zoomState).toEqual(settings.zoomState);
      expect(loaded.zoomState?.level).toBe('day');
      expect(loaded.zoomState?.year).toBe(2024);
      expect(loaded.zoomState?.month).toBe(10);
      expect(loaded.zoomState?.week).toBe(45);
      expect(loaded.zoomState?.day).toBe(15);
    });
  });
});

