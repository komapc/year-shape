/**
 * Tests for the clickjacking frame-buster
 */

import { describe, it, expect } from 'vitest';
import { bustFrames } from '../frameBuster';

const fakeWindow = (framed: boolean, topNavigationThrows = false) => {
  const html = { style: { display: '' } };
  const self = {} as Record<string, unknown>;
  let topHref = 'https://evil.example/';
  const top = framed
    ? {
        location: {
          get href() { return topHref; },
          set href(v: string) {
            if (topNavigationThrows) throw new DOMException('blocked', 'SecurityError');
            topHref = v;
          },
        },
      }
    : self;
  Object.assign(self, {
    self,
    top,
    location: { href: 'https://yearwheel.lipu.dev/' },
    document: { documentElement: html },
  });
  return { win: self as unknown as Window, html, topHref: () => topHref };
};

describe('bustFrames', () => {
  it('does nothing when not framed', () => {
    const { win, html } = fakeWindow(false);
    expect(bustFrames(win)).toBe(false);
    expect(html.style.display).toBe('');
  });

  it('hides the page and navigates the top window when framed', () => {
    const { win, html, topHref } = fakeWindow(true);
    expect(bustFrames(win)).toBe(true);
    expect(html.style.display).toBe('none');
    expect(topHref()).toBe('https://yearwheel.lipu.dev/');
  });

  it('stays hidden when top navigation is blocked', () => {
    const { win, html, topHref } = fakeWindow(true, true);
    expect(bustFrames(win)).toBe(true);
    expect(html.style.display).toBe('none');
    expect(topHref()).toBe('https://evil.example/');
  });
});
