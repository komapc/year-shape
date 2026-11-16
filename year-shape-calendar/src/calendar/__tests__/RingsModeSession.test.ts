
import { describe, it, expect, vi } from 'vitest';
import { googleCalendarService } from '../../services/googleCalendar';

describe('GoogleCalendarService Integration Support', () => {
  it('should expose methods required for Rings mode initialization', () => {
    expect(googleCalendarService.initializeGapi).toBeDefined();
    expect(googleCalendarService.initializeGis).toBeDefined();
    expect(googleCalendarService.restoreSession).toBeDefined();
    expect(googleCalendarService.isReady).toBeDefined();
    expect(googleCalendarService.getAuthStatus).toBeDefined();
  });

  it('restores the token from sessionStorage and purges a legacy localStorage token', async () => {
    const setToken = vi.fn();
    (globalThis as any).gapi = {
      client: { setToken, getToken: vi.fn(), request: vi.fn() },
    };
    const svc = googleCalendarService as any;
    svc.gapiInitialized = true;

    const expiry = (Date.now() + 3600000).toString(); // 1 hour ahead
    sessionStorage.setItem('google_access_token', 'session-token');
    sessionStorage.setItem('google_token_expiry', expiry);
    localStorage.setItem('google_access_token', 'legacy-token');
    localStorage.setItem('google_token_expiry', expiry);
    localStorage.setItem('google_user_info', JSON.stringify({ name: 'Test User' }));

    await expect(googleCalendarService.restoreSession()).resolves.toBe(true);
    expect(setToken).toHaveBeenCalledWith({ access_token: 'session-token' });
    expect(localStorage.getItem('google_access_token')).toBeNull();
    expect(localStorage.getItem('google_token_expiry')).toBeNull();

    sessionStorage.clear();
    localStorage.clear();
    delete (globalThis as any).gapi;
    svc.gapiInitialized = false;
    svc.isAuthenticated = false;
  });

  it('does not restore a token that only exists in localStorage', async () => {
    (globalThis as any).gapi = { client: { setToken: vi.fn() } };
    localStorage.setItem('google_access_token', 'legacy-token');
    localStorage.setItem('google_token_expiry', (Date.now() + 3600000).toString());

    await expect(googleCalendarService.restoreSession()).resolves.toBe(false);
    expect(localStorage.getItem('google_access_token')).toBeNull();

    localStorage.clear();
    delete (globalThis as any).gapi;
  });
});
