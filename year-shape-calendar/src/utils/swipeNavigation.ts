/**
 * @fileoverview Swipe Navigation Utility
 * 
 * Handles swipe left/right gestures to switch between calendar modes
 */

import { navigateToMode, getModeFromHash } from './modeNavigation';
import type { CalendarMode } from './settings';

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  isSwipe: boolean;
}

/**
 * Initialize swipe navigation for mode switching
 */
export const initializeSwipeNavigation = (): void => {
  let swipeState: SwipeState | null = null;
  const SWIPE_THRESHOLD = 50; // Minimum distance in pixels
  const SWIPE_MAX_VERTICAL = 100; // Maximum vertical movement to be considered horizontal swipe
  const SWIPE_MAX_TIME = 500; // Maximum time in ms for a swipe

  const handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length !== 1) {
      return; // Only handle single touch
    }

    swipeState = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      startTime: Date.now(),
      isSwipe: false,
    };
  };

  const handleTouchMove = (e: TouchEvent): void => {
    if (!swipeState || e.touches.length !== 1) {
      return;
    }

    const deltaX = Math.abs(e.touches[0].clientX - swipeState.startX);
    const deltaY = Math.abs(e.touches[0].clientY - swipeState.startY);

    // If horizontal movement is significantly more than vertical, it's a swipe
    if (deltaX > deltaY && deltaX > 10 && deltaY < SWIPE_MAX_VERTICAL) {
      swipeState.isSwipe = true;
    }
  };

  const handleTouchEnd = (e: TouchEvent): void => {
    if (!swipeState) {
      return;
    }

    if (e.changedTouches.length !== 1) {
      swipeState = null;
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - swipeState.startX;
    const deltaY = Math.abs(endY - swipeState.startY);
    const deltaTime = Date.now() - swipeState.startTime;

    // Check if it's a valid horizontal swipe
    if (
      swipeState.isSwipe &&
      Math.abs(deltaX) > SWIPE_THRESHOLD &&
      deltaY < SWIPE_MAX_VERTICAL &&
      deltaTime < SWIPE_MAX_TIME
    ) {
      const currentMode = getModeFromHash() || 'zoom';
      const modes: CalendarMode[] = ['old', 'rings', 'zoom'];
      const currentIndex = modes.indexOf(currentMode);

      if (deltaX > 0) {
        // Swipe right - go to previous mode
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : modes.length - 1;
        navigateToMode(modes[prevIndex]);
      } else {
        // Swipe left - go to next mode
        const nextIndex = currentIndex < modes.length - 1 ? currentIndex + 1 : 0;
        navigateToMode(modes[nextIndex]);
      }
    }

    swipeState = null;
  };

  // Attach event listeners to document
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });

  console.log('[SwipeNavigation] Initialized swipe left/right to switch modes');
};

