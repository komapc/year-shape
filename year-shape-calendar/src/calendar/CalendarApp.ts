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
import { googleCalendarService } from '../services/googleCalendar';
import { getElement } from '../utils/dom';
import { openGoogleCalendarForWeek } from '../utils/date';
import { loadSettings, saveSettings, type AppSettings } from '../utils/settings';
import { toast } from '../utils/toast';
import { keyboardManager } from '../utils/keyboard';
import { router } from '../utils/router';

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
  private renderer: CalendarRenderer;
  
  /** Week detail modal - displays Soviet-style diary view */
  private modal: WeekModal;
  
  /** Google Calendar events indexed by week number (1-52) */
  private eventsByWeek: Record<number, CalendarEvent[]> = {};

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
  
  /** Google Sign In button */
  private signInBtn: HTMLButtonElement;
  
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
  
  /** Checkbox to toggle light/dark theme */
  private lightThemeCheckbox: HTMLInputElement;
  
  /** Language select dropdown */
  private languageSelect: HTMLSelectElement;
  
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
    this.signInBtn = getElement<HTMLButtonElement>('signInBtn');
    this.toggleAboutBtn = getElement<HTMLButtonElement>('toggleAbout');
    this.toggleSettingsBtn = getElement<HTMLButtonElement>('toggleSettings');
    this.closeSettingsBtn = getElement<HTMLButtonElement>('closeSettingsBtn');
    this.aboutPanel = getElement('aboutPanel');
    this.settingsPanel = getElement('settingsPanel');
    this.showMoonPhaseCheckbox = getElement<HTMLInputElement>('showMoonPhase');
    this.showZodiacCheckbox = getElement<HTMLInputElement>('showZodiac');
    this.showHebrewMonthCheckbox = getElement<HTMLInputElement>('showHebrewMonth');
    this.lightThemeCheckbox = getElement<HTMLInputElement>('lightTheme');
    this.languageSelect = getElement<HTMLSelectElement>('languageSelect');
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
    
    // ========================================
    // 3. Sync Settings to UI Controls
    // ========================================
    this.showMoonPhaseCheckbox.checked = this.settings.showMoonPhase;
    this.showZodiacCheckbox.checked = this.settings.showZodiac;
    this.showHebrewMonthCheckbox.checked = this.settings.showHebrewMonth;
    this.lightThemeCheckbox.checked = this.settings.theme === 'light';
    this.languageSelect.value = this.settings.locale || 'en';
    
    // Apply theme to body element
    this.applyTheme(this.settings.theme || 'dark');

    // ========================================
    // 4. Initialize Core Components
    // ========================================
    this.renderer = new CalendarRenderer(this.shapeContainer);
    this.modal = new WeekModal();

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
    
    // Note: No demo events - only real Google Calendar events are displayed
    this.renderer.layoutWeeks();
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
        this.updateLoginStatus(true);
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

    // Google sign-in (both buttons)
    this.signInBtn.addEventListener('click', this.handleSignIn);
    this.headerSignInBtn.addEventListener('click', this.handleSignIn);

    // Week click handler
    this.renderer.onWeekClick(this.handleWeekClick);

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
    this.lightThemeCheckbox.addEventListener('change', this.handleThemeToggle);
    this.languageSelect.addEventListener('change', this.handleLanguageChange);

    // Year navigation
    this.prevYearBtn.addEventListener('click', this.handlePrevYear);
    this.nextYearBtn.addEventListener('click', this.handleNextYear);
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

    // #year/:year - Navigate to specific year
    router.register('year/:year', (params) => {
      const year = parseInt(params?.year || '', 10);
      if (year >= 2000 && year <= 2100) {
        this.currentYear = year;
        this.updateYearDisplay();
        this.renderer.layoutWeeks();
        if (googleCalendarService.getAuthStatus()) {
          this.handleRefreshEvents();
        }
      }
    });

    // Root / no hash - Close all panels
    router.register('', () => {
      this.settingsPanel.classList.add('hidden');
      this.aboutPanel.classList.add('hidden');
    });
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
    
    // Update week positions to follow the shape
    this.renderer.setCornerRadius(parseFloat(value));
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
    const newDirection = this.renderer.toggleDirection();
    const directionText = newDirection === 1 ? 'CW' : 'CCW';
    const directionIcon = newDirection === 1 ? '↻' : '↺';
    
    this.toggleDirectionBtn.innerHTML = `
      <span class="direction-icon">${directionIcon}</span>
      <span>${directionText}</span>
    `;
  };

  /**
   * Handle shift seasons (rotate clockwise)
   */
  private handleShiftSeasons = (): void => {
    this.renderer.shiftSeasons();
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
        this.renderer.updateEvents(this.eventsByWeek);

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
      this.signInBtn.disabled = true;
      this.signInBtn.textContent = 'Signing in...';

      await googleCalendarService.signIn();

      this.signInBtn.textContent = 'Signed In';
      this.signInBtn.classList.add('bg-green-600');
      this.refreshEventsBtn.disabled = false;

      // Auto-fetch events after sign-in
      await this.handleRefreshEvents();
    } catch (error) {
      console.error('Sign-in error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
      this.signInBtn.textContent = 'Sign in with Google';
      this.signInBtn.disabled = false;
    }
  };

  /**
   * Handle week click
   */
  private handleWeekClick = (weekIndex: number, event?: MouseEvent): void => {
    const week = this.renderer.getWeek(weekIndex);
    if (!week) return;

    // Ctrl/Cmd + Click = Open in Google Calendar
    if (event && (event.ctrlKey || event.metaKey)) {
      openGoogleCalendarForWeek(weekIndex);
      return;
    }

    const events = week.getEvents();
    this.modal.open(weekIndex, events);
  };

  /**
   * Handle window resize
   */
  private handleResize = (): void => {
    this.renderer.layoutWeeks();
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
    this.renderer.layoutWeeks();
    
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
    this.renderer.layoutWeeks();
    
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
  private handleThemeToggle = (event: Event): void => {
    const checkbox = event.target as HTMLInputElement;
    const newTheme = checkbox.checked ? 'light' : 'dark';
    this.settings.theme = newTheme;
    saveSettings(this.settings);
    this.applyTheme(newTheme);
  };

  /**
   * Apply theme to document
   */
  private applyTheme = (theme: 'light' | 'dark'): void => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
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
    
    this.renderer.updateEvents(this.eventsByWeek);
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
    const selectedLocale = this.languageSelect.value as any;
    this.settings.locale = selectedLocale;
    saveSettings(this.settings);
    // Reload page to apply new language
    window.location.reload();
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
  private updateLoginStatus = (isLoggedIn: boolean): void => {
    const statusDot = this.loginStatus.querySelector('.status-dot') as HTMLElement;
    const statusText = this.loginStatus.querySelector('.status-text') as HTMLElement;
    
    if (isLoggedIn) {
      // Show "Logged in" status, hide sign-in button
      this.loginStatus.classList.remove('hidden');
      this.headerSignInBtn.classList.add('hidden');
      statusDot.classList.remove('bg-red-500');
      statusDot.classList.add('bg-green-500');
      statusText.textContent = 'Logged in';
    } else {
      // Hide status, show sign-in button in header
      this.loginStatus.classList.add('hidden');
      this.headerSignInBtn.classList.remove('hidden');
    }
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
    this.signInBtn.removeEventListener('click', this.handleSignIn);
    this.headerSignInBtn.removeEventListener('click', this.handleSignIn);
    this.toggleAboutBtn.removeEventListener('click', this.handleToggleAbout);
    this.toggleSettingsBtn.removeEventListener('click', this.handleToggleSettings);
    this.closeSettingsBtn.removeEventListener('click', this.handleCloseSettings);
    this.showMoonPhaseCheckbox.removeEventListener('change', this.handleMoonPhaseToggle);
    this.showZodiacCheckbox.removeEventListener('change', this.handleZodiacToggle);
    this.showHebrewMonthCheckbox.removeEventListener('change', this.handleHebrewMonthToggle);
    this.lightThemeCheckbox.removeEventListener('change', this.handleThemeToggle);
    this.languageSelect.removeEventListener('change', this.handleLanguageChange);
    this.prevYearBtn.removeEventListener('click', this.handlePrevYear);
    this.nextYearBtn.removeEventListener('click', this.handleNextYear);
    window.removeEventListener('resize', this.handleResize);

    // Cleanup renderer (stops timers)
    this.renderer.destroy();
    
    // Cleanup keyboard shortcuts
    keyboardManager.destroy();
    
    // Cleanup router
    router.destroy();
    
    console.log('CalendarApp destroyed and cleaned up');
  };
}

