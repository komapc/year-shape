/**
 * Motion preferences. CSS animations honour `prefers-reduced-motion` via a
 * media query, but SVG SMIL `<animate>` elements do not — gate those in JS.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
