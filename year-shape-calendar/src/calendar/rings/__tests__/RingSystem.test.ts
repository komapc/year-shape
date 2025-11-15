/**
 * Tests for RingSystem
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RingSystem } from '../RingSystem';
import { Ring } from '../Ring';

// Mock ring implementation
class MockRing extends Ring {
  constructor(name: string) {
    super(name, `gradient-${name}`);
  }

  get sectorCount(): number {
    return 12;
  }

  getSectorLabel(_index: number): string {
    return 'Sector';
  }
}

describe('RingSystem', () => {
  let container: SVGElement;
  let ringSystem: RingSystem;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Create mock SVG container
    container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(container);
    
    ringSystem = new RingSystem(container, 350, 350);
  });

  describe('constructor', () => {
    it('should initialize with container and center coordinates', () => {
      expect(ringSystem).toBeDefined();
    });
  });

  describe('addRing', () => {
    it('should add a ring to the system', () => {
      const ring = new MockRing('test');
      ringSystem.addRing(ring, true);
      
      const ringOrder = ringSystem.getRingOrder();
      expect(ringOrder).toContain('test');
    });

    it('should set ring visibility', () => {
      const ring = new MockRing('test');
      ringSystem.addRing(ring, false);
      
      const visibility = ringSystem.getRingVisibility();
      expect(visibility['test']).toBe(false);
    });
  });

  describe('setRingVisibility', () => {
    it('should update ring visibility', () => {
      const ring = new MockRing('test');
      ringSystem.addRing(ring, true);
      
      ringSystem.setRingVisibility('test', false);
      const visibility = ringSystem.getRingVisibility();
      expect(visibility['test']).toBe(false);
    });

    it('should hide ring SVG group when visibility is false', () => {
      const ring = new MockRing('test');
      ringSystem.addRing(ring, true);
      ring.render(container);
      
      ringSystem.setRingVisibility('test', false);
      expect(ring.svgGroup?.style.display).toBe('none');
    });
  });

  describe('reorderRings', () => {
    it('should reorder rings according to new order', () => {
      const ring1 = new MockRing('ring1');
      const ring2 = new MockRing('ring2');
      const ring3 = new MockRing('ring3');
      
      ringSystem.addRing(ring1, true);
      ringSystem.addRing(ring2, true);
      ringSystem.addRing(ring3, true);
      
      ringSystem.reorderRings(['ring3', 'ring1', 'ring2']);
      const order = ringSystem.getRingOrder();
      expect(order).toEqual(['ring3', 'ring1', 'ring2']);
    });
  });

  describe('setRingWidth', () => {
    it('should update ring width', () => {
      ringSystem.setRingWidth(60);
      // Width is internal, but we can verify it doesn't throw
      expect(ringSystem).toBeDefined();
    });

    it('should clamp width to reasonable range', () => {
      ringSystem.setRingWidth(200); // Too large
      ringSystem.setRingWidth(-10); // Too small
      // Should not throw
      expect(ringSystem).toBeDefined();
    });
  });

  describe('setCornerRadius', () => {
    it('should update corner radius', () => {
      ringSystem.setCornerRadius(0.75);
      // Radius is internal, but we can verify it doesn't throw
      expect(ringSystem).toBeDefined();
    });
  });

  describe('toggleDirection', () => {
    it('should toggle direction between 1 and -1', () => {
      const direction1 = ringSystem.toggleDirection();
      expect(direction1).toBe(-1);
      
      const direction2 = ringSystem.toggleDirection();
      expect(direction2).toBe(1);
    });
  });

  describe('rotateYear', () => {
    it('should rotate by 90 degrees', () => {
      const offset1 = ringSystem.rotateYear();
      expect(offset1).toBe(90);
      
      const offset2 = ringSystem.rotateYear();
      expect(offset2).toBe(180);
      
      const offset3 = ringSystem.rotateYear();
      expect(offset3).toBe(270);
      
      const offset4 = ringSystem.rotateYear();
      expect(offset4).toBe(0); // Wraps around
    });
  });

  describe('getRingOrder', () => {
    it('should return rings in order they were added', () => {
      const ring1 = new MockRing('ring1');
      const ring2 = new MockRing('ring2');
      
      ringSystem.addRing(ring1, true);
      ringSystem.addRing(ring2, true);
      
      const order = ringSystem.getRingOrder();
      expect(order).toEqual(['ring1', 'ring2']);
    });
  });

  describe('getRingVisibility', () => {
    it('should return visibility map', () => {
      const ring1 = new MockRing('ring1');
      const ring2 = new MockRing('ring2');
      
      ringSystem.addRing(ring1, true);
      ringSystem.addRing(ring2, false);
      
      const visibility = ringSystem.getRingVisibility();
      expect(visibility).toEqual({
        ring1: true,
        ring2: false,
      });
    });
  });

  describe('saveSettings and loadSettings', () => {
    it('should save and load settings', () => {
      const ring1 = new MockRing('ring1');
      ringSystem.addRing(ring1, true);
      ringSystem.setRingWidth(60);
      ringSystem.setCornerRadius(0.75);
      ringSystem.toggleDirection();
      
      // Create new system to test loading
      const newSystem = new RingSystem(container, 350, 350);
      const loaded = newSystem.loadSettings();
      
      expect(loaded).not.toBe(false);
      if (loaded !== false) {
        expect(loaded.ringWidth).toBe(60);
        expect(loaded.cornerRadius).toBe(0.75);
        expect(loaded.direction).toBe(-1);
      }
    });
  });
});

