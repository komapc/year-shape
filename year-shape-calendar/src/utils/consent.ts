/**
 * @fileoverview Minimal analytics consent (Google Consent Mode v2).
 *
 * The inline snippet in index.html / rings.html sets every consent type to
 * 'denied' before the Google tag loads, and grants analytics_storage only if
 * the visitor already opted in. This module shows a small banner to visitors
 * who have not chosen yet and stores the choice under `yearwheel-consent`
 * ('yes' | 'no'), mirroring hanzi-burst's `hanzi-consent` flag.
 */

export const CONSENT_KEY = 'yearwheel-consent';
const BANNER_ID = 'consentBanner';

export type ConsentChoice = 'yes' | 'no';

export const getConsent = (): ConsentChoice | null => {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'yes' || v === 'no' ? v : null;
  } catch {
    return null;
  }
};

export const setConsent = (v: ConsentChoice): void => {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    // storage unavailable: the choice only lasts for this page view
  }
};

type GtagFn = (...args: unknown[]) => void;

const updateGoogleConsent = (granted: boolean): void => {
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
};

/** Show the consent banner if the visitor has not chosen yet. */
export const initConsentBanner = (doc: Document = document): void => {
  if (getConsent() !== null || doc.getElementById(BANNER_ID)) return;

  const banner = doc.createElement('div');
  banner.id = BANNER_ID;
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', 'Analytics consent');
  banner.style.cssText = [
    'position:fixed', 'left:12px', 'right:12px', 'bottom:12px', 'max-width:640px', 'margin:0 auto',
    'padding:12px 14px', 'display:flex', 'flex-wrap:wrap', 'align-items:center', 'gap:8px 10px',
    'background:#0f1420', 'color:#e5e9f0', 'border:1px solid rgba(255,255,255,.12)', 'border-radius:10px',
    'font-size:14px', 'box-shadow:0 4px 18px rgba(0,0,0,.35)', 'z-index:1000',
  ].join(';');

  const text = doc.createElement('span');
  text.textContent = 'YearWheel uses Google Analytics (cookies) to count visits. Allow?';
  text.style.flex = '1 1 240px';

  const makeButton = (label: string, primary: boolean): HTMLButtonElement => {
    const b = doc.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.className = primary ? 'btn primary text-sm' : 'btn text-sm';
    return b;
  };
  const yes = makeButton('Allow', true);
  yes.id = 'consentYes';
  const no = makeButton('Decline', false);
  no.id = 'consentNo';

  const more = doc.createElement('a');
  more.href = '/privacy.html#analytics';
  more.textContent = 'Details';
  more.style.color = '#60a5fa';

  const close = (choice: ConsentChoice): void => {
    setConsent(choice);
    updateGoogleConsent(choice === 'yes');
    banner.remove();
  };
  yes.addEventListener('click', () => close('yes'));
  no.addEventListener('click', () => close('no'));

  banner.append(text, yes, no, more);
  doc.body.appendChild(banner);
};
