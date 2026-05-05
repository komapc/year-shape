/**
 * @fileoverview Main Calendar Application Controller - REFACTORED
 * 
 * Orchestrates the YearWheel application by coordinating specialized managers:
 * - UIManager: DOM elements and UI state
 * - NavigationManager: Year and mode transitions
 * - GoogleCalendarController: Calendar integration
 * - CalendarRenderer/ZoomMode: Visual rendering
 * 
 * This refactored version improves maintainability by delegating responsibilities
 * to focused controller and manager classes.
 */

import type { CalendarEvent, Direction } from '../types';
import { CalendarRenderer } from './CalendarRenderer';
import { WeekModal } from './WeekModal';
import { ZoomMode } from './ZoomMode';
import { googleCalendarService } from '../services/googleCalendar';
import { loadSettings, saveSettings, clearSettings, type AppSettings, type BooleanSettingKey, type CalendarMode } from '../utils/settings';
import { toast } from '../utils/toast';
import { keyboardManager } from '../utils/keyboard';
import { router } from '../utils/router';
import { resolveTheme, applyTheme, watchSystemTheme } from '../utils/theme';
import { t, setLocale, initializeLocale, type Locale } from '../i18n';
import { openGoogleCalendarForWeek, getWeekStartDate } from '../utils/date';

import { UIManager } from './UIManager';
import { NavigationManager } from './NavigationManager';
import { GoogleCalendarController } from './GoogleCalendarController';

/**
 * Main application controller class for YearWheel.
 */
export class CalendarApp {
  private ui: UIManager;
  private nav: NavigationManager;
  private calendar: GoogleCalendarController;
  
  private renderer: CalendarRenderer | null = null;
  private zoomMode: ZoomMode | null = null;
  private modal: WeekModal;
  
  private eventsByWeek: Record<number, CalendarEvent[]> = {};
  private settings: AppSettings;
  private cleanupSystemThemeWatch: (() => void) | null = null;

  constructor() {
    // 0. Initialize locale early so any reset toast renders in the user's language
    initializeLocale();

    // 1. Handle URL-based reset
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      clearSettings();
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
      toast.info(t().settingsResetSuccess);
    }

    // 2. Load Settings & Initialize Managers
    this.settings = loadSettings();
    if (this.settings.locale) {
      setLocale(this.settings.locale as Locale);
    }
    
    this.ui = new UIManager();
    this.nav = new NavigationManager(this.settings);
    
    // 2. Initialize Core Components
    this.modal = new WeekModal();
    this.calendar = new GoogleCalendarController(
      this.nav.getCurrentYear(),
      (isLoggedIn) => this.ui.updateLoginStatus(isLoggedIn),
      (events) => this.updateEvents(events)
    );

    // 3. Sync UI & Setup Handlers
    this.ui.syncSettings(this.settings);
    this.ui.updateUIText();
    this.ui.updateYearDisplay(this.nav.getCurrentYear());
    this.ui.updateUIForMode(this.nav.getCurrentMode());
    
    this.attachEventListeners();
    this.registerKeyboardShortcuts();
    this.registerRoutes();
    
    // 4. Initialize Mode & Calendar
    this.initializeMode();
    this.calendar.initialize().then(() => {
      // If not logged in, generate demo events
      if (!googleCalendarService.getAuthStatus()) {
        this.generateDemoEvents();
      }
    });
    
    // 5. Theme Watch
    this.setupSystemThemeWatch();
  }

  /**
   * Update events across all renderers
   */
  private updateEvents(events: Record<number, CalendarEvent[]>): void {
    this.eventsByWeek = events;
    if (this.renderer) this.renderer.updateEvents(events);
    if (this.zoomMode) this.zoomMode.updateEvents(events);
  }

  /**
   * Initialize mode-specific renderer
   */
  private initializeMode(): void {
    const mode = this.nav.getCurrentMode();
    const year = this.nav.getCurrentYear();

    if (mode === 'zoom') {
      this.initializeZoomMode(year);
    } else if (mode === 'old') {
      this.initializeOldMode(year);
    }
  }

  /**
   * Initialize classic mode
   */
  private initializeOldMode(_year: number): void {
    if (this.zoomMode) {
      this.zoomMode.destroy();
      this.zoomMode = null;
    }
    
    const zoomContainer = document.getElementById('zoomContainer');
    if (zoomContainer) zoomContainer.style.display = 'none';
    
    this.ui.shapeContainer.style.display = 'block';
    
    if (!this.renderer) {
      this.renderer = new CalendarRenderer(
        this.ui.shapeContainer,
        this.settings.cornerRadius / 50,
        this.settings.direction,
        this.settings.rotationOffset
      );
      this.renderer.onWeekClick((idx, e) => this.handleWeekClick(idx, e));
    }
    
    this.renderer.layoutWeeks();
    if (Object.keys(this.eventsByWeek).length > 0) {
      this.renderer.updateEvents(this.eventsByWeek);
    }
  }

  /**
   * Initialize zoom mode
   */
  private initializeZoomMode(year: number): void {
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }
    
    this.ui.shapeContainer.style.display = 'none';
    
    let zoomContainer = document.getElementById('zoomContainer');
    if (!zoomContainer) {
      zoomContainer = document.createElement('div');
      zoomContainer.id = 'zoomContainer';
      zoomContainer.className = 'zoom-container-managed';
      this.ui.shapeContainer.parentElement?.appendChild(zoomContainer);
    }
    zoomContainer.style.display = 'block';
    
    if (!this.zoomMode) {
      this.zoomMode = new ZoomMode(zoomContainer, year, this.settings.zoomState);
      this.zoomMode.setDirection(this.settings.direction);
      this.zoomMode.setRotationOffset(this.settings.rotationOffset);
      this.zoomMode.setOnStateChange((state) => {
        this.settings.zoomState = state;
        this.settings.currentYear = state.year;
        if (this.nav.getCurrentYear() !== state.year) {
          this.nav.setYear(state.year);
          this.ui.updateYearDisplay(state.year);
        }
        saveSettings(this.settings);
      });
      if (this.zoomMode.getCurrentState().year !== year) {
        this.zoomMode.setYear(year);
      }
    } else if (this.zoomMode.getCurrentState().year !== year) {
      this.zoomMode.setYear(year);
      if (this.settings.zoomState) {
        this.settings.zoomState = { ...this.settings.zoomState, year };
      }
      this.settings.currentYear = year;
      saveSettings(this.settings);
    }
    
    if (Object.keys(this.eventsByWeek).length > 0) {
      this.zoomMode.updateEvents(this.eventsByWeek);
    }
  }

  /**
   * Attach all event listeners to UI elements
   */
  private attachEventListeners(): void {
    this.ui.radiusInput.addEventListener('input', (e) => this.handleRadiusChange(e));
    this.ui.toggleDirectionBtn.addEventListener('click', () => this.handleDirectionToggle());
    this.ui.shiftSeasonsBtn.addEventListener('click', () => this.handleShiftSeasons());
    this.ui.refreshEventsBtn.addEventListener('click', () => this.calendar.refreshEvents(this.nav.getCurrentYear()));
    this.ui.headerSignInBtn?.addEventListener('click', () => this.calendar.signIn());
    this.ui.logoutBtn.addEventListener('click', () => this.handleLogout());
    this.ui.toggleAboutBtn.addEventListener('click', () => this.ui.toggleAbout());
    this.ui.toggleSettingsBtn.addEventListener('click', () => this.ui.toggleSettings());
    this.ui.closeSettingsBtn.addEventListener('click', () => this.ui.closePanels());
    this.ui.resetSettingsBtn?.addEventListener('click', () => this.handleReset());
    
    this.ui.showMoonPhaseCheckbox.addEventListener('change', (e) => this.handleToggleSetting(e, 'showMoonPhase'));
    this.ui.showZodiacCheckbox.addEventListener('change', (e) => this.handleToggleSetting(e, 'showZodiac'));
    this.ui.showHebrewMonthCheckbox.addEventListener('change', (e) => this.handleToggleSetting(e, 'showHebrewMonth'));
    
    const themeHandler = (e: Event) => this.handleThemeChange(e);
    this.ui.themeAutoRadio.addEventListener('change', themeHandler);
    this.ui.themeLightRadio.addEventListener('change', themeHandler);
    this.ui.themeDarkRadio.addEventListener('change', themeHandler);
    
    this.ui.languageSelect.addEventListener('change', () => this.handleLanguageChange());
    
    const modeHandler = (e: Event) => this.handleModeChange(e);
    this.ui.headerModeOldRadio.addEventListener('change', modeHandler);
    this.ui.headerModeRingsRadio.addEventListener('change', modeHandler);
    this.ui.headerModeZoomRadio.addEventListener('change', modeHandler);
    this.ui.modeOldRadio?.addEventListener('change', modeHandler);
    this.ui.modeRingsRadio?.addEventListener('change', modeHandler);
    this.ui.modeZoomRadio?.addEventListener('change', modeHandler);

    this.ui.prevYearBtn?.addEventListener('click', () => this.handleYearNav(-1));
    this.ui.nextYearBtn?.addEventListener('click', () => this.handleYearNav(1));
    
    window.addEventListener('resize', () => { 
      if (this.renderer) this.renderer.layoutWeeks(); 
    });
  }

  private handleRadiusChange(e: Event): void {
    const val = parseFloat((e.target as HTMLInputElement).value);
    this.settings.cornerRadius = val;
    saveSettings(this.settings);
    
    const wrap = document.querySelector('.shape-wrap') as HTMLElement;
    if (wrap) wrap.style.borderRadius = `${val}%`;
    if (this.renderer) this.renderer.setCornerRadius(val / 50);
  }

  private handleDirectionToggle(): void {
    const dir = (this.zoomMode?.toggleDirection() ?? this.renderer?.toggleDirection() ?? -1) as Direction;
    this.settings.direction = dir;
    saveSettings(this.settings);
    
    const icon = dir === 1 ? '↻' : '↺';
    const text = dir === 1 ? 'CW' : 'CCW';
    this.ui.toggleDirectionBtn.innerHTML = `<span class="direction-icon">${icon}</span><span>${text}</span>`;
  }

  private handleShiftSeasons(): void {
    const offset = this.zoomMode?.shiftSeasons() ?? this.renderer?.shiftSeasons() ?? 0;
    this.settings.rotationOffset = offset;
    saveSettings(this.settings);
  }

  private handleYearNav(delta: number): void {
    const year = delta > 0 ? this.nav.nextYear() : (delta < 0 ? this.nav.prevYear() : this.nav.getCurrentYear());
    this.ui.updateYearDisplay(year);
    this.initializeMode();
    if (googleCalendarService.getAuthStatus()) {
      this.calendar.refreshEvents(year);
    } else {
      this.generateDemoEvents();
    }
  }

  private handleModeChange(e: Event): void {
    const mode = (e.target as HTMLInputElement).value as CalendarMode;
    this.nav.switchMode(mode);
    if (mode === 'rings') return;
    this.ui.updateUIForMode(mode);
    this.initializeMode();
  }

  private handleToggleSetting(e: Event, key: BooleanSettingKey): void {
    this.settings[key] = (e.target as HTMLInputElement).checked;
    saveSettings(this.settings);
  }

  private handleThemeChange(e: Event): void {
    const theme = (e.target as HTMLInputElement).value as NonNullable<AppSettings['theme']>;
    this.settings.theme = theme;
    saveSettings(this.settings);
    applyTheme(resolveTheme(theme));
    this.setupSystemThemeWatch();
  }

  private handleLanguageChange(): void {
    const locale = this.ui.languageSelect.value as Locale;
    this.settings.locale = locale;
    saveSettings(this.settings);
    toast.success(t().settingsSaved);
    setTimeout(() => window.location.reload(), 500);
  }

  private handleWeekClick(idx: number, event?: MouseEvent): void {
    // Ctrl/Cmd + Click = Open in Google Calendar
    if (event && (event.ctrlKey || event.metaKey)) {
      openGoogleCalendarForWeek(idx);
      return;
    }
    this.modal.open(idx, this.eventsByWeek[idx] || []);
  }

  private handleLogout(): void {
    this.calendar.logout();
    this.eventsByWeek = {};
    if (this.renderer) this.renderer.updateEvents(this.eventsByWeek);
    if (this.zoomMode) this.zoomMode.updateEvents(this.eventsByWeek);
  }

  private handleReset(): void {
    if (confirm(t().confirmResetSettings)) {
      clearSettings();
      window.location.reload();
    }
  }

  /**
   * Swipe navigation methods
   */
  public navigatePrev = (): void => {
    this.handleYearNav(-1);
  };

  public navigateNext = (): void => {
    this.handleYearNav(1);
  };

  public getCurrentMode = (): string => {
    return this.nav.getCurrentMode();
  };

  public getZoomMode = (): ZoomMode | null => {
    return this.zoomMode;
  };

  /**
   * Register keyboard shortcuts
   */
  private registerKeyboardShortcuts(): void {
    keyboardManager.register({ key: 's', callback: () => this.ui.toggleSettings(), description: 'Settings' });
    keyboardManager.register({ key: '?', callback: () => this.ui.toggleAbout(), description: 'About' });
    keyboardManager.register({ key: 'escape', callback: () => { this.ui.closePanels(); router.navigate(''); }, description: 'Close' });
    keyboardManager.register({ key: 'arrowleft', callback: () => this.handleYearNav(-1), description: 'Prev Year' });
    keyboardManager.register({ key: 'arrowright', callback: () => this.handleYearNav(1), description: 'Next Year' });
  }

  /**
   * Register SPA routes
   */
  private registerRoutes(): void {
    router.register('settings', () => this.ui.toggleSettings());
    router.register(':mode/settings', () => this.ui.toggleSettings());
    router.register('about', () => this.ui.toggleAbout());
    router.register(':mode/about', () => this.ui.toggleAbout());
    router.register('week/:id', (p) => this.handleWeekClick(parseInt(p?.id || '1') - 1));
    router.register('year/:y', (p) => {
      const year = parseInt(p?.y || '', 10);
      if (year >= 2000 && year <= 2100) {
        this.nav.setYear(year);
        this.handleYearNav(0);
      }
    });
    router.register('zoom', () => this.nav.switchMode('zoom'));
    router.register('old', () => this.nav.switchMode('old'));
    router.register('', () => this.ui.closePanels());
  }

  private setupSystemThemeWatch(): void {
    if (this.cleanupSystemThemeWatch) this.cleanupSystemThemeWatch();
    if (this.settings.theme === 'auto') {
      this.cleanupSystemThemeWatch = watchSystemTheme(applyTheme);
    }
  }

  /**
   * Generate demo events for testing
   */
  private generateDemoEvents = (): void => {
    this.eventsByWeek = {};
    const eventCount = Math.floor(Math.random() * 15) + 10;
    const year = this.nav.getCurrentYear();

    for (let i = 0; i < eventCount; i++) {
      const weekIndex = Math.floor(Math.random() * 52);
      const dayIndex = Math.floor(Math.random() * 7);

      if (!this.eventsByWeek[weekIndex]) {
        this.eventsByWeek[weekIndex] = [];
      }

      const eventDate = getWeekStartDate(weekIndex, year);
      eventDate.setDate(eventDate.getDate() + dayIndex);
      eventDate.setHours(9 + Math.floor(Math.random() * 9), 0, 0, 0);

      this.eventsByWeek[weekIndex].push({
        summary: this.getRandomEventName(),
        start: eventDate.toISOString(),
        _day: dayIndex,
        _weekIndex: weekIndex,
      });
    }

    this.updateEvents(this.eventsByWeek);
  };

  private getRandomEventName = (): string => {
    const events = ['Meeting', 'Project Review', 'Client Call', 'Workshop', 'Training', 'Code Review', 'Planning'];
    return events[Math.floor(Math.random() * events.length)];
  };

  public destroy(): void {
    if (this.renderer) this.renderer.destroy();
    if (this.zoomMode) this.zoomMode.destroy();
    keyboardManager.destroy();
    router.destroy();
    if (this.cleanupSystemThemeWatch) this.cleanupSystemThemeWatch();
  }
}
