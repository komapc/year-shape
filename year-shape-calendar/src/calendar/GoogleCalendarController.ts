import { googleCalendarService } from '../services/googleCalendar';
import { toast } from '../utils/toast';
import type { CalendarEvent } from '../types';

/**
 * GoogleCalendarController class - Manages Google Calendar integration
 * 
 * Handles:
 * - Initialization of GAPI and GIS
 * - Authentication (Sign-in/Sign-out)
 * - Fetching events for a specific year
 * - Tracking session status
 */
export class GoogleCalendarController {
  private currentYear: number;
  private onLoginStatusChange: (isLoggedIn: boolean) => void;
  private onEventsFetched: (events: Record<number, CalendarEvent[]>) => void;

  constructor(
    currentYear: number,
    onLoginStatusChange: (isLoggedIn: boolean) => void,
    onEventsFetched: (events: Record<number, CalendarEvent[]>) => void
  ) {
    this.currentYear = currentYear;
    this.onLoginStatusChange = onLoginStatusChange;
    this.onEventsFetched = onEventsFetched;
  }

  /**
   * Initializes Google Calendar API integration
   */
  public async initialize(): Promise<void> {
    try {
      await this.waitForGoogleScripts();
      await googleCalendarService.initializeGapi();
      googleCalendarService.initializeGis();

      const sessionRestored = await googleCalendarService.restoreSession();
      if (sessionRestored) {
        console.log('✅ Session restored - user is logged in');
        this.onLoginStatusChange(true);
        await this.refreshEvents(this.currentYear);
      } else {
        console.log('ℹ️ No saved session - user needs to sign in');
        this.onLoginStatusChange(false);
      }
    } catch (error) {
      console.warn('Google Calendar failed to initialize:', error);
    }
  }

  /**
   * Fetches fresh events from Google Calendar
   */
  public async refreshEvents(year: number): Promise<void> {
    if (!googleCalendarService.getAuthStatus()) return;
    
    try {
      const events = await googleCalendarService.fetchEvents(year);
      this.onEventsFetched(events);
      toast.success(`Loaded events for ${year}`);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch calendar events. Please try again.');
    }
  }

  /**
   * Triggers Google Sign-in flow
   */
  public async signIn(): Promise<void> {
    if (!googleCalendarService.isReady()) {
      toast.warning('Google Calendar integration not configured.', 7000);
      return;
    }

    try {
      await googleCalendarService.signIn();
      this.onLoginStatusChange(true);
      await this.refreshEvents(this.currentYear);
      toast.success('Signed in successfully');
    } catch (error) {
      console.error('Sign-in error:', error);
      this.onLoginStatusChange(false);
    }
  }

  /**
   * Triggers logout flow
   */
  public logout(): void {
    googleCalendarService.signOut();
    this.onLoginStatusChange(false);
    toast.info('Signed out successfully');
  }

  private waitForGoogleScripts(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 10000);
    });
  }
}
