/* Clickjacking defence for the static pages (GitHub Pages cannot send
   frame-ancestors / X-Frame-Options). When framed: hide, then try to break
   out. Same logic as src/utils/frameBuster.ts; keep them in sync. */
(function () {
  if (window.top === window.self) return;
  document.documentElement.style.display = 'none';
  try { window.top.location.href = window.location.href; } catch (e) { /* stay hidden */ }
})();
