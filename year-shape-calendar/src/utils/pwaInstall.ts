/**
 * PWA Install Prompt Utility
 * Handles the PWA install banner and prompt
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAInstallManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private installButton: HTMLButtonElement | null = null;
  private isInstalled = false;

  constructor() {
    this.init();
  }

  private init(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.showInstallButton();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  /**
   * Create and show the install button
   */
  private showInstallButton(): void {
    // Don't show if already installed
    if (this.isInstalled) return;

    // Check if button already exists
    if (this.installButton) {
      this.installButton.classList.remove('hidden');
      return;
    }

    // Create install button
    this.installButton = document.createElement('button');
    this.installButton.id = 'pwaInstallBtn';
    this.installButton.className = 'btn flex items-center gap-2 text-sm';
    this.installButton.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a 3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
      <span>Install App</span>
    `;
    this.installButton.setAttribute('aria-label', 'Install YearWheel as an app');
    this.installButton.title = 'Install YearWheel to your device';

    this.installButton.addEventListener('click', () => {
      this.handleInstallClick();
    });

    // Add to header (next to sign-in button)
    const header = document.querySelector('header');
    const headerSignInBtn = document.getElementById('headerSignInBtn');
    
    if (header && headerSignInBtn) {
      headerSignInBtn.parentNode?.insertBefore(this.installButton, headerSignInBtn);
    } else if (header) {
      header.appendChild(this.installButton);
    }
  }

  /**
   * Hide the install button
   */
  private hideInstallButton(): void {
    if (this.installButton) {
      this.installButton.classList.add('hidden');
    }
  }

  /**
   * Handle install button click
   */
  private async handleInstallClick(): Promise<void> {
    if (!this.deferredPrompt) {
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    this.deferredPrompt = null;
    this.hideInstallButton();
  }

  /**
   * Check if the app is installed
   */
  public getIsInstalled(): boolean {
    return this.isInstalled;
  }
}

// Export singleton instance
export const pwaInstallManager = new PWAInstallManager();

