/**
 * Tests for Animation utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  Easing,
  Animator,
  lerp,
  clamp,
  mapRange,
} from "../animation";

describe("Animation Utilities", () => {
  describe("Easing functions", () => {
    it("linear should return input unchanged", () => {
      expect(Easing.linear(0)).toBe(0);
      expect(Easing.linear(0.5)).toBe(0.5);
      expect(Easing.linear(1)).toBe(1);
    });

    it("easeOutQuart should ease out", () => {
      const result = Easing.easeOutQuart(0.5);
      expect(result).toBeGreaterThan(0.5); // Should be ahead of linear
      expect(result).toBeLessThan(1);
    });

    it("easeOutQuart should start and end at correct values", () => {
      expect(Easing.easeOutQuart(0)).toBe(0);
      expect(Easing.easeOutQuart(1)).toBe(1);
    });

    it("easeInOutCubic should ease in and out", () => {
      const result = Easing.easeInOutCubic(0.5);
      expect(result).toBeCloseTo(0.5, 1); // Should be near linear at midpoint
    });

    it("easeOutCubic should ease out", () => {
      const result = Easing.easeOutCubic(0.5);
      expect(result).toBeGreaterThan(0.5);
    });

    it("easeInOutExpo should handle edge cases", () => {
      expect(Easing.easeInOutExpo(0)).toBe(0);
      expect(Easing.easeInOutExpo(1)).toBe(1);
    });

    it("easeOutElastic should handle edge cases", () => {
      expect(Easing.easeOutElastic(0)).toBe(0);
      expect(Easing.easeOutElastic(1)).toBe(1);
    });

    it("easeOutElastic should bounce", () => {
      // Elastic should go slightly above 1 before settling
      const samples = [0.6, 0.7, 0.8, 0.9];
      const values = samples.map((t) => Easing.easeOutElastic(t));
      const maxValue = Math.max(...values);
      expect(maxValue).toBeGreaterThan(1);
    });
  });

  describe("Animator", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should call onUpdate with progress", () => {
      const animator = new Animator();
      const onUpdate = vi.fn();

      animator.start({
        duration: 1000,
        easing: Easing.linear,
        onUpdate,
      });

      // Simulate animation frames
      vi.advanceTimersByTime(500);
      expect(onUpdate).toHaveBeenCalled();

      animator.stop();
    });

    it("should call onComplete when animation finishes", () => {
      const animator = new Animator();
      const onComplete = vi.fn();

      animator.start({
        duration: 1000,
        easing: Easing.linear,
        onUpdate: vi.fn(),
        onComplete,
      });

      // Complete the animation
      vi.advanceTimersByTime(1100);
      expect(onComplete).toHaveBeenCalled();
    });

    it("should stop animation when stop() is called", () => {
      const animator = new Animator();
      const onUpdate = vi.fn();

      animator.start({
        duration: 1000,
        easing: Easing.linear,
        onUpdate,
      });

      expect(animator.isAnimating()).toBe(true);
      animator.stop();
      expect(animator.isAnimating()).toBe(false);
    });

    it("should handle delay before starting", () => {
      const animator = new Animator();
      const onUpdate = vi.fn();

      animator.start({
        duration: 1000,
        easing: Easing.linear,
        onUpdate,
        delay: 500,
      });

      expect(animator.isAnimating()).toBe(true); // Waiting in delay
      vi.advanceTimersByTime(400);
      expect(onUpdate).not.toHaveBeenCalled(); // Still in delay

      vi.advanceTimersByTime(200);
      // Now animation should have started
      expect(onUpdate).toHaveBeenCalled();

      animator.stop();
    });

    it("should cancel delay when stopped", () => {
      const animator = new Animator();
      const onUpdate = vi.fn();

      animator.start({
        duration: 1000,
        easing: Easing.linear,
        onUpdate,
        delay: 500,
      });

      animator.stop();
      vi.advanceTimersByTime(600);
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should stop previous animation when starting new one", () => {
      const animator = new Animator();
      const onUpdate1 = vi.fn();
      const onUpdate2 = vi.fn();

      animator.start({
        duration: 1000,
        easing: Easing.linear,
        onUpdate: onUpdate1,
      });

      animator.start({
        duration: 1000,
        easing: Easing.linear,
        onUpdate: onUpdate2,
      });

      vi.advanceTimersByTime(100);
      // Only second animation should be called
      expect(onUpdate2).toHaveBeenCalled();
    });

    it("should report isAnimating correctly", () => {
      const animator = new Animator();

      expect(animator.isAnimating()).toBe(false);

      animator.start({
        duration: 1000,
        easing: Easing.linear,
        onUpdate: vi.fn(),
      });

      expect(animator.isAnimating()).toBe(true);

      animator.stop();
      expect(animator.isAnimating()).toBe(false);
    });
  });

  describe("lerp", () => {
    it("should interpolate correctly", () => {
      expect(lerp(0, 100, 0)).toBe(0);
      expect(lerp(0, 100, 0.5)).toBe(50);
      expect(lerp(0, 100, 1)).toBe(100);
    });

    it("should handle negative values", () => {
      expect(lerp(-100, 100, 0.5)).toBe(0);
      expect(lerp(-50, 50, 0.25)).toBe(-25);
    });

    it("should handle reverse interpolation", () => {
      expect(lerp(100, 0, 0.5)).toBe(50);
      expect(lerp(100, 0, 0.75)).toBe(25);
    });
  });

  describe("clamp", () => {
    it("should clamp values above max", () => {
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(200, 50, 100)).toBe(100);
    });

    it("should clamp values below min", () => {
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(25, 50, 100)).toBe(50);
    });

    it("should not clamp values within range", () => {
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(75, 0, 100)).toBe(75);
    });

    it("should handle negative ranges", () => {
      expect(clamp(0, -100, 100)).toBe(0);
      expect(clamp(-150, -100, 100)).toBe(-100);
    });
  });

  describe("mapRange", () => {
    it("should map values correctly", () => {
      expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
      expect(mapRange(0.5, 0, 1, 0, 360)).toBe(180);
    });

    it("should handle reverse mapping", () => {
      expect(mapRange(5, 0, 10, 100, 0)).toBe(50);
    });

    it("should handle negative values", () => {
      expect(mapRange(-5, -10, 10, 0, 100)).toBe(25);
    });

    it("should handle edge cases", () => {
      expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
      expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
    });

    it("should work with different scales", () => {
      expect(mapRange(50, 0, 100, 0, 1)).toBe(0.5);
      expect(mapRange(1, 0, 2, 0, 360)).toBe(180);
    });
  });
});

