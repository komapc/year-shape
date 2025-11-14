/**
 * @fileoverview Main Calendar Application Controller
 * 
 * This is the central orchestrator for YearWheel. It manages:
 * - UI element initialization and event handling
 * - Integration between CalendarRenderer, WeekModal, and GoogleCalendarService
 * - User settings persistence (theme, display options, calendar configuration)
 * - Google Calendar authentication and event synchronization
 * 
 * @author YearWheel Team
 * @version 0.5.0
 */

import type { CalendarEvent } from '../types';
import { CalendarRenderer } from './CalendarRenderer';
import { WeekModal } from './WeekModal';
import { ZoomMode } from './ZoomMode';
import { googleCalendarService } from '../services/googleCalendar';
import { getElement } from '../utils/dom';
import { openGoogleCalendarForWeek } from '../utils/date';
import { loadSettings, saveSettings, type AppSettings, type CalendarMode } from '../utils/settings';
import { toast } from '../utils/toast';
import { keyboardManager } from '../utils/keyboard';
import { router } from '../utils/router';
import { resolveTheme, applyTheme, watchSystemTheme } from '../utils/theme';
import type { ThemePreference } from '../utils/theme';
import { t, setLocale, initializeLocale, type Locale } from '../i18n';
import { getModeFromHash, navigateToMode } from '../utils/modeNavigation';

/**
 * Main application controller class for YearWheel.
 * 
 * Responsibilities:
 * - Initializing and coordinating all UI components
 * - Managing application state and user settings
 * - Handling user interactions (button clicks, slider changes)
 * - Orchestrating Google Calendar integration
 * - Persisting configuration to localStorage
 * 
 * @class CalendarApp
 */
export class CalendarApp {
  /** Calendar rendering engine - handles visual layout and positioning */
  private renderer: CalendarRenderer | null = null;
  
  /** Zoom mode renderer - handles zoom mode visualization */
  private zoomMode: ZoomMode | null = null;
  
  /** Week detail modal - displays Soviet-style diary view */
  private modal: WeekModal;
  
  /** Google Calendar events indexed by week number (1-52) */
  private eventsByWeek: Record<number, CalendarEvent[]> = {};
  
  /** Current calendar mode */
  private currentMode: CalendarMode = 'old';

  // ========================================
  // UI Element References
  // ========================================
  
  /** Corner radius slider (0=square, 100=circle) */
  private radiusInput: HTMLInputElement;
  
  /** Main container for the year shape visualization */
  private shapeContainer: HTMLElement;
  
  /** Button to toggle rotation direction (CW/CCW) */
  private toggleDirectionBtn: HTMLButtonElement;
  
  /** Button to rotate seasonal offset */
  private shiftSeasonsBtn: HTMLButtonElement;
  
  /** Button to refresh Google Calendar events */
  private refreshEventsBtn: HTMLButtonElement;
  
  /** Google Sign In button (in settings, removed) */
  // private signInBtn: HTMLButtonElement;
  
  /** Logout button */
  private logoutBtn: HTMLButtonElement;
  
  /** Toggle button for About panel */
  private toggleAboutBtn: HTMLButtonElement;
  
  /** Toggle button for Settings panel */
  private toggleSettingsBtn: HTMLButtonElement;
  
  /** Close button for Settings panel (mobile) */
  private closeSettingsBtn: HTMLButtonElement;
  
  /** About panel element */
  private aboutPanel: HTMLElement;
  
  /** Settings panel element */
  private settingsPanel: HTMLElement;
  
  /** Checkbox to show/hide moon phase in tooltips */
  private showMoonPhaseCheckbox: HTMLInputElement;
  
  /** Checkbox to show/hide zodiac signs in tooltips */
  private showZodiacCheckbox: HTMLInputElement;
  
  /** Checkbox to show/hide Hebrew months in tooltips */
  private showHebrewMonthCheckbox: HTMLInputElement;
  
  /** Theme radio buttons */
  private themeAutoRadio: HTMLInputElement;
  private themeLightRadio: HTMLInputElement;
  private themeDarkRadio: HTMLInputElement;
  
  /** Language select dropdown */
  private languageSelect: HTMLSelectElement;
  
  /** Mode selector dropdown (header) - replaced with radio buttons */
  private modeSelector: HTMLSelectElement | null = null;
  
  /** Mode radio buttons (header) */
  private headerModeOldRadio: HTMLInputElement;
  private headerModeRingsRadio: HTMLInputElement;
  private headerModeZoomRadio: HTMLInputElement;
  
  /** Mode radio buttons (settings) */
  private modeOldRadio: HTMLInputElement;
  private modeRingsRadio: HTMLInputElement;
  private modeZoomRadio: HTMLInputElement;
  
  /** System theme change cleanup function */
  private cleanupSystemThemeWatch: (() => void) | null = null;
  
  /** Login status indicator element */
  private loginStatus: HTMLElement;
  
  /** Header sign-in button (shown when not logged in) */
  private headerSignInBtn: HTMLButtonElement;
  
  /** Current application settings (persisted to localStorage) */
  private settings: AppSettings;

  /** Current year being displayed */
  private currentYear: number;

  /** Previous year button */
  private prevYearBtn: HTMLButtonElement;

  /** Next year button */
  private nextYearBtn: HTMLButtonElement;

  /** Year display element */
  private yearDisplay: HTMLElement;

  /**
   * Initializes the YearWheel application.
   * 
   * Initialization sequence:
   * 1. Query and store all DOM element references
   * 2. Load persisted settings from localStorage
   * 3. Apply saved settings to UI controls
   * 4. Initialize renderer and modal components
   * 5. Attach event listeners for user interactions
   * 6. Initialize Google Calendar integration (async)
   * 7. Perform initial calendar layout
   * 
   * @constructor
   */
  constructor() {
    // ========================================
    // 1. Query DOM Elements
    // ========================================
    this.radiusInput = getElement<HTMLInputElement>('radiusRange');
    this.shapeContainer = getElement('yearShape');
    this.toggleDirectionBtn = getElement<HTMLButtonElement>('toggleDirection');
    this.shiftSeasonsBtn = getElement<HTMLButtonElement>('shiftSeasons');
    this.refreshEventsBtn = getElement<HTMLButtonElement>('refreshEvents');
    this.logoutBtn = getElement<HTMLButtonElement>('logoutBtn');
    this.toggleAboutBtn = getElement<HTMLButtonElement>('toggleAbout');
    this.toggleSettingsBtn = getElement<HTMLButtonElement>('toggleSettings');
    this.closeSettingsBtn = getElement<HTMLButtonElement>('closeSettingsBtn');
    this.aboutPanel = getElement('aboutPanel');
    this.settingsPanel = getElement('settingsPanel');
    this.showMoonPhaseCheckbox = getElement<HTMLInputElement>('showMoonPhase');
    this.showZodiacCheckbox = getElement<HTMLInputElement>('showZodiac');
    this.showHebrewMonthCheckbox = getElement<HTMLInputElement>('showHebrewMonth');
    this.themeAutoRadio = getElement<HTMLInputElement>('themeAuto');
    this.themeLightRadio = getElement<HTMLInputElement>('themeLight');
    this.themeDarkRadio = getElement<HTMLInputElement>('themeDark');
    this.languageSelect = getElement<HTMLSelectElement>('languageSelect');
    // Try to get mode selector (may not exist if replaced with radio buttons)
    try {
      this.modeSelector = getElement<HTMLSelectElement>('modeSelector');
    } catch {
      this.modeSelector = null;
    }
    this.headerModeOldRadio = getElement<HTMLInputElement>('headerModeOld');
    this.headerModeRingsRadio = getElement<HTMLInputElement>('headerModeRings');
    this.headerModeZoomRadio = getElement<HTMLInputElement>('headerModeZoom');
    this.modeOldRadio = getElement<HTMLInputElement>('modeOld');
    this.modeRingsRadio = getElement<HTMLInputElement>('modeRings');
    this.modeZoomRadio = getElement<HTMLInputElement>('modeZoom');
    this.loginStatus = getElement('loginStatus');
    this.headerSignInBtn = getElement<HTMLButtonElement>('headerSignInBtn');
    this.prevYearBtn = getElement<HTMLButtonElement>('prevYear');
    this.nextYearBtn = getElement<HTMLButtonElement>('nextYear');
    this.yearDisplay = getElement('currentYearText');

    // ========================================
    // 2. Load Persisted Settings and Initialize Year
    // ========================================
    this.settings = loadSettings();
    this.currentYear = new Date().getFullYear();
    
    // Initialize internationalization
    initializeLocale();
    if (this.settings.locale) {
      setLocale(this.settings.locale as Locale);
    }
    
    // ========================================
    // 3. Sync Settings to UI Controls
    // ========================================
    this.showMoonPhaseCheckbox.checked = this.settings.showMoonPhase;
    this.showZodiacCheckbox.checked = this.settings.showZodiac;
    this.showHebrewMonthCheckbox.checked = this.settings.showHebrewMonth;
    
    // Set theme radio buttons
    const themePreference = this.settings.theme || 'auto';
    this.themeAutoRadio.checked = themePreference === 'auto';
    this.themeLightRadio.checked = themePreference === 'light';
    this.themeDarkRadio.checked = themePreference === 'dark';
    
    this.languageSelect.value = this.settings.locale || 'en';
    
    // Set mode from settings or URL (default to 'zoom' instead of 'old')
    this.currentMode = this.settings.mode || 'zoom';
    const urlMode = this.getModeFromURL();
    if (urlMode) {
      this.currentMode = urlMode;
      this.settings.mode = urlMode;
      saveSettings(this.settings);
    }
    
    // Sync mode to UI controls
    if (this.modeSelector) {
      this.modeSelector.value = this.currentMode;
    }
    // Header radio buttons
    this.headerModeOldRadio.checked = this.currentMode === 'old';
    this.headerModeRingsRadio.checked = this.currentMode === 'rings';
    this.headerModeZoomRadio.checked = this.currentMode === 'zoom';
    // Settings radio buttons
    if (this.modeOldRadio) {
      this.modeOldRadio.checked = this.currentMode === 'old';
    }
    if (this.modeRingsRadio) {
      this.modeRingsRadio.checked = this.currentMode === 'rings';
    }
    if (this.modeZoomRadio) {
      this.modeZoomRadio.checked = this.currentMode === 'zoom';
    }
    
    // Apply saved corner radius
    this.radiusInput.value = this.settings.cornerRadius.toString();
    const wrapElement = document.querySelector('.shape-wrap') as HTMLElement;
    if (wrapElement) {
      wrapElement.style.borderRadius = `${this.settings.cornerRadius}%`;
    }
    
    // Apply theme to body element
    const themeToApply = resolveTheme(this.settings.theme || 'auto');
    applyTheme(themeToApply);
    
    // Watch for system theme changes if 'auto' is selected
    this.setupSystemThemeWatch();
    
    // Update all UI text with current translations
    this.updateUIText();

    // ========================================
    // 4. Initialize Core Components
    // ========================================
    this.modal = new WeekModal();
    
    // Initialize mode-specific renderer
    this.initializeMode();

    // ========================================
    // 5. Setup Event Handlers
    // ========================================
    this.attachEventListeners();
    this.registerKeyboardShortcuts();
    this.registerRoutes();
    
    // ========================================
    // 6. Initialize Google Calendar (Async)
    // ========================================
    this.initializeGoogleCalendar();
    
    // ========================================
    // 7. Perform Initial Layout
    // ========================================
    // Update year display
    this.updateYearDisplay();
    
    // Note: Initial layout is handled by initializeMode()
  }

  /**
   * Initializes Google Calendar API integration.
   * 
   * This async method:
   * 1. Waits for Google API scripts to load from CDN
   * 2. Initializes GAPI (Google API Client) with API key
   * 3. Initializes GIS (Google Identity Services) for OAuth 2.0
   * 4. Attempts to restore a previous session from localStorage
   * 5. If session restored, automatically fetches calendar events
   * 
   * If initialization fails (missing credentials, network error), the app
   * continues to function but without calendar event integration.
   * 
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private initializeGoogleCalendar = async (): Promise<void> => {
    try {
      // Wait for Google API scripts to load
      await this.waitForGoogleScripts();
      
      await googleCalendarService.initializeGapi();
      googleCalendarService.initializeGis();

      // Attempt to restore previous session
      const sessionRestored = await googleCalendarService.restoreSession();
      
      if (sessionRestored) {
        console.log('✅ Session restored - user is logged in');
        await this.updateLoginStatus(true);
        // Automatically fetch events if session was restored
        await this.handleRefreshEvents();
      } else {
        console.log('ℹ️ No saved session - user needs to sign in');
        this.updateLoginStatus(false);
      }

      console.log('Google Calendar integration ready');
    } catch (error) {
      console.warn('Google Calendar not configured or failed to initialize:', error);
    }
  };

  /**
   * Waits for Google API scripts to be loaded from CDN.
   * 
   * Polls for the global `gapi` and `google` objects every 100ms,
   * timing out after 10 seconds. Required before calling any
   * Google API initialization methods.
   * 
   * @private
   * @returns {Promise<void>} Resolves when scripts are loaded, rejects on timeout
   */
  private waitForGoogleScripts = (): Promise<void> => {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 10000);
    });
  };

  /**
   * Attach event listeners to UI controls
   */
  private attachEventListeners = (): void => {
    // Corner radius control
    this.radiusInput.addEventListener('input', this.handleRadiusChange);

    // Direction toggle
    this.toggleDirectionBtn.addEventListener('click', this.handleDirectionToggle);

    // Shift seasons
    this.shiftSeasonsBtn.addEventListener('click', this.handleShiftSeasons);

    // Refresh events
    this.refreshEventsBtn.addEventListener('click', this.handleRefreshEvents);

    // Google sign-in (header button only)
    this.headerSignInBtn.addEventListener('click', this.handleSignIn);
    
    // Logout
    this.logoutBtn.addEventListener('click', this.handleLogout);

    // Window resize
    window.addEventListener('resize', this.handleResize);

    // Toggle about
    this.toggleAboutBtn.addEventListener('click', this.handleToggleAbout);

    // Toggle settings
    this.toggleSettingsBtn.addEventListener('click', this.handleToggleSettings);
    this.closeSettingsBtn.addEventListener('click', this.handleCloseSettings);

    // Settings checkboxes
    this.showMoonPhaseCheckbox.addEventListener('change', this.handleMoonPhaseToggle);
    this.showZodiacCheckbox.addEventListener('change', this.handleZodiacToggle);
    this.showHebrewMonthCheckbox.addEventListener('change', this.handleHebrewMonthToggle);
    
    // Theme radio buttons
    this.themeAutoRadio.addEventListener('change', this.handleThemeChange);
    this.themeLightRadio.addEventListener('change', this.handleThemeChange);
    this.themeDarkRadio.addEventListener('change', this.handleThemeChange);
    
    this.languageSelect.addEventListener('change', this.handleLanguageChange);

    // Year navigation
    this.prevYearBtn.addEventListener('click', this.handlePrevYear);
    this.nextYearBtn.addEventListener('click', this.handleNextYear);
    
    // Mode selector (header) - may be select or radio buttons
    if (this.modeSelector) {
      this.modeSelector.addEventListener('change', this.handleModeChange);
    }
    
    // Mode radio buttons (header)
    this.headerModeOldRadio.addEventListener('change', this.handleModeChange);
    this.headerModeRingsRadio.addEventListener('change', this.handleModeChange);
    this.headerModeZoomRadio.addEventListener('change', this.handleModeChange);
    
    // Mode radio buttons (settings)
    if (this.modeOldRadio) {
      this.modeOldRadio.addEventListener('change', this.handleModeChange);
    }
    if (this.modeRingsRadio) {
      this.modeRingsRadio.addEventListener('change', this.handleModeChange);
    }
    if (this.modeZoomRadio) {
      this.modeZoomRadio.addEventListener('change', this.handleModeChange);
    }
  };

  /**
   * Register keyboard shortcuts
   */
  private registerKeyboardShortcuts = (): void => {
    // S - Toggle settings
    keyboardManager.register({
      key: 's',
      callback: () => {
        this.handleToggleSettings();
      },
      description: 'Toggle settings panel'
    });

    // ? - Toggle about/help
    keyboardManager.register({
      key: '?',
      callback: () => {
        this.handleToggleAbout();
      },
      description: 'Toggle about panel'
    });

    // Escape - Close all panels
    keyboardManager.register({
      key: 'escape',
      callback: () => {
        this.settingsPanel.classList.add('hidden');
        this.aboutPanel.classList.add('hidden');
        // Clear URL hash to sync with UI state
        router.navigate('');
      },
      description: 'Close all panels'
    });

    // Left arrow - Previous year
    keyboardManager.register({
      key: 'arrowleft',
      callback: () => {
        this.handlePrevYear();
      },
      description: 'Previous year'
    });

    // Right arrow - Next year
    keyboardManager.register({
      key: 'arrowright',
      callback: () => {
        this.handleNextYear();
      },
      description: 'Next year'
    });
  };

  /**
   * Register hash routes for SPA navigation
   */
  private registerRoutes = (): void => {
    // #settings - Open settings panel
    router.register('settings', () => {
      this.settingsPanel.classList.remove('hidden');
      this.aboutPanel.classList.add('hidden');
    });

    // #about - Open about panel  
    router.register('about', () => {
      this.aboutPanel.classList.remove('hidden');
      this.settingsPanel.classList.add('hidden');
    });

    // #week/:weekNumber - Open week modal
    router.register('week/:id', (params) => {
      const weekNumber = parseInt(params?.id || '0', 10);
      if (weekNumber >= 1 && weekNumber <= 52) {
        this.handleWeekClick(weekNumber - 1); // Convert 1-based to 0-based
      }
    });

    // #year/:year - Navigate to specific year (old mode)
    router.register('year/:year', (params) => {
      const year = parseInt(params?.year || '', 10);
      if (year >= 2000 && year <= 2100) {
        this.currentYear = year;
        this.updateYearDisplay();
        if (this.renderer) {
          this.renderer.layoutWeeks();
        }
        if (googleCalendarService.getAuthStatus()) {
          this.handleRefreshEvents();
        }
      }
    });

    // Mode routes
    router.register('zoom', () => {
      this.switchMode('zoom');
    });
    
    router.register('zoom/year/:year', (params) => {
      const year = parseInt(params?.year || '', 10);
      if (year >= 2000 && year <= 2100) {
        this.currentYear = year;
        this.switchMode('zoom');
        if (this.zoomMode) {
          this.zoomMode.setYear(year);
        }
      }
    });
    
    router.register('rings', () => {
      // Check if we're already on rings.html
      if (window.location.pathname.includes('rings.html')) {
        // Already on rings page, just update the mode selector if it exists
        const modeSelector = document.getElementById('modeSelector');
        if (modeSelector) {
          (modeSelector as HTMLSelectElement).value = 'rings';
        }
      } else {
        // Navigate to rings.html using shared utility
        navigateToMode('rings');
      }
    });
    
    router.register('old', () => {
      this.switchMode('old');
    });
    
    // Root / no hash - Close all panels
    router.register('', () => {
      this.settingsPanel.classList.add('hidden');
      this.aboutPanel.classList.add('hidden');
      // Use saved mode or default
      if (!this.getModeFromURL()) {
        this.switchMode(this.settings.mode || 'old');
      }
    });
  };
  
  /**
   * Get mode from URL hash
   */
  private getModeFromURL = (): CalendarMode | null => {
    return getModeFromHash();
  };
  
  /**
   * Initialize mode-specific renderer
   */
  private initializeMode = (): void => {
    if (this.currentMode === 'zoom') {
      this.initializeZoomMode();
    } else if (this.currentMode === 'rings') {
      // Redirect to rings.html
      window.location.href = '/rings.html';
      return;
    } else {
      this.initializeOldMode();
    }
  };
  
  /**
   * Initialize old mode (classic calendar)
   */
  private initializeOldMode = (): void => {
    // Hide zoom mode, show old mode
    if (this.zoomMode) {
      this.zoomMode.destroy();
      this.zoomMode = null;
    }
    
    // Hide zoom container
    const zoomContainer = document.getElementById('zoomContainer');
    if (zoomContainer) {
      zoomContainer.style.display = 'none';
    }
    
    // Show shape container
    this.shapeContainer.style.display = 'block';
    
    // Initialize renderer if not already initialized
    if (!this.renderer) {
      this.renderer = new CalendarRenderer(
        this.shapeContainer,
        this.settings.cornerRadius / 50,
        this.settings.direction,
        this.settings.rotationOffset
      );
      
      // Attach week click handler
      this.renderer.onWeekClick(this.handleWeekClick);
    }
    
    // Update year display
    this.updateYearDisplay();
    
    // Layout weeks
    this.renderer.layoutWeeks();
    
    // Update events if available
    if (Object.keys(this.eventsByWeek).length > 0) {
      this.renderer.updateEvents(this.eventsByWeek);
    }
  };
  
  /**
   * Initialize zoom mode
   */
  private initializeZoomMode = (): void => {
    // Hide old mode, show zoom mode
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }
    
    // Hide shape container
    this.shapeContainer.style.display = 'none';
    
    // Create zoom mode container if it doesn't exist
    let zoomContainer = document.getElementById('zoomContainer');
    if (!zoomContainer) {
      zoomContainer = document.createElement('div');
      zoomContainer.id = 'zoomContainer';
      zoomContainer.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 600px;
      `;
      this.shapeContainer.parentElement?.appendChild(zoomContainer);
    }
    
    // Show zoom container
    zoomContainer.style.display = 'block';
    
    // Initialize zoom mode
    if (!this.zoomMode) {
      this.zoomMode = new ZoomMode(zoomContainer, this.currentYear);
    }
    
    // Update events if available
    if (Object.keys(this.eventsByWeek).length > 0) {
      this.zoomMode.updateEvents(this.eventsByWeek);
    }
  };
  
  /**
   * Switch between modes
   */
  private switchMode = (mode: CalendarMode): void => {
    if (this.currentMode === mode) return;
    
    this.currentMode = mode;
    this.settings.mode = mode;
    saveSettings(this.settings);
    
    // Update UI controls
    if (this.modeSelector) {
      this.modeSelector.value = mode;
    }
    // Header radio buttons
    this.headerModeOldRadio.checked = mode === 'old';
    this.headerModeRingsRadio.checked = mode === 'rings';
    this.headerModeZoomRadio.checked = mode === 'zoom';
    // Settings radio buttons
    if (this.modeOldRadio) {
      this.modeOldRadio.checked = mode === 'old';
    }
    if (this.modeRingsRadio) {
      this.modeRingsRadio.checked = mode === 'rings';
    }
    if (this.modeZoomRadio) {
      this.modeZoomRadio.checked = mode === 'zoom';
    }
    
    // Initialize mode
    this.initializeMode();
    
    // Update URL and navigate using shared utilities
    if (mode === 'zoom') {
      router.navigate(`zoom/year/${this.currentYear}`);
    } else if (mode === 'rings') {
      // Navigate to rings.html using shared utility
      navigateToMode('rings');
    } else {
      // Stay on index.html for old mode
      router.navigate('old');
    }
  };
  
  /**
   * Handle mode change
   */
  private handleModeChange = (event: Event): void => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const mode = target.value as CalendarMode;
    this.switchMode(mode);
  };

  /**
   * Handle corner radius change
   */
  private handleRadiusChange = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const wrapElement = document.querySelector('.shape-wrap') as HTMLElement;
    
    if (wrapElement) {
      wrapElement.style.borderRadius = `${value}%`;
    }
    
    // Update week positions to follow the shape (only in old mode)
    if (this.renderer) {
      this.renderer.setCornerRadius(parseFloat(value));
    }
    
    // Save to settings
    this.settings.cornerRadius = parseFloat(value);
    saveSettings(this.settings);
  };

  /**
   * Toggles the rotation direction of the year wheel.
   * 
   * Switches between clockwise (CW) and counter-clockwise (CCW).
   * Updates button text and persists setting to localStorage.
   * 
   * @private
   * @returns {void}
   */
  private handleDirectionToggle = (): void => {
    if (!this.renderer) return;
    
    const newDirection = this.renderer.toggleDirection();
    const directionText = newDirection === 1 ? 'CW' : 'CCW';
    const directionIcon = newDirection === 1 ? '↻' : '↺';
    
    this.toggleDirectionBtn.innerHTML = `
      <span class="direction-icon">${directionIcon}</span>
      <span>${directionText}</span>
    `;
    
    // Save to settings
    this.settings.direction = newDirection;
    saveSettings(this.settings);
  };

  /**
   * Handle shift seasons (rotate clockwise)
   */
  private handleShiftSeasons = (): void => {
    if (!this.renderer) return;
    
    const newOffset = this.renderer.shiftSeasons();
    
    // Save to settings
    this.settings.rotationOffset = newOffset;
    saveSettings(this.settings);
  };

  /**
   * Fetches fresh events from Google Calendar.
   * 
   * Requires user to be authenticated. Fetches all events for the current
   * year, groups them by week number, and updates the calendar visualization.
   * 
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private handleRefreshEvents = async (): Promise<void> => {
    if (googleCalendarService.getAuthStatus()) {
      try {
        this.refreshEventsBtn.disabled = true;
        this.refreshEventsBtn.textContent = 'Loading...';

        const events = await googleCalendarService.fetchEvents(this.currentYear);
        this.eventsByWeek = events;
        
        // Update events based on current mode
        if (this.renderer) {
          this.renderer.updateEvents(this.eventsByWeek);
        }
        if (this.zoomMode) {
          this.zoomMode.updateEvents(this.eventsByWeek);
        }

        this.refreshEventsBtn.textContent = 'Refresh Events';
        toast.success(`Loaded events for ${this.currentYear}`);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to fetch calendar events. Please try again.');
      } finally {
        this.refreshEventsBtn.disabled = false;
      }
    } else {
      this.generateDemoEvents();
    }
  };

  /**
   * Handle Google sign-in
   */
  private handleSignIn = async (): Promise<void> => {
    if (!googleCalendarService.isReady()) {
      toast.warning(
        'Google Calendar integration not configured. Please add your Google OAuth Client ID and API Key to enable this feature.',
        7000
      );
      return;
    }

    try {
      this.headerSignInBtn.disabled = true;
      this.headerSignInBtn.textContent = 'Signing in...';

      await googleCalendarService.signIn();

      // User info is already fetched by signIn, update UI immediately
      await this.updateLoginStatus(true);
      this.refreshEventsBtn.disabled = false;

      // Auto-fetch events after sign-in
      await this.handleRefreshEvents();
      
      toast.success('Signed in successfully!');
    } catch (error) {
      console.error('Sign-in error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
      
      // Reset button state on error
      this.headerSignInBtn.disabled = false;
      this.headerSignInBtn.textContent = 'Sign in with Google';
    }
  };

  /**
   * Handle Google sign-out
   */
  private handleLogout = (): void => {
    googleCalendarService.signOut();
    this.updateLoginStatus(false);
    this.eventsByWeek = {};
    
    // Update events based on current mode
    if (this.renderer) {
      this.renderer.updateEvents(this.eventsByWeek);
    }
    if (this.zoomMode) {
      this.zoomMode.updateEvents(this.eventsByWeek);
    }
    
    toast.info('Signed out successfully');
  };

  /**
   * Handle week click
   */
  private handleWeekClick = (weekIndex: number, event?: MouseEvent): void => {
    if (!this.renderer) return;
    
    const week = this.renderer.getWeek(weekIndex);
    if (!week) return;

    // Ctrl/Cmd + Click = Open in Google Calendar
    if (event && (event.ctrlKey || event.metaKey)) {
      openGoogleCalendarForWeek(weekIndex);
      return;
    }

    const events = week.getEvents();
    this.modal.open(weekIndex, events);
    
    // Update URL to reflect opened week
    router.navigate(`week/${weekIndex + 1}`); // Convert 0-based to 1-based for URL
  };

  /**
   * Handle window resize
   */
  private handleResize = (): void => {
    if (this.renderer) {
      this.renderer.layoutWeeks();
    }
    // Zoom mode handles its own resize
  };

  /**
   * Handle toggle about panel
   */
  private handleToggleAbout = (): void => {
    const isHidden = this.aboutPanel.classList.contains('hidden');
    if (isHidden) {
      router.navigate('about');
    } else {
      router.navigate('');
    }
  };

  /**
   * Handle toggle settings panel
   */
  private handleToggleSettings = (): void => {
    const isHidden = this.settingsPanel.classList.contains('hidden');
    if (isHidden) {
      router.navigate('settings');
    } else {
      router.navigate('');
    }
  };

  /**
   * Handle close settings panel (mobile)
   */
  private handleCloseSettings = (): void => {
    router.navigate('');
  };

  /**
   * Handle previous year button
   */
  private handlePrevYear = (): void => {
    this.currentYear--;
    this.updateYearDisplay();
    
    // Update based on current mode
    if (this.renderer) {
      this.renderer.layoutWeeks();
    }
    if (this.zoomMode) {
      this.zoomMode.setYear(this.currentYear);
    }
    
    // Re-fetch events if logged in
    if (googleCalendarService.getAuthStatus()) {
      this.handleRefreshEvents();
    }
  };

  /**
   * Handle next year button
   */
  private handleNextYear = (): void => {
    this.currentYear++;
    this.updateYearDisplay();
    
    // Update based on current mode
    if (this.renderer) {
      this.renderer.layoutWeeks();
    }
    if (this.zoomMode) {
      this.zoomMode.setYear(this.currentYear);
    }
    
    // Re-fetch events if logged in
    if (googleCalendarService.getAuthStatus()) {
      this.handleRefreshEvents();
    }
  };

  /**
   * Update year display
   */
  private updateYearDisplay = (): void => {
    this.yearDisplay.textContent = this.currentYear.toString();
  };

  /**
   * Handle moon phase toggle
   */
  private handleMoonPhaseToggle = (event: Event): void => {
    const checkbox = event.target as HTMLInputElement;
    this.settings.showMoonPhase = checkbox.checked;
    saveSettings(this.settings);
  };

  /**
   * Handle zodiac toggle
   */
  private handleZodiacToggle = (event: Event): void => {
    const checkbox = event.target as HTMLInputElement;
    this.settings.showZodiac = checkbox.checked;
    saveSettings(this.settings);
  };

  /**
   * Handle Hebrew month toggle
   */
  private handleHebrewMonthToggle = (event: Event): void => {
    const checkbox = event.target as HTMLInputElement;
    this.settings.showHebrewMonth = checkbox.checked;
    saveSettings(this.settings);
  };

  /**
   * Handle theme toggle
   */
  /**
   * Handle theme change from radio buttons
   */
  private handleThemeChange = (event: Event): void => {
    const radio = event.target as HTMLInputElement;
    const newTheme = radio.value as ThemePreference;
    
    this.settings.theme = newTheme;
    saveSettings(this.settings);
    
    // Apply the resolved theme
    const resolvedTheme = resolveTheme(newTheme);
    applyTheme(resolvedTheme);
    
    // Setup or cleanup system theme watching
    this.setupSystemThemeWatch();
    
    toast.success(`Theme set to ${newTheme}${newTheme === 'auto' ? ' (follows system)' : ''}`);
  };

  /**
   * Setup system theme watcher if 'auto' is selected
   */
  private setupSystemThemeWatch = (): void => {
    // Cleanup previous watcher if exists
    if (this.cleanupSystemThemeWatch) {
      this.cleanupSystemThemeWatch();
      this.cleanupSystemThemeWatch = null;
    }
    
    // Only watch if theme is set to 'auto'
    if (this.settings.theme === 'auto') {
      this.cleanupSystemThemeWatch = watchSystemTheme((newSystemTheme) => {
        applyTheme(newSystemTheme);
        console.log(`System theme changed to: ${newSystemTheme}`);
      });
    }
  };

  /**
   * Generate demo events for testing
   */
  private generateDemoEvents = (): void => {
    this.eventsByWeek = {};
    
    const eventCount = Math.floor(Math.random() * 15) + 10;
    
    for (let i = 0; i < eventCount; i++) {
      const weekIndex = Math.floor(Math.random() * 52);
      const dayIndex = Math.floor(Math.random() * 7);
      
      if (!this.eventsByWeek[weekIndex]) {
        this.eventsByWeek[weekIndex] = [];
      }
      
      this.eventsByWeek[weekIndex].push({
        summary: this.getRandomEventName(),
        start: `2025-01-01T${9 + Math.floor(Math.random() * 9)}:00:00`,
        _day: dayIndex,
        _weekIndex: weekIndex,
      });
    }
    
    // Update events based on current mode
    if (this.renderer) {
      this.renderer.updateEvents(this.eventsByWeek);
    }
    if (this.zoomMode) {
      this.zoomMode.updateEvents(this.eventsByWeek);
    }
  };

  /**
   * Get random event name for demo
   */
  private getRandomEventName = (): string => {
    const events = [
      'Team Meeting',
      'Project Review',
      'Client Call',
      'Lunch Break',
      'Workshop',
      'Training Session',
      'One-on-One',
      'Code Review',
      'Sprint Planning',
      'Retrospective',
    ];
    return events[Math.floor(Math.random() * events.length)];
  };

  /**
   * Handles language selection change.
   * 
   * Updates settings and reloads page to apply new language.
   * 
   * @private
   * @returns {void}
   */
  private handleLanguageChange = (): void => {
    const selectedLocale = this.languageSelect.value as Locale;
    this.settings.locale = selectedLocale;
    saveSettings(this.settings);
    setLocale(selectedLocale);
    
    // Show toast and reload
    toast.success(t().settingsSaved);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  /**
   * Updates the login status indicator in the header.
   * 
   * Shows/hides the status badge and updates the visual state.
   * 
   * @private
   * @param {boolean} isLoggedIn - Whether user is currently logged in
   * @returns {void}
   */
  private updateLoginStatus = async (isLoggedIn: boolean): Promise<void> => {
    const statusDot = this.loginStatus.querySelector('.status-dot') as HTMLElement;
    const statusText = this.loginStatus.querySelector('.status-text') as HTMLElement;
    
    if (isLoggedIn) {
      // Get user info from Google (try fetching if not available)
      let userInfo = googleCalendarService.getUserInfo();
      
      // If user info is not available, try to fetch it
      if (!userInfo || !userInfo.name) {
        // Fetch user info asynchronously
        await googleCalendarService.fetchUserInfo();
        userInfo = googleCalendarService.getUserInfo();
      }
      
      const displayName = userInfo?.name || 'User';
      
      // Show personalized "Logged in" status, hide sign-in button
      this.loginStatus.classList.remove('hidden');
      this.headerSignInBtn.classList.add('hidden');
      statusDot.classList.remove('bg-red-500');
      statusDot.classList.add('bg-green-500');
      statusText.textContent = `Hello, ${displayName}`;
      
      // Show logout button, hide sign-in from settings
      this.logoutBtn.classList.remove('hidden');
    } else {
      // Hide status, show sign-in button in header
      this.loginStatus.classList.add('hidden');
      this.headerSignInBtn.classList.remove('hidden');
      
      // Hide logout button
      this.logoutBtn.classList.add('hidden');
    }
  };

  /**
   * Update all UI text with current translations
   */
  private updateUIText = (): void => {
    const translations = t();
    
    // Update header buttons
    this.toggleSettingsBtn.setAttribute('title', translations.settingsButton);
    this.toggleSettingsBtn.setAttribute('aria-label', translations.settingsButton);
    this.toggleAboutBtn.setAttribute('title', translations.aboutButton);
    this.toggleAboutBtn.setAttribute('aria-label', translations.aboutButton);
    this.headerSignInBtn.setAttribute('aria-label', translations.signInWithGoogle);
    const signInText = this.headerSignInBtn.querySelector('span');
    if (signInText) signInText.textContent = translations.signInWithGoogle;
    
    // Update settings panel
    const settingsTitle = document.querySelector('#settingsPanel h2');
    if (settingsTitle) settingsTitle.textContent = translations.settingsTitle;
    
    const closeSettingsBtn = document.querySelector('#closeSettingsBtn');
    if (closeSettingsBtn) {
      closeSettingsBtn.setAttribute('aria-label', translations.closeSettings);
      closeSettingsBtn.setAttribute('title', translations.closeSettings + ' (Esc)');
    }
    
    // Update section headers (using data attributes)
    const shapeHeader = document.querySelector('[data-i18n-header="shape"]');
    if (shapeHeader) shapeHeader.textContent = translations.shapeSection;
    
    const calendarHeader = document.querySelector('[data-i18n-header="calendar"]');
    if (calendarHeader) calendarHeader.textContent = translations.calendarSection;
    
    const displayHeader = document.querySelector('[data-i18n-header="display"]');
    if (displayHeader) displayHeader.textContent = translations.displaySection + ' & ' + translations.language;
    
    const tooltipsHeader = document.querySelector('[data-i18n-header="tooltips"]');
    if (tooltipsHeader) tooltipsHeader.textContent = translations.displaySection;
    
    // Update checkboxes labels (using data attributes for reliability)
    const moonLabel = document.querySelector('[data-i18n-label="showMoonPhase"]');
    if (moonLabel) {
      moonLabel.innerHTML = `<span class="inline-block mr-2">🌙</span>${translations.showMoonPhase}`;
    }
    
    const zodiacLabel = document.querySelector('[data-i18n-label="showZodiac"]');
    if (zodiacLabel) {
      zodiacLabel.innerHTML = `<span class="inline-block mr-2">♈</span>${translations.showZodiac}`;
    }
    
    const hebrewLabel = document.querySelector('[data-i18n-label="showHebrewMonth"]');
    if (hebrewLabel) {
      hebrewLabel.innerHTML = `<span class="inline-block mr-2">✡️</span>${translations.showHebrewMonth}`;
    }
    
    // Update corner radius label
    const cornerRadiusLabel = document.querySelector('label[for="radiusRange"]');
    if (cornerRadiusLabel) cornerRadiusLabel.textContent = translations.cornerRadius;
    
    // Update theme label (find by emoji instead of text)
    const themeLabel = Array.from(document.querySelectorAll('#settingsPanel label'))
      .find(l => l.innerHTML.includes('☀️'));
    if (themeLabel) {
      themeLabel.innerHTML = `<span class="inline-block">☀️</span>${translations.themeLabel}`;
    }
    
    // Update theme radio labels
    const themeAutoLabel = this.themeAutoRadio.parentElement?.querySelector('span');
    if (themeAutoLabel) themeAutoLabel.textContent = translations.themeAuto;
    
    const themeLightLabel = this.themeLightRadio.parentElement?.querySelector('span');
    if (themeLightLabel) themeLightLabel.textContent = translations.themeLight;
    
    const themeDarkLabel = this.themeDarkRadio.parentElement?.querySelector('span');
    if (themeDarkLabel) themeDarkLabel.textContent = translations.themeDark;
    
    // Update language label
    const languageLabel = document.querySelector('label[for="languageSelect"]');
    if (languageLabel) languageLabel.textContent = translations.language;
    
    // Update buttons
    const timeFlowText = this.toggleDirectionBtn.querySelector('span:first-child');
    if (timeFlowText) timeFlowText.textContent = translations.timeFlow;
    
    const shiftBtn = this.shiftSeasonsBtn.querySelector('span:last-child');
    if (shiftBtn) shiftBtn.textContent = translations.shiftSeasons;
    
    const refreshBtn = this.refreshEventsBtn.querySelector('span:last-child');
    if (refreshBtn) refreshBtn.textContent = translations.refreshEvents;
    
    const logoutBtn = this.logoutBtn.querySelector('span:last-child');
    if (logoutBtn) logoutBtn.textContent = translations.signOut;
    
    // Update about panel
    const aboutTitle = this.aboutPanel.querySelector('h2');
    if (aboutTitle) aboutTitle.textContent = translations.aboutTitle;
    
    const aboutDesc = this.aboutPanel.querySelector('p');
    if (aboutDesc) aboutDesc.textContent = translations.aboutDescription;
    
    // Update footer links
    const privacyLink = document.querySelector('a[href="privacy.html"]');
    if (privacyLink) privacyLink.textContent = translations.privacyPolicy;
    
    const termsLink = document.querySelector('a[href="terms.html"]');
    if (termsLink) termsLink.textContent = translations.termsOfService;
    
    const userAgreementLink = document.querySelector('a[href="agreement.html"]');
    if (userAgreementLink) userAgreementLink.textContent = translations.userAgreement;
    
    // Update season labels
    const seasonLabels = document.querySelectorAll('.season-label');
    seasonLabels.forEach((label) => {
      const season = label.getAttribute('data-season');
      if (season === 'winter') label.textContent = translations.winter;
      if (season === 'spring') label.textContent = translations.spring;
      if (season === 'summer') label.textContent = translations.summer;
      if (season === 'autumn') label.textContent = translations.autumn;
    });
    
    // Update modal
    const openInCalendarBtn = document.querySelector('#openInGoogle span');
    if (openInCalendarBtn) openInCalendarBtn.textContent = translations.openInCalendar;
    
    const closeModalBtn = document.querySelector('#closeModal');
    if (closeModalBtn) closeModalBtn.setAttribute('aria-label', translations.close);
  };

  /**
   * Cleanup method - removes event listeners and stops timers
   * Call this before destroying the app instance
   */
  destroy = (): void => {
    // Remove event listeners
    this.radiusInput.removeEventListener('input', this.handleRadiusChange);
    this.toggleDirectionBtn.removeEventListener('click', this.handleDirectionToggle);
    this.shiftSeasonsBtn.removeEventListener('click', this.handleShiftSeasons);
    this.refreshEventsBtn.removeEventListener('click', this.handleRefreshEvents);
    this.headerSignInBtn.removeEventListener('click', this.handleSignIn);
    this.logoutBtn.removeEventListener('click', this.handleLogout);
    this.toggleAboutBtn.removeEventListener('click', this.handleToggleAbout);
    this.toggleSettingsBtn.removeEventListener('click', this.handleToggleSettings);
    this.closeSettingsBtn.removeEventListener('click', this.handleCloseSettings);
    this.showMoonPhaseCheckbox.removeEventListener('change', this.handleMoonPhaseToggle);
    this.showZodiacCheckbox.removeEventListener('change', this.handleZodiacToggle);
    this.showHebrewMonthCheckbox.removeEventListener('change', this.handleHebrewMonthToggle);
    
    // Theme radio buttons
    this.themeAutoRadio.removeEventListener('change', this.handleThemeChange);
    this.themeLightRadio.removeEventListener('change', this.handleThemeChange);
    this.themeDarkRadio.removeEventListener('change', this.handleThemeChange);
    
    this.languageSelect.removeEventListener('change', this.handleLanguageChange);
    if (this.modeSelector) {
      this.modeSelector.removeEventListener('change', this.handleModeChange);
    }
    this.headerModeOldRadio.removeEventListener('change', this.handleModeChange);
    this.headerModeRingsRadio.removeEventListener('change', this.handleModeChange);
    this.headerModeZoomRadio.removeEventListener('change', this.handleModeChange);
    if (this.modeOldRadio) {
      this.modeOldRadio.removeEventListener('change', this.handleModeChange);
    }
    if (this.modeRingsRadio) {
      this.modeRingsRadio.removeEventListener('change', this.handleModeChange);
    }
    if (this.modeZoomRadio) {
      this.modeZoomRadio.removeEventListener('change', this.handleModeChange);
    }
    this.prevYearBtn.removeEventListener('click', this.handlePrevYear);
    this.nextYearBtn.removeEventListener('click', this.handleNextYear);
    window.removeEventListener('resize', this.handleResize);

    // Cleanup renderer (stops timers)
    if (this.renderer) {
      this.renderer.destroy();
    }
    
    // Cleanup zoom mode
    if (this.zoomMode) {
      this.zoomMode.destroy();
    }
    
    // Cleanup keyboard shortcuts
    keyboardManager.destroy();
    
    // Cleanup router
    router.destroy();
    
    // Cleanup system theme watcher
    if (this.cleanupSystemThemeWatch) {
      this.cleanupSystemThemeWatch();
    }
    
    console.log('CalendarApp destroyed and cleaned up');
  };
}

