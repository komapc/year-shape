/**
 * Keyboard shortcut handler for YearWheel
 */

export type ShortcutCallback = (event: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  callback: ShortcutCallback;
  description: string;
}

class KeyboardManager {
  private shortcuts: Map<string, Shortcut> = new Map();
  private isEnabled = true;

  constructor() {
    this.attachListener();
  }

  /**
   * Register a keyboard shortcut
   */
  register = (shortcut: Shortcut): void => {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  };

  /**
   * Unregister a keyboard shortcut
   */
  unregister = (key: string, ctrl = false, alt = false, shift = false): void => {
    const shortcutKey = this.getShortcutKey({ key, ctrl, alt, shift } as Shortcut);
    this.shortcuts.delete(shortcutKey);
  };

  /**
   * Enable keyboard shortcuts
   */
  enable = (): void => {
    this.isEnabled = true;
  };

  /**
   * Disable keyboard shortcuts
   */
  disable = (): void => {
    this.isEnabled = false;
  };

  /**
   * Get all registered shortcuts
   */
  getShortcuts = (): Shortcut[] => {
    return Array.from(this.shortcuts.values());
  };

  /**
   * Handle keyboard events
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isEnabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return;
    }

    const key = this.getShortcutKey({
      key: event.key.toLowerCase(),
      ctrl: event.ctrlKey || event.metaKey,
      alt: event.altKey,
      shift: event.shiftKey,
    } as Shortcut);

    const shortcut = this.shortcuts.get(key);
    if (shortcut) {
      event.preventDefault();
      shortcut.callback(event);
    }
  };

  /**
   * Get unique key for shortcut
   */
  private getShortcutKey = (shortcut: Partial<Shortcut>): string => {
    const parts = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.shift) parts.push('shift');
    parts.push(shortcut.key);
    return parts.join('+');
  };

  /**
   * Attach keyboard listener
   */
  private attachListener = (): void => {
    document.addEventListener('keydown', this.handleKeyDown);
  };

  /**
   * Cleanup
   */
  destroy = (): void => {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.shortcuts.clear();
  };
}

// Singleton instance
export const keyboardManager = new KeyboardManager();

