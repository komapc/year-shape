/**
 * Content-Security-Policy for the built pages, injected as a <meta> tag.
 *
 * Production is static GitHub Pages (no custom response headers), so the
 * policy has to live in the HTML. Consequences of the meta delivery:
 *   - `frame-ancestors`, `report-uri` and report-only mode are not available;
 *   - it only governs what follows it, so it is inserted right after <meta charset>;
 *   - the static pages in public/ (privacy, terms, guide) are not covered.
 *
 * Inline <script> blocks (the Consent Mode / gtag bootstrap) are allowed by
 * their SHA-256 hash, computed from the final HTML at build time so the hash
 * can never drift from the content. Build-only: the dev server (HMR injects
 * inline scripts) is unaffected.
 */
import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

const GOOGLE = {
  // Google tag / GA4, "Google Analytics without any Ads features" variant
  // (https://developers.google.com/tag-platform/security/guides/csp).
  // Ads storage is always denied in Consent Mode, so the Ads hosts are omitted.
  tagScripts: ['https://www.googletagmanager.com'],
  tagConnect: [
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://*.google.com',
  ],
  tagImg: ['https://*.google-analytics.com', 'https://www.googletagmanager.com'],
  // Google Identity Services (https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#content_security_policy)
  gsi: 'https://accounts.google.com',
  // gapi loader + Calendar API client; oauth2.googleapis.com is the token
  // revoke endpoint used on sign-out (google.accounts.oauth2.revoke).
  gapiScripts: ['https://apis.google.com'],
  apiConnect: [
    'https://www.googleapis.com',
    'https://content.googleapis.com',
    'https://oauth2.googleapis.com',
  ],
  apiFrames: ['https://content.googleapis.com'],
};

export const buildPolicy = (scriptHashes: string[]): string => {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      ...scriptHashes.map((h) => `'sha256-${h}'`),
      ...GOOGLE.tagScripts,
      GOOGLE.gsi,
      ...GOOGLE.gapiScripts,
    ],
    // Inline styles are used throughout (style attributes, injected <style>).
    'style-src': ["'self'", "'unsafe-inline'", GOOGLE.gsi],
    'img-src': ["'self'", 'data:', ...GOOGLE.tagImg],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", ...GOOGLE.tagConnect, GOOGLE.gsi, ...GOOGLE.apiConnect],
    'frame-src': [GOOGLE.gsi, ...GOOGLE.apiFrames],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ');
};

/** SHA-256 (base64) of every inline executable <script> in the document. */
export const inlineScriptHashes = (html: string): string[] => {
  const hashes: string[] = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    // JSON-LD and other data blocks are never executed, so CSP ignores them.
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase();
    if (type && type !== 'module' && type !== 'text/javascript' && type !== 'application/javascript') continue;
    hashes.push(createHash('sha256').update(m[2], 'utf8').digest('base64'));
  }
  return hashes;
};

export const injectCsp = (html: string): string => {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${buildPolicy(inlineScriptHashes(html))}" />`;
  const charset = /<meta\s+charset=[^>]*>/i.exec(html);
  if (!charset) throw new Error('CSP: <meta charset> not found; cannot place the policy first in <head>');
  const at = charset.index + charset[0].length;
  return `${html.slice(0, at)}\n    ${meta}${html.slice(at)}`;
};

export const cspPlugin = (): Plugin => ({
  name: 'yearwheel-csp',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: (html) => injectCsp(html),
  },
});
