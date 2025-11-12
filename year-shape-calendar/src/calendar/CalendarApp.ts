/**
 * Main Calendar Application controller
 */

import type { CalendarEvent } from '../types';
import { CalendarRenderer } from './CalendarRenderer';
import { WeekModal } from './WeekModal';
import { googleCalendarService } from '../services/googleCalendar';
import { getElement } from '../utils/dom';
import { openGoogleCalendarForWeek } from '../utils/date';
import { loadSettings, saveSettings, type AppSettings } from '../utils/settings';

export class CalendarApp {
  private renderer: CalendarRenderer;
  private modal: WeekModal;
  private eventsByWeek: Record<number, CalendarEvent[]> = {};

  // UI Elements
  private radiusInput: HTMLInputElement;
  private shapeContainer: HTMLElement;
  private toggleDirectionBtn: HTMLButtonElement;
  private shiftSeasonsBtn: HTMLButtonElement;
  private refreshEventsBtn: HTMLButtonElement;
  private signInBtn: HTMLButtonElement;
  private toggleAboutBtn: HTMLButtonElement;
  private toggleSettingsBtn: HTMLButtonElement;
  private aboutPanel: HTMLElement;
  private settingsPanel: HTMLElement;
  private showMoonPhaseCheckbox: HTMLInputElement;
  private showZodiacCheckbox: HTMLInputElement;
  private lightThemeCheckbox: HTMLInputElement;
  private settings: AppSettings;

  constructor() {
    // Get DOM elements
    this.radiusInput = getElement<HTMLInputElement>('radiusRange');
    this.shapeContainer = getElement('yearShape');
    this.toggleDirectionBtn = getElement<HTMLButtonElement>('toggleDirection');
    this.shiftSeasonsBtn = getElement<HTMLButtonElement>('shiftSeasons');
    this.refreshEventsBtn = getElement<HTMLButtonElement>('refreshEvents');
    this.signInBtn = getElement<HTMLButtonElement>('signInBtn');
    this.toggleAboutBtn = getElement<HTMLButtonElement>('toggleAbout');
    this.toggleSettingsBtn = getElement<HTMLButtonElement>('toggleSettings');
    this.aboutPanel = getElement('aboutPanel');
    this.settingsPanel = getElement('settingsPanel');
    this.showMoonPhaseCheckbox = getElement<HTMLInputElement>('showMoonPhase');
    this.showZodiacCheckbox = getElement<HTMLInputElement>('showZodiac');
    this.lightThemeCheckbox = getElement<HTMLInputElement>('lightTheme');

    // Load settings
    this.settings = loadSettings();
    
    // Apply settings to UI
    this.showMoonPhaseCheckbox.checked = this.settings.showMoonPhase;
    this.showZodiacCheckbox.checked = this.settings.showZodiac;
    this.lightThemeCheckbox.checked = this.settings.theme === 'light';
    
    // Apply theme
    this.applyTheme(this.settings.theme || 'dark');

    // Initialize components
    this.renderer = new CalendarRenderer(this.shapeContainer);
    this.modal = new WeekModal();

    // Setup
    this.attachEventListeners();
    this.initializeGoogleCalendar();
    this.generateDemoEvents();
    this.renderer.layoutWeeks();
  }

  /**
   * Initialize Google Calendar integration
   */
  private initializeGoogleCalendar = async (): Promise<void> => {
    try {
      // Wait for Google API scripts to load
      await this.waitForGoogleScripts();
      
      await googleCalendarService.initializeGapi();
      googleCalendarService.initializeGis();

      console.log('Google Calendar integration ready');
    } catch (error) {
      console.warn('Google Calendar not configured or failed to initialize:', error);
      // App will work with demo events
    }
  };

  /**
   * Wait for Google scripts to load
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

    // Google sign-in
    this.signInBtn.addEventListener('click', this.handleSignIn);

    // Week click handler
    this.renderer.onWeekClick(this.handleWeekClick);

    // Window resize
    window.addEventListener('resize', this.handleResize);

    // Toggle about
    this.toggleAboutBtn.addEventListener('click', this.handleToggleAbout);

    // Toggle settings
    this.toggleSettingsBtn.addEventListener('click', this.handleToggleSettings);

    // Settings checkboxes
    this.showMoonPhaseCheckbox.addEventListener('change', this.handleMoonPhaseToggle);
    this.showZodiacCheckbox.addEventListener('change', this.handleZodiacToggle);
    this.lightThemeCheckbox.addEventListener('change', this.handleThemeToggle);
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
   * Handle direction toggle
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
   * Handle refresh events
   */
  private handleRefreshEvents = async (): Promise<void> => {
    if (googleCalendarService.getAuthStatus()) {
      try {
        this.refreshEventsBtn.disabled = true;
        this.refreshEventsBtn.textContent = 'Loading...';

        const events = await googleCalendarService.fetchEvents();
        this.eventsByWeek = events;
        this.renderer.updateEvents(this.eventsByWeek);

        this.refreshEventsBtn.textContent = 'Refresh Events';
      } catch (error) {
        console.error('Error fetching events:', error);
        alert('Failed to fetch calendar events. Please try again.');
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
      alert(
        'Google Calendar integration not configured.\n\n' +
        'Please add your Google OAuth Client ID and API Key to\n' +
        'src/utils/constants.ts to enable this feature.'
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
      alert('Failed to sign in. Please try again.');
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
    this.aboutPanel.classList.toggle('hidden');
  };

  /**
   * Handle toggle settings panel
   */
  private handleToggleSettings = (): void => {
    this.settingsPanel.classList.toggle('hidden');
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
}

