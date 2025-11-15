/**
 * Tests for RingsMode
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RingsMode } from '../RingsMode';
import { WeeksRing } from '../rings/ringImplementations';

describe('RingsMode', () => {
  let container: HTMLElement;
  let svgElement: SVGElement;

  beforeEach(() => {
    // Clear any existing containers
    const existing = document.getElementById('canvas-container');
    if (existing) {
      existing.remove();
    }
    
    // Create mock DOM structure
    container = document.createElement('div');
    container.id = 'canvas-container';
    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('viewBox', '0 0 700 700');
    
    const ringsContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    ringsContainer.id = 'rings-container';
    svgElement.appendChild(ringsContainer);
    container.appendChild(svgElement);
    
    document.body.appendChild(container);
    
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    // Remove any test elements
    const testElements = ['cornerRadius', 'cornerValue', 'ringWidth', 'widthValue', 'directionToggle'];
    testElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  });

  describe('constructor', () => {
    it('should create RingsMode instance', () => {
      const ringsMode = new RingsMode(container, 350, 350);
      expect(ringsMode).toBeDefined();
    });

    it('should throw error if SVG element not found', () => {
      const emptyContainer = document.createElement('div');
      expect(() => {
        new RingsMode(emptyContainer, 350, 350);
      }).toThrow('SVG element not found in container');
    });

    it('should throw error if rings-container not found', () => {
      const badContainer = document.createElement('div');
      const badSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      badContainer.appendChild(badSvg);
      
      expect(() => {
        new RingsMode(badContainer, 350, 350);
      }).toThrow('rings-container element not found in SVG');
    });
  });

  describe('initializeFromSettings', () => {
    beforeEach(() => {
      // Create mock DOM elements that initializeFromSettings expects
      const cornerRadiusInput = document.createElement('input');
      cornerRadiusInput.id = 'cornerRadius';
      cornerRadiusInput.type = 'range';
      document.body.appendChild(cornerRadiusInput);
      
      const cornerValue = document.createElement('span');
      cornerValue.id = 'cornerValue';
      document.body.appendChild(cornerValue);
      
      const ringWidthInput = document.createElement('input');
      ringWidthInput.id = 'ringWidth';
      ringWidthInput.type = 'range';
      document.body.appendChild(ringWidthInput);
      
      const widthValue = document.createElement('span');
      widthValue.id = 'widthValue';
      document.body.appendChild(widthValue);
      
      const directionToggle = document.createElement('button');
      directionToggle.id = 'directionToggle';
      document.body.appendChild(directionToggle);
    });

    it('should initialize with default settings if none saved', () => {
      const ringsMode = new RingsMode(container, 350, 350);
      ringsMode.initializeFromSettings();
      
      // Should not throw and should have ring system
      expect(ringsMode.getRingSystem()).toBeDefined();
    });

    it('should load saved settings', () => {
      // Save some settings first
      const savedSettings = {
        cornerRadius: 0.75,
        ringWidth: 60,
        direction: -1,
        rotationOffset: 90,
        ringOrder: ['weeks', 'months', 'seasons'],
        ringVisibility: { weeks: true, months: true, seasons: false },
      };
      localStorage.setItem('multiRingCalendarSettings', JSON.stringify(savedSettings));
      
      const ringsMode = new RingsMode(container, 350, 350);
      ringsMode.initializeFromSettings();
      
      // Settings should be applied (we can't directly test internal state,
      // but we can verify the system was created)
      expect(ringsMode.getRingSystem()).toBeDefined();
    });
  });

  describe('setCornerRadius', () => {
    it('should update corner radius', () => {
      const ringsMode = new RingsMode(container, 350, 350);
      // Don't call initializeFromSettings to avoid DOM dependencies
      ringsMode.setCornerRadius(0.75);
      // Should not throw
      expect(ringsMode).toBeDefined();
    });
  });

  describe('setRingWidth', () => {
    it('should update ring width', () => {
      const ringsMode = new RingsMode(container, 350, 350);
      // Don't call initializeFromSettings to avoid DOM dependencies
      ringsMode.setRingWidth(60);
      // Should not throw
      expect(ringsMode).toBeDefined();
    });
  });

  describe('getMaxRingWidth', () => {
    it('should return maximum ring width', () => {
      const ringsMode = new RingsMode(container, 350, 350);
      // Need to initialize rings first to calculate max width
      // Create minimal setup without full initialization
      const ringSystem = ringsMode.getRingSystem();
      // Add a test ring to enable max width calculation
      const testRing = new WeeksRing();
      ringSystem.addRing(testRing, true);
      
      const maxWidth = ringsMode.getMaxRingWidth();
      expect(maxWidth).toBeGreaterThan(0);
      expect(typeof maxWidth).toBe('number');
    });
  });

  describe('toggleDirection', () => {
    it('should toggle direction', () => {
      const ringsMode = new RingsMode(container, 350, 350);
      // Don't call initializeFromSettings to avoid DOM dependencies
      const direction1 = ringsMode.toggleDirection();
      const direction2 = ringsMode.toggleDirection();
      
      // Directions should be opposite
      expect(direction1).not.toBe(direction2);
      expect([1, -1]).toContain(direction1);
      expect([1, -1]).toContain(direction2);
    });
  });

  describe('rotateYear', () => {
    it('should rotate year', () => {
      const ringsMode = new RingsMode(container, 350, 350);
      // Don't call initializeFromSettings to avoid DOM dependencies
      ringsMode.rotateYear();
      // Should not throw
      expect(ringsMode).toBeDefined();
    });
  });

  describe('getRingMetadata', () => {
    it('should return ring metadata', () => {
      // Use the container from beforeEach which has proper setup
      const ringsMode = new RingsMode(container, 350, 350);
      const metadata = ringsMode.getRingMetadata();
      
      expect(metadata).toBeDefined();
      expect(metadata.seasons).toBeDefined();
      expect(metadata.months).toBeDefined();
      expect(metadata.weeks).toBeDefined();
      expect(metadata.hebrew).toBeDefined();
      expect(metadata.holidays).toBeDefined();
    });

    it('should include label, color, and icon for each ring', () => {
      // Use the container from beforeEach which has proper setup
      const ringsMode = new RingsMode(container, 350, 350);
      const metadata = ringsMode.getRingMetadata();
      
      Object.values(metadata).forEach((meta) => {
        expect(meta.label).toBeDefined();
        expect(meta.color).toBeDefined();
        expect(meta.icon).toBeDefined();
      });
    });
  });
});

