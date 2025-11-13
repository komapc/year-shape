/**
 * Theme detection and management utility
 */

export type ThemePreference = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

/**
 * Detect system color preference
 */
export const getSystemTheme = (): ResolvedTheme => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

/**
 * Resolve theme preference to actual theme
 */
export const resolveTheme = (preference: ThemePreference): ResolvedTheme => {
  if (preference === 'auto') {
    return getSystemTheme();
  }
  return preference;
};

/**
 * Apply theme to document
 */
export const applyTheme = (resolvedTheme: ResolvedTheme): void => {
  if (resolvedTheme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
};

/**
 * Listen for system theme changes
 */
export const watchSystemTheme = (callback: (theme: ResolvedTheme) => void): (() => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (event: MediaQueryListEvent) => {
    const newTheme = event.matches ? 'dark' : 'light';
    callback(newTheme);
  };
  
  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  // Legacy browsers
  else if (mediaQuery.addListener) {
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }
  
  return () => {}; // No-op cleanup
};

