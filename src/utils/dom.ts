/**
 * DOM manipulation utilities
 */

/**
 * Get element by ID with type safety
 */
export const getElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id) as T | null;
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element;
};

/**
 * Create element with classes
 */
export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  classes: string[] = [],
  attributes: Record<string, string> = {}
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  
  if (classes.length > 0) {
    element.classList.add(...classes);
  }
  
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  return element;
};

/**
 * Add event listener with type safety
 */
export const addClickListener = (
  element: HTMLElement,
  handler: (event: MouseEvent) => void
): void => {
  element.addEventListener('click', handler);
};

/**
 * Add keyboard support for clickable elements (accessibility)
 */
export const makeAccessible = (
  element: HTMLElement,
  handler: () => void,
  label?: string
): void => {
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  
  if (label) {
    element.setAttribute('aria-label', label);
  }
  
  element.addEventListener('click', handler);
  element.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler();
    }
  });
};

/**
 * Toggle class with animation support
 */
export const toggleClassWithAnimation = (
  element: HTMLElement,
  className: string,
  force?: boolean
): void => {
  const shouldAdd = force !== undefined ? force : !element.classList.contains(className);
  
  if (shouldAdd) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
};

