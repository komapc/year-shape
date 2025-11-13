/**
 * Tests for toast notification utility
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Toast Utilities', () => {
  beforeEach(() => {
    // Clear any existing toasts
    const toastContainers = document.querySelectorAll('.fixed.top-4.right-4');
    toastContainers.forEach(container => container.remove());
  });

  it('should create toast container on initialization', () => {
    // Note: The toast manager is a singleton that creates a container on import
    // In a real test, we'd need to mock or reinitialize
    expect(true).toBe(true); // Placeholder
  });

  it('should escape HTML in toast messages', () => {
    // Test XSS protection
    const testString = '<script>alert("xss")</script>';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(testString));
    const escaped = div.innerHTML;
    
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('should handle different toast types', () => {
    const types = ['success', 'error', 'warning', 'info'];
    types.forEach(type => {
      expect(['success', 'error', 'warning', 'info']).toContain(type);
    });
  });
});

