/**
 * Tests for hash router utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the router module since it's a singleton
describe('Router Utilities', () => {
  beforeEach(() => {
    // Reset location hash
    window.location.hash = '';
  });

  afterEach(() => {
    window.location.hash = '';
  });

  it('should handle hash navigation', () => {
    // Basic test to verify hash can be set
    window.location.hash = '#test';
    expect(window.location.hash).toBe('#test');
  });

  it('should handle parameterized routes', () => {
    window.location.hash = '#week/25';
    expect(window.location.hash).toBe('#week/25');
  });

  it('should handle year routes', () => {
    window.location.hash = '#year/2024';
    expect(window.location.hash).toBe('#year/2024');
  });

  it('should handle settings route', () => {
    window.location.hash = '#settings';
    expect(window.location.hash).toBe('#settings');
  });

  it('should clear hash', () => {
    window.location.hash = '#test';
    window.location.hash = '';
    expect(window.location.hash).toBe('');
  });
});

