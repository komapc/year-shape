/**
 * Toast notification system for user feedback
 * Replaces alert() with modern, non-blocking notifications
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  type?: ToastType;
  message: string;
  duration?: number; // milliseconds, 0 = permanent
  action?: {
    label: string;
    onClick: () => void;
  };
}

class ToastManager {
  private container: HTMLElement | null = null;
  private activeToasts: Set<HTMLElement> = new Set();

  /**
   * Initialize toast container
   */
  private initContainer = (): void => {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.container);
  };

  /**
   * Show a toast notification
   */
  show = (options: ToastOptions): void => {
    this.initContainer();
    if (!this.container) return;

    const {
      type = 'info',
      message,
      duration = 5000,
      action
    } = options;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = this.getToastClasses(type);
    toast.setAttribute('role', 'alert');

    // Icon based on type
    const icon = this.getIcon(type);

    // Build content
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="text-xl flex-shrink-0">${icon}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium break-words">${this.escapeHtml(message)}</p>
          ${action ? `
            <button 
              class="mt-2 text-xs underline hover:no-underline focus:outline-none focus:ring-1 focus:ring-white rounded"
              data-toast-action="true"
            >
              ${this.escapeHtml(action.label)}
            </button>
          ` : ''}
        </div>
        <button 
          class="text-white/80 hover:text-white text-xl leading-none flex-shrink-0 focus:outline-none focus:ring-1 focus:ring-white rounded"
          aria-label="Close notification"
          data-toast-close="true"
        >
          ×
        </button>
      </div>
    `;

    // Add to container
    this.container.appendChild(toast);
    this.activeToasts.add(toast);

    // Enable pointer events on toast
    toast.style.pointerEvents = 'auto';

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      requestAnimationFrame(() => {
        toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      });
    });

    // Event handlers
    const closeBtn = toast.querySelector('[data-toast-close]') as HTMLElement;
    const actionBtn = toast.querySelector('[data-toast-action]') as HTMLElement;

    const handleClose = () => this.dismiss(toast);
    closeBtn?.addEventListener('click', handleClose);

    if (actionBtn && action) {
      actionBtn.addEventListener('click', () => {
        action.onClick();
        this.dismiss(toast);
      });
    }

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  };

  /**
   * Dismiss a toast
   */
  private dismiss = (toast: HTMLElement): void => {
    if (!toast.parentElement) return;

    // Animate out
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';

    setTimeout(() => {
      toast.remove();
      this.activeToasts.delete(toast);

      // Remove container if empty
      if (this.activeToasts.size === 0 && this.container) {
        this.container.remove();
        this.container = null;
      }
    }, 300);
  };

  /**
   * Get toast classes based on type
   */
  private getToastClasses = (type: ToastType): string => {
    const baseClasses = 'px-4 py-3 rounded-lg shadow-lg backdrop-blur-md border min-w-[300px] max-w-md';
    
    const typeClasses = {
      success: 'bg-green-600/90 border-green-500 text-white',
      error: 'bg-red-600/90 border-red-500 text-white',
      warning: 'bg-orange-600/90 border-orange-500 text-white',
      info: 'bg-blue-600/90 border-blue-500 text-white',
    };

    return `${baseClasses} ${typeClasses[type]}`;
  };

  /**
   * Get icon for toast type
   */
  private getIcon = (type: ToastType): string => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type];
  };

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  /**
   * Clear all toasts
   */
  clearAll = (): void => {
    this.activeToasts.forEach(toast => this.dismiss(toast));
  };
}

// Singleton instance
const toastManager = new ToastManager();

/**
 * Show a toast notification
 */
export const showToast = (options: ToastOptions): void => {
  toastManager.show(options);
};

/**
 * Convenience methods
 */
export const toast = {
  success: (message: string, duration?: number) => 
    showToast({ type: 'success', message, duration }),
  
  error: (message: string, duration?: number) => 
    showToast({ type: 'error', message, duration }),
  
  warning: (message: string, duration?: number) => 
    showToast({ type: 'warning', message, duration }),
  
  info: (message: string, duration?: number) => 
    showToast({ type: 'info', message, duration }),
  
  clearAll: () => toastManager.clearAll(),
};

