# TODO — Outstanding Code Review Items

Findings from project review on 2026-05-03. Items below are everything that was *not* in the should-fix batch already applied (mode-change dead code, `||`→`??`, i18n reset confirmation, removed `as any` from settings updates, demo-event date computation).

## Must-fix (CI lint errors)

`npm run lint` currently fails with 5 errors. Four are auto-fixable by `eslint --fix`:

- [ ] `src/calendar/ZoomMode.ts:389` — `prefer-const` for `newCenterTarget` (never reassigned)
- [ ] `src/calendar/rings/ringImplementations.ts:98-99` — `prefer-const` for `startDay`, `endDay`
- [ ] `src/calendar/rings/RingSystem.ts:61` — Remove unused `eslint-disable` directive (no problems reported from `@typescript-eslint/no-unused-vars`)
- [ ] `src/utils/modeNavigation.ts:51` — `no-case-declarations`: wrap the `case 'zoom':` body in `{ ... }` so the `const currentYear = ...` is scoped to the case block

After these are fixed, `npm run lint -- --fix` should clear them. Verify with `npm run lint` (must report 0 errors; `--max-warnings 0` is already enforced).

## Should-fix — `any` warnings (22 remaining)

These are warnings today, but `--max-warnings 0` will fail CI if and when the lint script is wired into the build/CI. Worth tightening:

- [ ] `src/calendar/CircleRenderer.ts` — 4 `any`s at L31, L41, L285, L287
- [ ] `src/calendar/ZoomMode.ts:911` — 1 `any`
- [ ] `src/calendar/rings/Ring.ts` — 3 `any`s at L110, L112, L235
- [ ] `src/utils/svg.ts:118` — 1 `any`
- [ ] `src/calendar/__tests__/RingsModeSession.test.ts` — 2 `any`s at L23, L29
- [ ] `src/utils/__tests__/swipeNavigation.test.ts` — 11 `any`s (test mocks; consider a typed `MockApp` helper)

## Documentation rot — top-level `.md` cleanup

17 markdown files at the project root, many one-shot artifacts that should have been deleted post-merge.

### Delete (one-shot/historical artifacts)

- [ ] `REFACTOR_SUMMARY.md` — past refactor write-up
- [ ] `RINGS_REFACTORING_STATE.md` — dated 2025-11-14, "Ready for PR to staging"
- [ ] `RINGS_REVIEW_SUMMARY.md` — dated November 14, 2025
- [ ] `PR_DESCRIPTION.md` — body text for a single past PR
- [ ] `MIGRATION_GUIDE.md` — "Old → New" file mapping; useful only during migration
- [ ] `DEPLOYMENT_CHECKLIST.md` — checklist mostly checked off

### Consolidate duplicates

- [ ] `ARCHITECTURE.md` ↔ `DOCUMENTATION.md` — overlap on architecture overview
- [ ] `CLOUDFLARE.md` ↔ `CLOUDFLARE_DEPLOY.md` — both cover Cloudflare deployment
- [ ] `DEPLOYMENT.md` ↔ `DEPLOYMENT_CHECKLIST.md` (after deleting the checklist, fold remaining content into `DEPLOYMENT.md`)
- [ ] `STAGING.md` ↔ `PREVIEW_ENVIRONMENTS.md` — overlap on preview/staging workflow
- [ ] `QUICKSTART.md` ↔ "Quick Start" section in `README.md` — pick one canonical location

### Fix README inaccuracy

- [ ] `README.md` — "Vitest - Unit testing (68 tests)" is stale; actual count is 235

## Nits (low priority)

- [ ] **Console residue** — 52 `console.log/warn/error` calls in non-test source. Some are intentional (error logging in `main.ts`, settings load/save warnings). Audit and either gate behind `import.meta.env.DEV` or remove.
- [ ] **`ZoomMode.ts` size** — 912 lines combining animation, rendering, state, hit testing, and gestures. Candidate for extraction next time the file is touched (e.g., extract animation orchestration into `ZoomAnimator`, hit testing into a helper).
- [ ] **No `CLAUDE.md`** at project root despite a `.claude/` directory. If you want repo-specific Claude rules, create one (e.g., commands like `npm run lint`, project conventions).
- [ ] **Version vs CHANGELOG** — `package.json` is `0.13.0`; verify `CHANGELOG.md` has an entry for the latest version, otherwise back-fill.
- [ ] **Stub locales** — `ru`, `es`, `fr`, `de` are declared in the `Locale` union but their dictionaries are `{ ...en }` (i.e., still English). Either translate properly or remove from the language picker until ready.

## Out of scope (not reviewed)

- Security review (auth flow, OAuth scopes, CSP, XSS). Worth a separate pass.
- i18n string-by-string review (1035-line table; correctness check would need a native speaker per locale).
- Performance profiling of zoom-mode animations.
- Accessibility audit (ARIA, keyboard navigation beyond shortcuts already wired).
