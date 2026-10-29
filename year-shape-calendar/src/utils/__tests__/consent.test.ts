import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CONSENT_KEY, getConsent, initConsentBanner } from '../consent';

describe('consent banner', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it('shows the banner when no choice is stored', () => {
    initConsentBanner();
    expect(document.getElementById('consentBanner')).not.toBeNull();
    expect(getConsent()).toBeNull();
  });

  it('does not show the banner once a choice is stored', () => {
    localStorage.setItem(CONSENT_KEY, 'no');
    initConsentBanner();
    expect(document.getElementById('consentBanner')).toBeNull();
  });

  it('Allow stores yes and grants analytics_storage', () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
    initConsentBanner();
    (document.getElementById('consentYes') as HTMLButtonElement).click();
    expect(localStorage.getItem(CONSENT_KEY)).toBe('yes');
    expect(gtag).toHaveBeenCalledWith('consent', 'update', { analytics_storage: 'granted' });
    expect(document.getElementById('consentBanner')).toBeNull();
  });

  it('Decline stores no and keeps analytics denied', () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
    initConsentBanner();
    (document.getElementById('consentNo') as HTMLButtonElement).click();
    expect(localStorage.getItem(CONSENT_KEY)).toBe('no');
    expect(gtag).toHaveBeenCalledWith('consent', 'update', { analytics_storage: 'denied' });
  });

  it('only creates one banner', () => {
    initConsentBanner();
    initConsentBanner();
    expect(document.querySelectorAll('#consentBanner').length).toBe(1);
  });
});
