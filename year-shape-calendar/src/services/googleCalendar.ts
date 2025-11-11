/**
 * Google Calendar API integration service
 */

import type { CalendarEvent } from '../types';
import { GOOGLE_CALENDAR_CONFIG } from '../utils/constants';
import { mapGoogleCalendarEvent, getWeekNumber } from '../utils/date';

class GoogleCalendarService {
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private gapiInitialized = false;
  private gisInitialized = false;
  private isAuthenticated = false;

  /**
   * Initialize Google API client
   */
  initializeGapi = async (): Promise<void> => {
    if (!GOOGLE_CALENDAR_CONFIG.apiKey || !GOOGLE_CALENDAR_CONFIG.clientId) {
      console.warn('Google Calendar API credentials not configured');
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        gapi.load('client', { callback: resolve, onerror: reject });
      });

      await gapi.client.init({
        apiKey: GOOGLE_CALENDAR_CONFIG.apiKey,
        discoveryDocs: [GOOGLE_CALENDAR_CONFIG.discoveryDoc],
      });

      this.gapiInitialized = true;
      console.log('Google API client initialized');
    } catch (error) {
      console.error('Error initializing GAPI:', error);
      throw error;
    }
  };

  /**
   * Initialize Google Identity Services
   */
  initializeGis = (): void => {
    if (!GOOGLE_CALENDAR_CONFIG.clientId) {
      console.warn('Google OAuth client ID not configured');
      return;
    }

    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CALENDAR_CONFIG.clientId,
        scope: GOOGLE_CALENDAR_CONFIG.scopes,
        callback: '', // Set during sign-in
      });

      this.gisInitialized = true;
      console.log('Google Identity Services initialized');
    } catch (error) {
      console.error('Error initializing GIS:', error);
      throw error;
    }
  };

  /**
   * Check if the service is ready
   */
  isReady = (): boolean => {
    return this.gapiInitialized && this.gisInitialized;
  };

  /**
   * Check if user is authenticated
   */
  getAuthStatus = (): boolean => {
    return this.isAuthenticated;
  };

  /**
   * Sign in the user
   */
  signIn = async (): Promise<void> => {
    if (!this.tokenClient) {
      throw new Error('Google Identity Services not initialized');
    }

    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not available'));
        return;
      }

      this.tokenClient.callback = async (response: google.accounts.oauth2.TokenResponse) => {
        if (response.error) {
          reject(response.error);
          return;
        }

        this.isAuthenticated = true;
        resolve();
      };

      // Request access token
      if (gapi.client.getToken() === null) {
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        this.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  };

  /**
   * Sign out the user
   */
  signOut = (): void => {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken(null);
      this.isAuthenticated = false;
    }
  };

  /**
   * Fetch events from Google Calendar for the current year
   */
  fetchEvents = async (): Promise<Record<number, CalendarEvent[]>> => {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfYear.toISOString(),
        timeMax: endOfYear.toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 500,
        orderBy: 'startTime',
      });

      const events = response.result.items || [];
      const eventsByWeek: Record<number, CalendarEvent[]> = {};

      events.forEach((event: gapi.client.calendar.Event) => {
        const startStr = event.start?.dateTime || event.start?.date;
        if (!startStr) return;

        const startDate = new Date(startStr);
        const weekIndex = getWeekNumber(startDate);
        const mappedEvent = mapGoogleCalendarEvent(event, weekIndex);

        if (!eventsByWeek[weekIndex]) {
          eventsByWeek[weekIndex] = [];
        }
        eventsByWeek[weekIndex].push(mappedEvent);
      });

      console.log(`Fetched ${events.length} events from Google Calendar`);
      return eventsByWeek;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  };
}

export const googleCalendarService = new GoogleCalendarService();

