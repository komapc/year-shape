/**
 * Clickjacking defence for production on GitHub Pages, which cannot send
 * `X-Frame-Options` / `frame-ancestors` headers (and a <meta> CSP cannot carry
 * `frame-ancestors`). When framed, hide the page, then try to break out.
 *
 * Hiding is the real protection: browsers block a cross-origin frame from
 * navigating the top window without a user gesture, and a sandboxed frame
 * without `allow-top-navigation` cannot do it at all. Best effort: a frame
 * sandboxed without `allow-scripts` never runs this (but then the app does
 * not run either).
 *
 * public/framebust.js is the same logic for the static pages; keep them in sync.
 */
export const bustFrames = (win: Window = window): boolean => {
  if (win.top === win.self) return false;
  win.document.documentElement.style.display = 'none';
  try {
    if (win.top) win.top.location.href = win.location.href;
  } catch {
    // Cross-origin / sandboxed: stay hidden.
  }
  return true;
};

bustFrames();
