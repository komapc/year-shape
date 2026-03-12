import { getElement } from '../utils/dom';
import { translate, type Translations } from '../i18n';
import type { AppSettings, CalendarMode } from '../utils/settings';
import { resolveTheme, applyTheme } from '../utils/theme';

/**
 * UIManager class - Handles DOM element references and basic UI state
 * 
 * This class isolates all DOM-specific logic from the main application controller.
 * It manages:
 * - Querying and storing DOM element references
 * - Updating UI text (translations)
 * - Toggling panels (Settings, About)
 * - Syncing settings with UI controls
 */
export class UIManager {
  // UI Elements
  public radiusInput: HTMLInputElement;
  public shapeContainer: HTMLElement;
  public toggleDirectionBtn: HTMLButtonElement;
  public shiftSeasonsBtn: HTMLButtonElement;
  public refreshEventsBtn: HTMLButtonElement;
  public logoutBtn: HTMLButtonElement;
  public toggleAboutBtn: HTMLButtonElement;
  public toggleSettingsBtn: HTMLButtonElement;
  public closeSettingsBtn: HTMLButtonElement;
  public aboutPanel: HTMLElement;
  public settingsPanel: HTMLElement;
  public showMoonPhaseCheckbox: HTMLInputElement;
  public showZodiacCheckbox: HTMLInputElement;
  public showHebrewMonthCheckbox: HTMLInputElement;
  public themeAutoRadio: HTMLInputElement;
  public themeLightRadio: HTMLInputElement;
  public themeDarkRadio: HTMLInputElement;
  public languageSelect: HTMLSelectElement;
  public headerModeOldRadio: HTMLInputElement;
  public headerModeRingsRadio: HTMLInputElement;
  public headerModeZoomRadio: HTMLInputElement;
  public modeOldRadio: HTMLInputElement | null = null;
  public modeRingsRadio: HTMLInputElement | null = null;
  public modeZoomRadio: HTMLInputElement | null = null;
  public loginStatus: HTMLElement | null = null;
  public headerSignInBtn: HTMLButtonElement | null = null;
  public prevYearBtn: HTMLButtonElement | null = null;
  public nextYearBtn: HTMLButtonElement | null = null;
  public yearDisplay: HTMLElement | null = null;

  constructor() {
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
    
    this.headerModeOldRadio = getElement<HTMLInputElement>('headerModeOld');
    this.headerModeRingsRadio = getElement<HTMLInputElement>('headerModeRings');
    this.headerModeZoomRadio = getElement<HTMLInputElement>('headerModeZoom');
    
    // Optional elements (might not exist on rings.html or based on environment)
    this.modeOldRadio = this.getOptionalElement<HTMLInputElement>('modeOld');
    this.modeRingsRadio = this.getOptionalElement<HTMLInputElement>('modeRings');
    this.modeZoomRadio = this.getOptionalElement<HTMLInputElement>('modeZoom');
    this.loginStatus = this.getOptionalElement<HTMLElement>('loginStatus');
    this.headerSignInBtn = this.getOptionalElement<HTMLButtonElement>('headerSignInBtn');
    this.prevYearBtn = this.getOptionalElement<HTMLButtonElement>('prevYear');
    this.nextYearBtn = this.getOptionalElement<HTMLButtonElement>('nextYear');
    this.yearDisplay = this.getOptionalElement<HTMLElement>('currentYearText');
  }

  /**
   * Safe wrapper for getElement that returns null instead of throwing
   */
  private getOptionalElement<T extends HTMLElement>(id: string): T | null {
    try {
      return getElement<T>(id);
    } catch {
      return null;
    }
  }

  /**
   * Sync settings with UI controls
   */
  public syncSettings(settings: AppSettings): void {
    this.showMoonPhaseCheckbox.checked = settings.showMoonPhase;
    this.showZodiacCheckbox.checked = settings.showZodiac;
    this.showHebrewMonthCheckbox.checked = settings.showHebrewMonth;
    
    const themePreference = settings.theme || 'auto';
    this.themeAutoRadio.checked = themePreference === 'auto';
    this.themeLightRadio.checked = themePreference === 'light';
    this.themeDarkRadio.checked = themePreference === 'dark';
    
    this.languageSelect.value = settings.locale || 'en';
    this.radiusInput.value = settings.cornerRadius.toString();
    
    // Sync mode radios
    const mode = settings.mode || 'zoom';
    this.headerModeOldRadio.checked = mode === 'old';
    this.headerModeRingsRadio.checked = mode === 'rings';
    this.headerModeZoomRadio.checked = mode === 'zoom';
    
    if (this.modeOldRadio) this.modeOldRadio.checked = mode === 'old';
    if (this.modeRingsRadio) this.modeRingsRadio.checked = mode === 'rings';
    if (this.modeZoomRadio) this.modeZoomRadio.checked = mode === 'zoom';

    // Apply corner radius to container
    const wrapElement = document.querySelector('.shape-wrap') as HTMLElement;
    if (wrapElement) {
      wrapElement.style.borderRadius = `${settings.cornerRadius}%`;
    }

    // Apply theme
    applyTheme(resolveTheme(settings.theme || 'auto'));
  }

  /**
   * Update all UI text with current translations
   */
  public updateUIText(): void {
    // Labels with data-i18n-label
    document.querySelectorAll('[data-i18n-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-label');
      if (key) {
        // Find the text node or inner span that needs updating
        const textSpan = el.querySelector('span:last-child') || el;
        textSpan.textContent = translate(key as keyof Translations);
      }
    });

    // Headers with data-i18n-header
    document.querySelectorAll('[data-i18n-header]').forEach(el => {
      const key = el.getAttribute('data-i18n-header');
      if (key) el.textContent = translate(key as keyof Translations);
    });
    
    // Refresh events button text
    if (this.refreshEventsBtn) {
      const btnText = this.refreshEventsBtn.querySelector('.text-sm');
      if (btnText) btnText.textContent = translate('refreshEvents');
    }
    
    // Shift seasons button text
    if (this.shiftSeasonsBtn) {
      const btnText = this.shiftSeasonsBtn.querySelector('.text-sm');
      if (btnText) btnText.textContent = translate('shiftSeasons');
    }

    // Logout button text
    if (this.logoutBtn) {
      const btnText = this.logoutBtn.querySelector('.text-sm');
      if (btnText) btnText.textContent = translate('signOut');
    }
  }

  /**
   * Toggle settings panel
   */
  public toggleSettings(): void {
    this.settingsPanel.classList.toggle('hidden');
    this.aboutPanel.classList.add('hidden');
  }

  /**
   * Toggle about panel
   */
  public toggleAbout(): void {
    this.aboutPanel.classList.toggle('hidden');
    this.settingsPanel.classList.add('hidden');
  }

  /**
   * Close all panels
   */
  public closePanels(): void {
    this.settingsPanel.classList.add('hidden');
    this.aboutPanel.classList.add('hidden');
  }

  /**
   * Update year display text
   */
  public updateYearDisplay(year: number): void {
    if (this.yearDisplay) {
      this.yearDisplay.textContent = year.toString();
    }
  }

  /**
   * Update login status UI
   */
  public updateLoginStatus(isLoggedIn: boolean): void {
    if (!this.loginStatus || !this.headerSignInBtn || !this.logoutBtn) return;
    
    if (isLoggedIn) {
      this.loginStatus.classList.remove('hidden');
      this.headerSignInBtn.classList.add('hidden');
      this.logoutBtn.classList.remove('hidden');
    } else {
      this.loginStatus.classList.add('hidden');
      this.headerSignInBtn.classList.remove('hidden');
      this.logoutBtn.classList.add('hidden');
    }
  }

  /**
   * Update UI visibility based on current mode
   */
  public updateUIForMode(mode: CalendarMode): void {
    const cornerRadiusContainer = this.radiusInput.closest('.flex') as HTMLElement;
    const moonPhaseContainer = this.showMoonPhaseCheckbox.closest('label') as HTMLElement;
    const zodiacContainer = this.showZodiacCheckbox.closest('label') as HTMLElement;
    const hebrewMonthContainer = this.showHebrewMonthCheckbox.closest('label') as HTMLElement;
    
    if (mode === 'zoom') {
      if (cornerRadiusContainer) cornerRadiusContainer.style.display = 'none';
      if (moonPhaseContainer) moonPhaseContainer.style.display = 'none';
      if (zodiacContainer) zodiacContainer.style.display = 'none';
      if (hebrewMonthContainer) hebrewMonthContainer.style.display = 'none';
      this.shiftSeasonsBtn.style.display = 'flex';
    } else if (mode === 'old') {
      if (cornerRadiusContainer) cornerRadiusContainer.style.display = 'flex';
      if (moonPhaseContainer) moonPhaseContainer.style.display = 'flex';
      if (zodiacContainer) zodiacContainer.style.display = 'flex';
      if (hebrewMonthContainer) hebrewMonthContainer.style.display = 'flex';
      this.shiftSeasonsBtn.style.display = 'flex';
    }
  }
}
