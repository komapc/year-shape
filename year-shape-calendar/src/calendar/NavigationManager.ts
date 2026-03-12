import { router } from '../utils/router';
import { navigateToMode, getModeFromHash } from '../utils/modeNavigation';
import { saveSettings, type AppSettings, type CalendarMode } from '../utils/settings';

/**
 * NavigationManager class - Handles year and mode switching
 * 
 * Centralizes the logic for:
 * - Switching between Old, Rings, and Zoom modes
 * - Year navigation (prev/next)
 * - Routing integration
 * - URL state synchronization
 */
export class NavigationManager {
  private settings: AppSettings;
  private currentYear: number;
  private currentMode: CalendarMode;

  constructor(settings: AppSettings) {
    this.settings = settings;
    this.currentYear = settings.currentYear || new Date().getFullYear();
    this.currentMode = settings.mode || 'zoom';
  }

  public getCurrentYear(): number {
    return this.currentYear;
  }

  public getCurrentMode(): CalendarMode {
    return this.currentMode;
  }

  /**
   * Navigate to previous year
   */
  public prevYear(): number {
    this.currentYear--;
    this.updateYearInSettings();
    this.syncURL();
    return this.currentYear;
  }

  /**
   * Navigate to next year
   */
  public nextYear(): number {
    this.currentYear++;
    this.updateYearInSettings();
    this.syncURL();
    return this.currentYear;
  }

  /**
   * Set specific year
   */
  public setYear(year: number): void {
    if (year >= 2000 && year <= 2100) {
      this.currentYear = year;
      this.updateYearInSettings();
      this.syncURL();
    }
  }

  /**
   * Switch between calendar modes
   */
  public switchMode(mode: CalendarMode): void {
    if (this.currentMode === mode) return;
    
    this.currentMode = mode;
    this.settings.mode = mode;
    saveSettings(this.settings);
    
    if (mode === 'rings') {
      navigateToMode('rings');
    } else {
      this.syncURL();
    }
  }

  /**
   * Sync current state with URL hash
   */
  public syncURL(): void {
    if (this.currentMode === 'zoom') {
      router.navigate(`zoom/year/${this.currentYear}`);
    } else if (this.currentMode === 'old') {
      router.navigate('old');
    }
  }

  /**
   * Get mode from URL hash
   */
  public getModeFromURL(): CalendarMode | null {
    return getModeFromHash();
  }

  private updateYearInSettings(): void {
    this.settings.currentYear = this.currentYear;
    saveSettings(this.settings);
  }
}
