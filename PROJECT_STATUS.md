# YearWheel - Current Project Status

**Last Updated:** November 12, 2025, 3:05 PM  
**Current Version:** 0.6.0  
**Status:** ✅ Production Ready

---

## 📊 Overview

YearWheel is a fully functional, production-ready interactive calendar visualization with dual deployment on Cloudflare Pages and GitHub Pages.

## 🌐 Live Deployments

### Production

**Primary (Cloudflare Pages):**
- **URL:** https://yearwheel.pages.dev/
- **Status:** ✅ Live
- **Platform:** Cloudflare Pages
- **Features:** Unlimited bandwidth, global CDN, automatic SSL
- **Deployment:** Automatic on push to `main` branch

**Legacy (GitHub Pages):**
- **URL:** https://komapc.github.io/year-shape/
- **Status:** ✅ Live (backup)
- **Platform:** GitHub Pages
- **Deployment:** Automatic via GitHub Actions on push to `main`

### Staging

**Cloudflare Pages:**
- **URL:** https://staging.yearwheel.pages.dev/
- **Status:** ✅ Live
- **Deployment:** Automatic on push to `staging` branch

### PR Previews

**Cloudflare Pages:**
- **URL Pattern:** `https://<branch-name>.yearwheel.pages.dev/`
- **Deployment:** Automatic for every PR
- **Retention:** Last 500 deployments

---

## 🔀 Branch Structure

### Active Branches

1. **`main`** (Production)
   - Current commit: `75dbc6b`
   - Version: 0.6.0
   - Protection: Required PR reviews, passing tests
   - Auto-deploys to both Cloudflare and GitHub Pages

2. **`staging`** (Testing)
   - Current commit: `b3bb296`
   - Ahead of main by: 1 commit
   - Protection: Required passing tests
   - Auto-deploys to Cloudflare staging

3. **Feature branches** (Development)
   - Created from `staging`
   - Auto-deploy to preview URLs on Cloudflare

### Deleted/Merged Branches

Recent feature branches merged and deleted:
- `fix/arrow-login-session-events` (merged)
- `docs/comprehensive-code-cleanup` (merged)
- `fix/ui-improvements-and-arrow` (merged)
- `fix/add-vitest-to-package-lock` (merged)

---

## 📋 Open Pull Requests

### PR #21 - Cleanup: Remove unused Vercel workflow
- **Base:** `main` ← `staging`
- **Status:** Open
- **Purpose:** Remove unused Vercel deployment workflow
- **Files:** Delete `.github/workflows/deploy-preview.yml`
- **Ready to merge:** Yes ✅

### PR #19 - Release: Cloudflare Pages Setup + UI Improvements
- **Status:** May be open or merged (check GitHub)
- **Purpose:** Major release with Cloudflare migration

### PR #17 - Fix: Arrow rotation and length
- **Status:** May be open or merged (check GitHub)
- **Purpose:** Final arrow corrections

---

## ✨ Current Features (v0.6.0)

### Core Functionality
- ✅ 52-week year visualization
- ✅ Shape morphing (circle ↔ square) via superellipse formula
- ✅ Seasonal organization (Winter, Spring, Summer, Autumn)
- ✅ Month labels with seasonal colors
- ✅ Current week arrow indicator (180px, points outward)
- ✅ Week detail modal (Soviet-style diary view)
- ✅ Click week to see daily events

### Google Calendar Integration
- ✅ OAuth 2.0 authentication
- ✅ Read-only calendar access
- ✅ Event fetching for entire year
- ✅ Session persistence (localStorage)
- ✅ Automatic session restoration on page load
- ✅ "Open in Google Calendar" links

### UI/UX
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark theme (default)
- ✅ Light theme toggle
- ✅ Settings panel with organized sections:
  - Shape (Corner radius, Direction, Shift seasons)
  - Calendar (Refresh events, Sign in)
  - Display & Language (Language selector)
  - Tooltips & Theme (Moon, Zodiac, Hebrew, Theme)
- ✅ Login status indicator in header
- ✅ "Sign in with Google" button in header (when not logged in)
- ✅ About panel (hidden by default)

### Tooltips (Hover on Week)
- ✅ Moon phase calculation and emoji
- ✅ Zodiac sign(s) for the week
- ✅ Hebrew month(s) for the week
- ✅ Week date range
- ✅ Event count
- ✅ Toggleable in settings

### Internationalization (i18n)
- ✅ 7 languages supported:
  - English (en) - Complete
  - Hebrew (he) - Complete, RTL support
  - Esperanto (eo) - Complete
  - Russian (ru) - Placeholder
  - Spanish (es) - Placeholder
  - French (fr) - Placeholder
  - German (de) - Placeholder
- ✅ Language selector in settings
- ✅ Persisted to localStorage

### Legal Pages
- ✅ Privacy Policy (`/privacy.html`)
- ✅ Terms of Service (`/terms.html`)
- ✅ User Agreement (`/agreement.html`)
- ✅ All linked from footer

### Visual Elements
- ✅ Custom SVG favicon (year wheel design)
- ✅ Seasonal color tints on weeks
- ✅ Vertical text for season labels
- ✅ Month labels (vertical/horizontal based on position)

---

## 🧪 Testing

### Unit Tests
- **Framework:** Vitest with JSDOM
- **Coverage:** 68 tests across 5 test files
- **Modules tested:**
  - `utils/math.ts` - Superellipse calculations
  - `utils/date.ts` - Week number, date formatting
  - `utils/astronomy.ts` - Moon phases, zodiac
  - `utils/hebrew.ts` - Hebrew calendar
  - `utils/settings.ts` - Settings persistence

### CI/CD Integration
- ✅ Tests run on every PR (GitHub Actions)
- ✅ Build must succeed before merge
- ✅ TypeScript compilation checked

### Manual Testing
- ✅ Tested on Cloudflare Pages preview URLs
- ✅ Tested on staging.yearwheel.pages.dev
- ✅ Tested locally (npm run dev)

---

## 🏗️ Infrastructure

### Deployment Platforms

**1. Cloudflare Pages (Primary)**
- Production: `main` branch → https://yearwheel.pages.dev/
- Staging: `staging` branch → https://staging.yearwheel.pages.dev/
- Previews: All PRs → `https://<branch>.yearwheel.pages.dev/`
- Build time: 2-3 minutes
- No workflow files needed (Git integration)

**2. GitHub Pages (Legacy Backup)**
- Production: `main` branch → https://komapc.github.io/year-shape/
- Workflow: `.github/workflows/deploy-github-pages.yml`
- Build time: 5-7 minutes
- Includes: privacy.html, terms.html, agreement.html

### Build Configuration

**Cloudflare Pages:**
- Root directory: `year-shape-calendar`
- Build command: `npm install && npm run build`
- Build output: `dist`
- Node version: 20.x
- Environment variables: Google API credentials (set for Production AND Preview)

**GitHub Pages:**
- Working directory: `./year-shape-calendar`
- Build command: `npm ci && npm run build`
- Output: `dist`
- Base URL: `/year-shape/`
- Environment variables: Injected via GitHub Secrets

### Environment Variables

**Required (set in both Cloudflare and GitHub):**
- `VITE_GOOGLE_CLIENT_ID` - OAuth 2.0 Client ID
- `VITE_GOOGLE_API_KEY` - Calendar API Key

**Build-specific:**
- `VITE_BASE_URL` - Set by platform (`/` for Cloudflare, `/year-shape/` for GitHub)
- `CF_PAGES` - Auto-set by Cloudflare (used in vite.config.ts)

---

## 🔧 Technology Stack

### Frontend
- **TypeScript** 5.3.3 - Type-safe development
- **Vite** 5.0.8 - Build tool and dev server
- **TailwindCSS** 3.4.0 - Utility-first CSS
- **date-fns** 3.0.0 - Date manipulation

### APIs
- **Google Calendar API** v3 - Event integration
- **Google Identity Services** - OAuth 2.0 authentication
- **gapi.client** - Google API client library

### Testing
- **Vitest** 4.0.8 - Unit test framework
- **@vitest/ui** 4.0.8 - Visual test UI
- **jsdom** 27.2.0 - DOM implementation for Node.js
- **@testing-library/dom** 10.4.1 - DOM testing utilities

### Development Tools
- **ESLint** 8.55.0 - Code linting
- **TypeScript ESLint** 6.13.0 - TS-specific linting
- **PostCSS** 8.4.32 - CSS processing
- **Autoprefixer** 10.4.16 - CSS vendor prefixes

---

## 📚 Documentation

### User Documentation
- `README.md` - Project overview, quick start
- `year-shape-calendar/README.md` - Detailed setup guide
- `QUICKSTART.md` - 60-second setup
- `TESTING.md` - Testing guide

### Developer Documentation
- `DOCUMENTATION.md` - Architecture and code documentation (364 lines)
- `DEPLOYMENT.md` - Deployment and staging workflow (415 lines)
- `CLOUDFLARE.md` - Cloudflare Pages setup (211 lines)
- `CLOUDFLARE_DEPLOY.md` - Redeployment guide (233 lines)
- `STAGING.md` - Staging environment options (160 lines)
- `PREVIEW_ENVIRONMENTS.md` - Preview strategies (236 lines)
- `CHANGELOG.md` - Version history (125 lines)
- `.github/CONTRIBUTING.md` - Contributing guidelines (200 lines)
- `.github/PR_TEMPLATE.md` - PR template
- `.github/VERSION_POLICY.md` - Versioning rules

**Total documentation:** ~2,100+ lines

---

## 🎯 Recent Accomplishments

### Last 24 Hours
1. ✅ Fixed arrow rotation (final formula: `90 - angle`)
2. ✅ Increased arrow length to 180px
3. ✅ Removed duplicate login button
4. ✅ Fixed session persistence
5. ✅ Consolidated all settings into organized panel
6. ✅ Added language selector (7 languages)
7. ✅ Added login status indicator
8. ✅ Migrated to Cloudflare Pages
9. ✅ Set up staging environment
10. ✅ Created comprehensive documentation
11. ✅ Added custom favicon
12. ✅ Created User Agreement page
13. ✅ Updated tagline: "Your year in a circle (or square)"
14. ✅ Added header sign-in button
15. ✅ Established PR-only workflow rule

---

## ⚙️ Configuration Files

### Build & Development
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build config (supports Cloudflare + GitHub Pages)
- `tailwind.config.js` - TailwindCSS configuration
- `postcss.config.js` - PostCSS configuration
- `vitest.config.ts` - Vitest test configuration
- `vitest.setup.ts` - Test environment setup

### CI/CD
- `.github/workflows/deploy-github-pages.yml` - GitHub Pages deployment
- `.github/workflows/deploy-staging.yml.disabled` - Reference only
- Cloudflare Pages - Configured in dashboard (no file needed)

### Documentation
- `.github/PR_TEMPLATE.md` - Pull request template
- `.github/VERSION_POLICY.md` - Semantic versioning rules
- `.github/CONTRIBUTING.md` - Contributing guidelines

---

## 🗂️ Project Structure

```
/
├── .github/
│   ├── workflows/
│   │   ├── deploy-github-pages.yml (active)
│   │   └── deploy-staging.yml.disabled (reference)
│   ├── CONTRIBUTING.md
│   ├── PR_TEMPLATE.md
│   └── VERSION_POLICY.md
│
├── year-shape-calendar/
│   ├── public/
│   │   ├── favicon.svg (new!)
│   │   ├── privacy.html
│   │   ├── terms.html
│   │   └── agreement.html (new!)
│   │
│   ├── src/
│   │   ├── calendar/
│   │   │   ├── CalendarApp.ts (main controller)
│   │   │   ├── CalendarRenderer.ts (rendering engine)
│   │   │   ├── WeekElement.ts (week component)
│   │   │   └── WeekModal.ts (weekly detail view)
│   │   │
│   │   ├── services/
│   │   │   └── googleCalendar.ts (Google API integration)
│   │   │
│   │   ├── utils/
│   │   │   ├── math.ts (superellipse calculations)
│   │   │   ├── date.ts (date utilities)
│   │   │   ├── astronomy.ts (moon phases, zodiac)
│   │   │   ├── hebrew.ts (Hebrew calendar)
│   │   │   ├── settings.ts (localStorage persistence)
│   │   │   ├── dom.ts (DOM utilities)
│   │   │   ├── constants.ts (configuration)
│   │   │   └── __tests__/ (68 unit tests)
│   │   │
│   │   ├── i18n/
│   │   │   ├── index.ts (translations)
│   │   │   └── README.md
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts (TypeScript interfaces)
│   │   │   └── google.d.ts (Google API types)
│   │   │
│   │   ├── index.html (main app)
│   │   ├── main.ts (entry point)
│   │   ├── style.css (global styles)
│   │   └── vite-env.d.ts (Vite types)
│   │
│   ├── DOCUMENTATION.md (architecture)
│   ├── CHANGELOG.md (version history)
│   ├── CLOUDFLARE.md (Cloudflare guide)
│   ├── CLOUDFLARE_DEPLOY.md (deployment guide)
│   ├── STAGING.md (staging options)
│   ├── PREVIEW_ENVIRONMENTS.md (preview strategies)
│   ├── README.md (project readme)
│   ├── QUICKSTART.md (quick setup)
│   ├── TESTING.md (test guide)
│   ├── package.json
│   ├── vite.config.ts
│   └── ... (config files)
│
├── DEPLOYMENT.md (deployment workflows)
└── README.md (projects portfolio)
```

---

## 🔄 Workflow

### Current Development Process

1. **Create feature branch from staging:**
   ```bash
   git checkout staging
   git pull
   git checkout -b feature/name
   ```

2. **Develop and test locally:**
   ```bash
   npm run dev
   npm run test:run
   ```

3. **Create PR to staging (NEVER direct push!):**
   ```bash
   git push -u origin feature/name
   gh pr create --base staging --title "Feature: Name"
   ```

4. **Cloudflare auto-deploys preview:**
   - URL: `https://feature-name.yearwheel.pages.dev/`
   - Test on preview before merging

5. **After merge to staging:**
   - Auto-deploys to: https://staging.yearwheel.pages.dev/

6. **Promote to production:**
   ```bash
   gh pr create --base main --title "Release: v0.X.X"
   ```

7. **After merge to main:**
   - Cloudflare: https://yearwheel.pages.dev/
   - GitHub Pages: https://komapc.github.io/year-shape/

---

## ⚡ Recent Changes (Last Session)

### Completed
1. ✅ Fixed arrow rotation formula (5 iterations!)
2. ✅ Increased arrow length to 180px
3. ✅ Consolidated all settings into organized panel
4. ✅ Added language selector (7 languages)
5. ✅ Added login status indicator
6. ✅ Fixed session persistence after refresh
7. ✅ Removed duplicate login button
8. ✅ Removed demo events
9. ✅ Migrated to Cloudflare Pages
10. ✅ Set up staging environment
11. ✅ Created 1400+ lines of documentation
12. ✅ Added custom favicon
13. ✅ Created User Agreement page
14. ✅ Updated tagline
15. ✅ Added header sign-in button when not logged in
16. ✅ Fixed privacy/terms links (relative paths)
17. ✅ Established PR-only workflow rule

### In Progress
- PR #21 (cleanup) - waiting for merge

---

## 🔐 Security & API Configuration

### Google Cloud Console

**OAuth 2.0 Client ID:**
- Client ID: `673675348097-pb541d3cvvho7jjuas8cssdtbg7v9rhd.apps.googleusercontent.com`
- Type: Web application
- Name: calendar-shape

**Authorized JavaScript origins:**
- ✅ `https://yearwheel.pages.dev`
- ✅ `https://staging.yearwheel.pages.dev`
- ✅ `https://komapc.github.io`
- ✅ `https://*.yearwheel.pages.dev` (for PR previews)

**Authorized redirect URIs:**
- ✅ `https://yearwheel.pages.dev`
- ✅ `https://staging.yearwheel.pages.dev`
- ✅ `https://komapc.github.io/year-shape/`
- ✅ `https://*.yearwheel.pages.dev`

**API Key:**
- Key: `AIzaSyCxSoTw_5OcZPZiLNHwIYdJjtR9qkDpAhk`
- Restrictions: Website restrictions enabled
- Allowed websites:
  - ✅ `https://komapc.github.io/*`
  - ✅ `https://yearwheel.pages.dev`
  - ✅ `https://*.yearwheel.pages.dev`

**OAuth Consent Screen:**
- App name: calendar-shape
- User support email: komapc@gmail.com
- Authorized domains: komapc.github.io, yearwheel.pages.dev
- Publishing status: Testing
- Test users: komapc@gmail.com

### GitHub Secrets

**Repository secrets set:**
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_API_KEY`

### Cloudflare Environment Variables

**Set for Production AND Preview:**
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_API_KEY`

---

## 📊 Statistics

### Codebase
- **Total files:** ~50
- **TypeScript files:** ~20
- **Test files:** 5 (68 tests)
- **Documentation files:** 12
- **Total lines of code:** ~3,500
- **Total documentation:** ~2,100 lines

### Dependencies
- **Production:** 1 (date-fns)
- **Development:** 13 packages
- **Total packages (with deps):** ~336

### Commits
- **Total on main:** 50+
- **Total on staging:** 52+
- **Recent (last 24h):** 20+

### Pull Requests
- **Merged:** 16+
- **Open:** 1-2
- **Closed:** 0

---

## ⚠️ Known Issues

### Minor
1. Hebrew calendar calculations use approximation (not fully accurate)
2. Some languages have placeholder translations (Russian, Spanish, French, German)
3. 2 moderate npm audit vulnerabilities (in dev dependencies)

### None Critical
- All core functionality working
- No blocking bugs

---

## 🎯 Next Steps / Roadmap

### Short Term (Next PR)
- [ ] Merge PR #21 (remove Vercel workflow)
- [ ] Complete translations for remaining languages
- [ ] Fix npm audit vulnerabilities

### Medium Term
- [ ] Add animation to shape morphing
- [ ] Add keyboard shortcuts
- [ ] Export calendar as image
- [ ] Add more astronomical data (equinoxes, solstices)
- [ ] Improve Hebrew calendar accuracy

### Long Term
- [ ] Mobile app (React Native?)
- [ ] Server-side OAuth (more secure)
- [ ] Multi-calendar support
- [ ] Calendar event creation
- [ ] Customizable color schemes

---

## 🏆 Project Health

**Overall Status:** ✅ Excellent

- **Stability:** 5/5 - Production-ready, no critical bugs
- **Documentation:** 5/5 - Comprehensive, well-organized
- **Testing:** 4/5 - Good unit test coverage, could add E2E tests
- **Infrastructure:** 5/5 - Dual deployment, staging, PR previews
- **Code Quality:** 5/5 - TypeScript, linted, documented
- **UX:** 5/5 - Polished, accessible, responsive
- **Performance:** 5/5 - Fast load times, optimized builds

---

## 👥 Team

- **Developer:** komapc (komapc@gmail.com)
- **Repository:** https://github.com/komapc/year-shape
- **License:** All Rights Reserved (consider adding open source license)

---

## 📞 Support

- **Issues:** https://github.com/komapc/year-shape/issues
- **Email:** komapc@gmail.com
- **Documentation:** See `year-shape-calendar/DOCUMENTATION.md`

---

**YearWheel is production-ready and actively maintained!** 🎉

