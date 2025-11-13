/**
 * Tests for theme utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSystemTheme, resolveTheme, applyTheme, watchSystemTheme } from '../theme';

describe('Theme Utilities', () => {
  beforeEach(() => {
    // Clean up DOM before each test
    document.body.className = '';
  });

  describe('getSystemTheme', () => {
    it('should return "dark" when system prefers dark mode', () => {
      // Mock matchMedia to return dark mode
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(getSystemTheme()).toBe('dark');
    });

    it('should return "light" when system prefers light mode', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(getSystemTheme()).toBe('light');
    });
  });

  describe('resolveTheme', () => {
    it('should return "light" for light preference', () => {
      expect(resolveTheme('light')).toBe('light');
    });

    it('should return "dark" for dark preference', () => {
      expect(resolveTheme('dark')).toBe('dark');
    });

    it('should resolve "auto" to system theme', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(resolveTheme('auto')).toBe('dark');
    });
  });

  describe('applyTheme', () => {
    it('should add light-theme class for light theme', () => {
      applyTheme('light');
      expect(document.body.classList.contains('light-theme')).toBe(true);
    });

    it('should remove light-theme class for dark theme', () => {
      document.body.classList.add('light-theme');
      applyTheme('dark');
      expect(document.body.classList.contains('light-theme')).toBe(false);
    });
  });

  describe('watchSystemTheme', () => {
    it('should register event listener and return cleanup function', () => {
      const callback = vi.fn();
      const mockAddEventListener = vi.fn();
      const mockRemoveEventListener = vi.fn();

      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      }));

      const cleanup = watchSystemTheme(callback);

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      expect(typeof cleanup).toBe('function');

      // Call cleanup
      cleanup();
      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should call callback when system theme changes', () => {
      const callback = vi.fn();
      let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;

      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
          changeHandler = handler;
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      watchSystemTheme(callback);

      // Simulate theme change to dark
      expect(changeHandler).not.toBeNull();
      changeHandler!({ matches: true } as MediaQueryListEvent);
      expect(callback).toHaveBeenCalledWith('dark');
    });
  });
});

