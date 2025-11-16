/**
 * @fileoverview Animation utility functions
 *
 * Provides reusable animation utilities with easing functions and RAF-based animations.
 * Eliminates code duplication across calendar modes.
 *
 * @module utils/animation
 */

/**
 * Easing function type - takes progress (0-1) and returns eased value (0-1)
 */
export type EasingFunction = (t: number) => number;

/**
 * Common easing functions
 *
 * @example
 * const animator = new Animator();
 * animator.start({
 *   duration: 800,
 *   easing: Easing.easeOutQuart,
 *   onUpdate: (progress) => { ... }
 * });
 */
export const Easing = {
  /**
   * Linear easing (no easing)
   * @param t - Progress from 0 to 1
   * @returns Eased value from 0 to 1
   */
  linear: (t: number): number => t,

  /**
   * Ease out quartic
   * Starts fast, slows down at the end
   * Used in ZoomMode for fluent transitions
   * @param t - Progress from 0 to 1
   * @returns Eased value from 0 to 1
   */
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),

  /**
   * Ease in-out cubic
   * Accelerates then decelerates
   * @param t - Progress from 0 to 1
   * @returns Eased value from 0 to 1
   */
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  /**
   * Ease out cubic
   * Starts fast, slows down at the end
   * @param t - Progress from 0 to 1
   * @returns Eased value from 0 to 1
   */
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),

  /**
   * Ease in-out exponential
   * Very smooth acceleration and deceleration
   * @param t - Progress from 0 to 1
   * @returns Eased value from 0 to 1
   */
  easeInOutExpo: (t: number): number =>
    t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2,

  /**
   * Ease out elastic
   * Bounces at the end like a spring
   * @param t - Progress from 0 to 1
   * @returns Eased value from 0 to 1
   */
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * Configuration for an animation
 */
export interface AnimationConfig {
  /** Animation duration in milliseconds */
  duration: number;
  /** Easing function to use */
  easing: EasingFunction;
  /** Callback on each frame with progress (0-1) */
  onUpdate: (progress: number) => void;
  /** Optional callback when animation completes */
  onComplete?: () => void;
  /** Optional delay before starting (milliseconds) */
  delay?: number;
}

/**
 * RequestAnimationFrame-based animator
 *
 * Provides smooth, performant animations using RAF.
 * Handles timing, easing, and cleanup.
 *
 * @example
 * const animator = new Animator();
 * animator.start({
 *   duration: 800,
 *   easing: Easing.easeOutQuart,
 *   onUpdate: (progress) => {
 *     element.style.opacity = String(progress);
 *   },
 *   onComplete: () => {
 *     console.log('Animation complete!');
 *   }
 * });
 *
 * // Stop early if needed
 * animator.stop();
 */
export class Animator {
  private animationFrame: number | null = null;
  private startTime: number = 0;
  private config: AnimationConfig | null = null;
  private delayTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Start the animation
   * @param config - Animation configuration
   */
  start(config: AnimationConfig): void {
    // Stop any existing animation
    this.stop();

    this.config = config;

    // Handle delay if specified
    if (config.delay && config.delay > 0) {
      this.delayTimeout = setTimeout(() => {
        this.delayTimeout = null;
        this.startImmediate();
      }, config.delay);
    } else {
      this.startImmediate();
    }
  }

  /**
   * Start animation immediately (after delay if applicable)
   */
  private startImmediate(): void {
    if (!this.config) return;

    this.startTime = performance.now();
    this.animate();
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.config) return;

    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    const rawProgress = Math.min(elapsed / this.config.duration, 1);
    const easedProgress = this.config.easing(rawProgress);

    // Call update callback
    this.config.onUpdate(easedProgress);

    // Continue or complete
    if (rawProgress < 1) {
      this.animationFrame = requestAnimationFrame(this.animate);
    } else {
      // Animation complete
      this.animationFrame = null;
      const onComplete = this.config.onComplete;
      this.config = null;
      if (onComplete) {
        onComplete();
      }
    }
  };

  /**
   * Stop the animation
   * Cleans up RAF and timers
   */
  stop(): void {
    // Cancel delay timeout
    if (this.delayTimeout) {
      clearTimeout(this.delayTimeout);
      this.delayTimeout = null;
    }

    // Cancel animation frame
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.config = null;
  }

  /**
   * Check if animation is currently running
   * @returns True if animating
   */
  isAnimating(): boolean {
    return this.animationFrame !== null || this.delayTimeout !== null;
  }
}

/**
 * Lerp (linear interpolation) between two values
 *
 * @param start - Start value
 * @param end - End value
 * @param t - Progress (0-1)
 * @returns Interpolated value
 *
 * @example
 * const opacity = lerp(0, 1, 0.5); // 0.5
 * const scale = lerp(1, 2, 0.75); // 1.75
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 *
 * @example
 * clamp(150, 0, 100); // 100
 * clamp(-10, 0, 100); // 0
 * clamp(50, 0, 100); // 50
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map a value from one range to another
 *
 * @param value - Input value
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value
 *
 * @example
 * mapRange(5, 0, 10, 0, 100); // 50
 * mapRange(0.5, 0, 1, 0, 360); // 180
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

