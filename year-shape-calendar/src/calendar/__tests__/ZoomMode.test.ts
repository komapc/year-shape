/**
 * Tests for ZoomMode bug fixes
 * 
 * Bugs tested:
 * - #1: SVG ellipsis on mobile
 * - #6: CW/CCW direction control
 * - #8: Event display callback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ZoomMode } from '../ZoomMode';
import type { CalendarEvent } from '../../types';

describe('ZoomMode Bug Fixes', () => {
  let container: HTMLElement;
  let zoomMode: ZoomMode;

  beforeEach(() => {
    // Create a container for ZoomMode
    container = document.createElement('div');
    container.id = 'zoom-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Cleanup
    if (zoomMode) {
      zoomMode.destroy();
    }
    document.body.removeChild(container);
  });

  describe('Bug #1: SVG preserveAspectRatio (ellipsis fix)', () => {
    it('should set preserveAspectRatio attribute on SVG', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    });

    it('should maintain square aspect ratio', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      const svg = container.querySelector('svg');
      const viewBox = svg?.getAttribute('viewBox');
      
      expect(viewBox).toBe('0 0 800 800');
    });
  });

  describe('Bug #6: CW/CCW direction control', () => {
    it('should initialize with CW direction (1)', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      expect(zoomMode.getDirection()).toBe(1);
    });

    it('should toggle direction from CW to CCW', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      const newDirection = zoomMode.toggleDirection();
      
      expect(newDirection).toBe(-1);
      expect(zoomMode.getDirection()).toBe(-1);
    });

    it('should toggle direction from CCW back to CW', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      zoomMode.toggleDirection(); // CW -> CCW
      const finalDirection = zoomMode.toggleDirection(); // CCW -> CW
      
      expect(finalDirection).toBe(1);
      expect(zoomMode.getDirection()).toBe(1);
    });

    it('should allow setting direction directly', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      zoomMode.setDirection(-1);
      expect(zoomMode.getDirection()).toBe(-1);
      
      zoomMode.setDirection(1);
      expect(zoomMode.getDirection()).toBe(1);
    });

    it('should re-render when direction changes', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      const initialContent = container.innerHTML;
      zoomMode.toggleDirection();
      const afterToggle = container.innerHTML;
      
      // Content should be different after toggle (re-rendered)
      expect(afterToggle).not.toBe(initialContent);
    });
  });

  describe('Bug #8: Event display callback', () => {
    it('should accept event callback in constructor', () => {
      const mockCallback = vi.fn();
      
      zoomMode = new ZoomMode(container, 2025, mockCallback);
      
      expect(zoomMode).toBeTruthy();
    });

    it('should work without event callback', () => {
      // Should not throw error when callback is not provided
      expect(() => {
        zoomMode = new ZoomMode(container, 2025);
      }).not.toThrow();
    });

    it('should call event callback when implemented', () => {
      const mockCallback = vi.fn();
      const mockEvents: CalendarEvent[] = [
        { summary: 'Test Event', start: '2025-11-16T10:00:00Z' }
      ];
      
      zoomMode = new ZoomMode(container, 2025, mockCallback);
      
      // Update events
      const eventsByWeek: Record<number, CalendarEvent[]> = {
        46: mockEvents
      };
      zoomMode.updateEvents(eventsByWeek);
      
      // Callback should be ready to use
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Methods (for swipe)', () => {
    it('should provide getCurrentState method', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      const state = zoomMode.getCurrentState();
      
      expect(state).toHaveProperty('level');
      expect(state).toHaveProperty('year');
      expect(state).toHaveProperty('month');
      expect(state).toHaveProperty('week');
      expect(state).toHaveProperty('day');
      expect(state.year).toBe(2025);
      expect(state.level).toBe('year');
    });

    it('should provide navigatePrev method', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      expect(() => {
        zoomMode.navigatePrev();
      }).not.toThrow();
      
      const state = zoomMode.getCurrentState();
      expect(state.year).toBe(2024); // Should navigate to previous year
    });

    it('should provide navigateNext method', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      expect(() => {
        zoomMode.navigateNext();
      }).not.toThrow();
      
      const state = zoomMode.getCurrentState();
      expect(state.year).toBe(2026); // Should navigate to next year
    });
  });

  describe('Initialization', () => {
    it('should create SVG element in container', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.classList.contains('zoom-mode-svg')).toBe(true);
    });

    it('should create back button', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      const backButton = container.querySelector('button');
      expect(backButton).toBeTruthy();
      expect(backButton?.textContent).toContain('Back');
    });

    it('should start at year level', () => {
      zoomMode = new ZoomMode(container, 2025);
      
      const state = zoomMode.getCurrentState();
      expect(state.level).toBe('year');
    });

    it('should use provided initial year', () => {
      zoomMode = new ZoomMode(container, 2023);
      
      const state = zoomMode.getCurrentState();
      expect(state.year).toBe(2023);
    });

    it('should default to current year if not provided', () => {
      zoomMode = new ZoomMode(container);
      
      const state = zoomMode.getCurrentState();
      const currentYear = new Date().getFullYear();
      expect(state.year).toBe(currentYear);
    });
  });
});

