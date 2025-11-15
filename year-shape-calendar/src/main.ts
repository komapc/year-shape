/**
 * Application entry point
 */

import './style.css';
import { CalendarApp } from './calendar/CalendarApp';
import { pwaInstallManager } from './utils/pwaInstall';
import { initializeSwipeNavigation } from './utils/swipeNavigation';

// Initialize app when DOM is ready
const initApp = (): void => {
  try {
    new CalendarApp();
    
    // Initialize swipe navigation for mode switching
    initializeSwipeNavigation();
    
    // Initialize PWA install manager
    console.log('PWA Install Manager initialized:', pwaInstallManager);
    
    console.log('Year Shape Calendar initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Show error UI instead of alert
    document.body.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#07101a] to-[#0b1220] px-6">
        <div class="glass rounded-xl border border-red-500/50 p-8 max-w-md text-center">
          <div class="text-6xl mb-4">⚠️</div>
          <h1 class="text-2xl font-bold text-red-400 mb-4">Failed to Load YearWheel</h1>
          <p class="text-gray-300 mb-6">
            ${error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <button 
            onclick="location.reload()" 
            class="btn primary px-6 py-3"
          >
            ↻ Retry
          </button>
        </div>
      </div>
    `;
  }
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

