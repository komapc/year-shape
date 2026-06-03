# TODO — Outstanding Code Review Items

Findings from project reviews. Resolved items have been removed; what remains
is the genuinely-open backlog.

## Resolved (2026-06-03 review)

- ✅ All 5 CI lint errors fixed; `npm run lint` passes (0 warnings).
- ✅ Rings mode is year-aware (no more hardcoded 2025; leap-year-correct months,
  computed Hebrew months and movable holidays).
- ✅ `any` warnings cleared (real types where possible; `no-explicit-any` off for
  test mocks only).
- ✅ Production bundles strip `console.log`/`info`/`debug` (warn/error kept).
- ✅ One-shot markdown artifacts deleted; README counts/shortcuts corrected.
- ✅ Project `.gitignore` added (was relying on a global ignore for `.env`).

## Open — documentation consolidation

Living docs were left untouched to avoid losing content during a merge. Worth a
deliberate consolidation pass:

- [ ] `ARCHITECTURE.md` ↔ `DOCUMENTATION.md` — overlap on architecture overview
- [ ] `CLOUDFLARE.md` ↔ `CLOUDFLARE_DEPLOY.md` — both cover Cloudflare deployment
- [ ] `STAGING.md` ↔ `PREVIEW_ENVIRONMENTS.md` — overlap on preview/staging workflow
- [ ] `QUICKSTART.md` ↔ "Quick Start" section in `README.md` — pick one canonical location

## Open — nits (low priority)

- [ ] **Stub locales** — `ru`, `es`, `fr`, `de` are declared in the `Locale` union
  but their dictionaries are `{ ...en }` (still English). Either translate or hide
  from the language picker until ready. (README now documents this.)
- [ ] **`ZoomMode.ts` size** — ~910 lines combining animation, rendering, state,
  hit testing, and gestures. Candidate for extraction next time it's touched.
- [ ] **`ZoomModeWheel.test.ts` flakiness** — timing-sensitive; can fail under load.
  Consider increasing timeouts or making the animation wait deterministic.
- [ ] **Rings year navigation** — data is now year-aware, but the rings page has no
  year picker (the "rotate year" button only rotates orientation). A follow-up could
  wire year navigation to re-render the rings.
- [ ] **No `CLAUDE.md`** at project root despite a `.claude/` directory.

## Out of scope (not reviewed)

- Security review (auth flow, OAuth scopes, CSP, XSS). Worth a separate pass.
- i18n string-by-string review (would need a native speaker per locale).
- Performance profiling of zoom-mode animations.
- Accessibility audit (ARIA, keyboard navigation beyond shortcuts already wired).
