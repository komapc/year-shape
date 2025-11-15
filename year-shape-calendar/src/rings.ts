/**
 * @fileoverview Rings Mode Entry Point
 *
 * This is the entry point for the rings calendar mode.
 * It initializes the RingsMode renderer and sets up UI controls.
 */

import { RingsMode } from './calendar/RingsMode';
import { loadSettings, updateSetting, type CalendarMode } from './utils/settings';
import { navigateToMode } from './utils/modeNavigation';
import { initializeSwipeNavigation } from './utils/swipeNavigation';
import { googleCalendarService } from './services/googleCalendar';
import { resolveTheme, applyTheme, watchSystemTheme } from './utils/theme';

/**
 * Initialize rings mode when DOM is ready
 */
const initRingsMode = (): void => {
  try {
    // Get SVG container
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
      throw new Error('canvas-container element not found');
    }

    // Create rings mode instance
    const ringsMode = new RingsMode(canvasContainer, 350, 350);

    // Initialize from saved settings
    ringsMode.initializeFromSettings();

    // Setup UI controls
    setupUIControls(ringsMode);

    console.log('Rings mode initialized successfully');
  } catch (error) {
    console.error('Failed to initialize rings mode:', error);
    // Alert removed per user request - using console.error only
  }
};

/**
 * Setup UI controls and event handlers
 */
const setupUIControls = (ringsMode: RingsMode): void => {
  // Corner radius slider
  const cornerInput = document.getElementById('cornerRadius') as HTMLInputElement;
  const cornerValue = document.getElementById('cornerValue') as HTMLElement;

  if (cornerInput && cornerValue) {
    cornerInput.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      cornerValue.textContent = `${value}%`;
      ringsMode.setCornerRadius(value / 100);
    });
  }

  // Ring width slider
  const widthInput = document.getElementById('ringWidth') as HTMLInputElement;
  const widthValue = document.getElementById('widthValue') as HTMLElement;

  if (widthInput && widthValue) {
    // Update max value based on current visible rings
    const updateMaxWidth = (): void => {
      const maxWidth = Math.floor(ringsMode.getMaxRingWidth());
      const currentValue = parseInt(widthInput.value);
      widthInput.max = maxWidth.toString();
      // Clamp current value if it exceeds new max
      if (currentValue > maxWidth) {
        widthInput.value = maxWidth.toString();
        widthValue.textContent = `${maxWidth}px`;
        ringsMode.setRingWidth(maxWidth);
      }
    };

    // Initial max width update
    updateMaxWidth();

    widthInput.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      const maxWidth = Math.floor(ringsMode.getMaxRingWidth());
      const clampedValue = Math.min(value, maxWidth);
      widthValue.textContent = `${clampedValue}px`;
      ringsMode.setRingWidth(clampedValue);
      // Update max in case visibility changed
      updateMaxWidth();
    });

    // Update max width when ring visibility changes
    const originalInitializeLayerControls = ringsMode.initializeLayerControls.bind(ringsMode);
    ringsMode.initializeLayerControls = () => {
      originalInitializeLayerControls();
      // After visibility changes, update max width
      setTimeout(updateMaxWidth, 100);
    };
  }

  // Direction toggle
  const directionToggle = document.getElementById('directionToggle') as HTMLButtonElement;

  if (directionToggle) {
    directionToggle.addEventListener('click', () => {
      const newDirection = ringsMode.toggleDirection();
      const directionText = newDirection === 1 ? 'CW' : 'CCW';
      const directionIcon = newDirection === 1 ? '↻' : '↺';
      directionToggle.innerHTML = `${directionIcon} ${directionText}`;
      directionToggle.style.background =
        newDirection === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(100,200,255,0.3)';
    });
  }

  // Rotate year button
  const rotateYearBtn = document.getElementById('rotateYear') as HTMLButtonElement;

  if (rotateYearBtn) {
    rotateYearBtn.addEventListener('click', () => {
      ringsMode.rotateYear();
      rotateYearBtn.style.transform = 'rotate(90deg)';
      setTimeout(() => {
        rotateYearBtn.style.transform = '';
      }, 200);
    });
  }

  // Layer controls toggle
  const toggleLayerControls = document.getElementById('toggleLayerControls');
  const layerControlsContent = document.getElementById('layerControlsContent');
  const layerControlsToggleText = document.getElementById('layerControlsToggleText');
  let layerControlsVisible = false; // Hidden by default

  if (toggleLayerControls && layerControlsContent && layerControlsToggleText) {
    toggleLayerControls.addEventListener('click', () => {
      layerControlsVisible = !layerControlsVisible;
      if (layerControlsVisible) {
        layerControlsContent.style.display = 'block';
        layerControlsToggleText.textContent = '▼ Hide';
      } else {
        layerControlsContent.style.display = 'none';
        layerControlsToggleText.textContent = '▶ Show';
      }
    });
  }

  // Mode selector (radio buttons in header)
  const headerModeOldRadio = document.getElementById('headerModeOld') as HTMLInputElement;
  const headerModeRingsRadio = document.getElementById('headerModeRings') as HTMLInputElement;
  const headerModeZoomRadio = document.getElementById('headerModeZoom') as HTMLInputElement;

  const handleModeChange = (selectedMode: CalendarMode): void => {
    // Save mode preference
    updateSetting('mode', selectedMode);

    // Navigate to selected mode
    navigateToMode(selectedMode);
  };

  if (headerModeOldRadio) {
    headerModeOldRadio.addEventListener('change', () => {
      if (headerModeOldRadio.checked) {
        handleModeChange('old');
      }
    });
  }

  if (headerModeRingsRadio) {
    headerModeRingsRadio.addEventListener('change', () => {
      if (headerModeRingsRadio.checked) {
        handleModeChange('rings');
      }
    });
  }

  if (headerModeZoomRadio) {
    headerModeZoomRadio.addEventListener('change', () => {
      if (headerModeZoomRadio.checked) {
        handleModeChange('zoom');
      }
    });
  }

  // Load saved mode preference
  const settings = loadSettings();
  if (settings.mode) {
    if (settings.mode === 'old' && headerModeOldRadio) {
      headerModeOldRadio.checked = true;
    } else if (settings.mode === 'zoom' && headerModeZoomRadio) {
      headerModeZoomRadio.checked = true;
    } else if (headerModeRingsRadio) {
      headerModeRingsRadio.checked = true;
    }
  }

  // Layer controls (drag and drop, visibility toggles)
  ringsMode.initializeLayerControls();

  // Initialize swipe navigation for mode switching
  initializeSwipeNavigation();

  // Setup login status for rings mode
  setupLoginStatus();
};

/**
 * Setup login status display for rings mode
 */
const setupLoginStatus = (): void => {
  const loginStatus = document.getElementById('loginStatusRings');
  const headerSignInBtn = document.getElementById('headerSignInBtnRings') as HTMLButtonElement;
  const statusText = loginStatus?.querySelector('.status-text') as HTMLElement;

  // Update login status function
  const updateLoginStatus = async (isLoggedIn: boolean): Promise<void> => {
    if (!loginStatus || !headerSignInBtn || !statusText) return;

    if (isLoggedIn) {
      // Get user info from Google (try fetching if not available)
      let userInfo = googleCalendarService.getUserInfo();

      // If user info is not available, try to fetch it
      if (!userInfo || !userInfo.name) {
        try {
          await googleCalendarService.fetchUserInfo();
          userInfo = googleCalendarService.getUserInfo();
        } catch (error) {
          console.warn('Failed to fetch user info:', error);
        }
      }

      // Show personalized "Logged in" status, hide sign-in button
      loginStatus.classList.remove('hidden');
      headerSignInBtn.classList.add('hidden');

      // Always show user's name if available, otherwise show "Hello, User"
      if (userInfo?.name) {
        statusText.textContent = `Hello, ${userInfo.name}`;
      } else {
        statusText.textContent = 'Hello, User';
        // Try to fetch user info one more time in the background
        googleCalendarService.fetchUserInfo().then(() => {
          const updatedInfo = googleCalendarService.getUserInfo();
          if (updatedInfo?.name && statusText) {
            statusText.textContent = `Hello, ${updatedInfo.name}`;
          }
        }).catch(() => {
          // Ignore errors, just keep "Hello, User"
        });
      }
    } else {
      // Hide status, show sign-in button
      loginStatus.classList.add('hidden');
      headerSignInBtn.classList.remove('hidden');
    }
  };

  // Handle sign-in button click
  if (headerSignInBtn) {
    headerSignInBtn.addEventListener('click', async () => {
      try {
        headerSignInBtn.disabled = true;
        headerSignInBtn.textContent = 'Signing in...';
        await googleCalendarService.signIn();
        await updateLoginStatus(true);
      } catch (error) {
        console.error('Sign-in error:', error);
        headerSignInBtn.disabled = false;
        headerSignInBtn.innerHTML = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg><span>Sign in with Google</span>';
      }
    });
  }

  // Initialize login status on page load
  const initLoginStatus = async (): Promise<void> => {
    try {
      // Wait a bit for the service to be initialized from the main app
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if user is already authenticated
      const isLoggedIn = googleCalendarService.getAuthStatus();
      
      if (isLoggedIn) {
        await updateLoginStatus(true);
        // Fetch user info if not already available
        let userInfo = googleCalendarService.getUserInfo();
        if (!userInfo || !userInfo.name) {
          try {
            await googleCalendarService.fetchUserInfo();
            userInfo = googleCalendarService.getUserInfo();
            if (userInfo?.name && statusText) {
              statusText.textContent = `Hello, ${userInfo.name}`;
            }
          } catch (error) {
            console.warn('Failed to fetch user info:', error);
          }
        } else if (userInfo?.name && statusText) {
          statusText.textContent = `Hello, ${userInfo.name}`;
        }
      } else {
        updateLoginStatus(false);
      }
    } catch (error) {
      console.warn('Failed to check login status:', error);
      updateLoginStatus(false);
    }
  };

  // Initialize when page loads
  initLoginStatus();
};

/**
 * Initialize theme for rings mode
 */
const initTheme = (): void => {
  const settings = loadSettings();
  const themePreference = settings.theme || 'auto';
  const resolvedTheme = resolveTheme(themePreference);
  applyTheme(resolvedTheme);

  // Watch for system theme changes if 'auto' is selected
  if (themePreference === 'auto') {
    watchSystemTheme((newSystemTheme) => {
      applyTheme(newSystemTheme);
    });
  }
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initRingsMode();
  });
} else {
  initTheme();
  initRingsMode();
}
