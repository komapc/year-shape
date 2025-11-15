/**
 * @fileoverview Google Calendar API Integration Service
 * 
 * Manages all interactions with Google Calendar API, including:
 * - API client initialization (GAPI)
 * - OAuth 2.0 authentication (GIS - Google Identity Services)
 * - Access token management and persistence
 * - Event fetching and mapping
 * - Session restoration from localStorage
 * 
 * Authentication Flow:
 * 1. User clicks "Sign in with Google"
 * 2. OAuth consent screen opens
 * 3. User grants calendar.readonly permission
 * 4. Access token received (expires in ~1 hour)
 * 5. Token stored in localStorage for persistence
 * 6. Events fetched automatically
 * 
 * Session Persistence:
 * - Tokens saved to localStorage with expiry timestamp
 * - Auto-restore on page load if token still valid
 * - 5-minute safety buffer before expiry
 * 
 * @author YearWheel Team
 * @version 0.9.1
 */

import type { CalendarEvent } from '../types';
import { GOOGLE_CALENDAR_CONFIG } from '../utils/constants';
import { mapGoogleCalendarEvent, getWeekNumber } from '../utils/date';

class GoogleCalendarService {
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private gapiInitialized = false;
  private gisInitialized = false;
  private isAuthenticated = false;
  private userInfo: { name?: string; email?: string } | null = null;
  private readonly TOKEN_STORAGE_KEY = 'google_access_token';
  private readonly TOKEN_EXPIRY_KEY = 'google_token_expiry';
  private readonly USER_INFO_KEY = 'google_user_info';

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
      
      // Try to restore session from localStorage (async)
      this.restoreSession().catch(err => 
        console.warn('Session restore failed:', err)
      );
    } catch (error) {
      console.error('Error initializing GIS:', error);
      throw error;
    }
  };

  /**
   * Restore session from stored access token
   */
  restoreSession = async (): Promise<boolean> => {
    try {
      const storedToken = localStorage.getItem(this.TOKEN_STORAGE_KEY);
      const storedExpiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

      if (storedToken && storedExpiry) {
        const expiryTime = parseInt(storedExpiry, 10);
        const now = Date.now();

        // Check if token is still valid (with 5-minute buffer)
        if (expiryTime > now + 5 * 60 * 1000) {
          // Wait for gapi to be ready
          if (!this.gapiInitialized) {
            console.log('Waiting for gapi initialization before restoring session...');
            await this.initializeGapi();
          }
          
          // Verify gapi.client exists
          if (typeof gapi !== 'undefined' && gapi.client) {
            gapi.client.setToken({ access_token: storedToken });
            this.isAuthenticated = true;
            const minutesLeft = Math.floor((expiryTime - now) / (60 * 1000));
            console.log(`✅ Session restored! Token valid for ${minutesLeft} more minutes`);
            
            // Load user info from localStorage or fetch if not available
            const storedUserInfo = localStorage.getItem(this.USER_INFO_KEY);
            if (storedUserInfo) {
              try {
                this.userInfo = JSON.parse(storedUserInfo);
                console.log('✅ User info loaded from storage:', this.userInfo);
              } catch (err) {
                console.warn('Failed to parse stored user info, will fetch fresh:', err);
                await this.fetchUserInfo();
              }
            } else {
              // Fetch user info if not in storage
              await this.fetchUserInfo();
            }
            
            return true;
          } else {
            console.warn('❌ gapi.client not available, cannot restore session');
            this.clearSession();
            return false;
          }
        } else {
          // Token expired, clear storage
          this.clearSession();
          console.log('❌ Stored token expired, cleared from storage');
          return false;
        }
      } else {
        console.log('ℹ️ No stored session found');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
      this.clearSession();
      return false;
    }
  };

  /**
   * Store access token in localStorage
   */
  private storeSession = (token: string, expiresIn: number): void => {
    try {
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      console.log('Session stored in localStorage');
    } catch (error) {
      console.warn('Failed to store session:', error);
    }
  };

  /**
   * Clear stored session
   */
  private clearSession = (): void => {
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
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
        
        // Store the access token and expiry
        if (response.access_token && response.expires_in) {
          this.storeSession(response.access_token, parseInt(response.expires_in as unknown as string, 10));
        }
        
        // Fetch and store user info before resolving
        this.fetchUserInfo()
          .then(() => {
            console.log('✅ User info fetched:', this.userInfo);
        resolve();
          })
          .catch(err => {
            console.warn('Failed to fetch user info:', err);
            resolve(); // Still resolve even if user info fails
          });
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
      this.userInfo = null;
      this.clearSession();
      localStorage.removeItem(this.USER_INFO_KEY);
    }
  };

  /**
   * Fetch user info from Google
   */
  fetchUserInfo = async (): Promise<void> => {
    try {
      const response = await gapi.client.request({
        path: 'https://www.googleapis.com/oauth2/v2/userinfo'
      });
      
      this.userInfo = {
        name: response.result.name,
        email: response.result.email
      };
      
      // Store user info
      localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(this.userInfo));
    } catch (error) {
      console.warn('Failed to fetch user info:', error);
    }
  };

  /**
   * Get stored user info
   */
  getUserInfo = (): { name?: string; email?: string } | null => {
    if (this.userInfo) return this.userInfo;
    
    // Try to load from localStorage
    try {
      const stored = localStorage.getItem(this.USER_INFO_KEY);
      if (stored) {
        this.userInfo = JSON.parse(stored);
        return this.userInfo;
      }
    } catch (error) {
      console.warn('Failed to load user info:', error);
    }
    
    return null;
  };

  /**
   * Fetch events from Google Calendar for a specific year
   * @param year - The year to fetch events for (defaults to current year)
   */
  fetchEvents = async (year?: number): Promise<Record<number, CalendarEvent[]>> => {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const targetYear = year || new Date().getFullYear();
      const startOfYear = new Date(targetYear, 0, 1);
      const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

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

      console.log(`Fetched ${events.length} events from Google Calendar for year ${targetYear}`);
      return eventsByWeek;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  };
}

export const googleCalendarService = new GoogleCalendarService();

