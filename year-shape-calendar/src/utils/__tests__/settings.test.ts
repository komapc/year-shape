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
      expect(settings.theme).toBe('dark');
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
        theme: 'dark',
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
        theme: 'light',
      };

      saveSettings(original);
      const loaded1 = loadSettings();
      saveSettings(loaded1);
      const loaded2 = loadSettings();
      
      expect(loaded2).toEqual(original);
    });
  });
});

