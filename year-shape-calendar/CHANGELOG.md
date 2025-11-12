# Changelog

All notable changes to YearWheel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2025-11-12

### Added
- 🎨 Custom favicon with year wheel design
- 📄 User Agreement page (public/agreement.html)
- 🌐 Cloudflare Pages deployment with PR previews
- 🏗️ Staging environment infrastructure
- 🌍 Language selector (7 languages: EN, HE, EO, RU, ES, FR, DE)
- 🟢 Login status indicator in header
- 📚 Comprehensive documentation (1400+ lines):
  - DEPLOYMENT.md - Complete deployment guide
  - CLOUDFLARE.md - Cloudflare Pages setup
  - CLOUDFLARE_DEPLOY.md - Redeployment instructions
  - STAGING.md - Staging environment options
  - PREVIEW_ENVIRONMENTS.md - Preview environment strategies
  - DOCUMENTATION.md - Architecture and code docs

### Changed
- ✨ New tagline: "Your year in a circle (or square)"
- ⚙️ Consolidated all settings into organized Settings panel with sections:
  - Shape (Corner Radius, Direction, Shift Seasons)
  - Calendar (Refresh Events, Sign in with Google)
  - Display & Language (Language selector)
  - Tooltips & Theme (Moon phase, Zodiac, Hebrew month, Light theme)
- 🎯 Fixed arrow rotation formula (finally correct after 5 iterations!)
- 📏 Increased arrow length to 180px (almost touches target week)
- 📝 Updated meta description and page title

### Fixed
- 🎯 Arrow now points OUTWARD correctly (rotation formula: angle + 90)
- 🔗 Privacy and Terms links use relative paths (work on both platforms)
- 🔐 Session persistence after page refresh
- 🔄 Removed duplicate "Sign in with Google" button
- 🎭 Removed demo events (only show real calendar data)

### Removed
- ❌ Events legend ("Has events / No events")
- ❌ "Settings are saved automatically" notice
- ❌ Scattered controls from header (now in Settings panel)

### Infrastructure
- Dual deployment: Cloudflare Pages (primary) + GitHub Pages (legacy)
- Staging branch with automatic deployments
- PR preview environments on Cloudflare
- GitHub Pages workflow updated with test step

## [0.5.0] - 2025-11-11

### Added
- 📚 Comprehensive code documentation with JSDoc headers
- 🧪 Unit tests (68 tests) with Vitest
- 🌐 Internationalization (i18n) infrastructure
- 🌙 Moon phase calculations and display
- ♈ Zodiac sign calculations and display
- ✡️ Hebrew calendar integration
- ⚙️ Settings persistence to localStorage
- 🎨 Light theme support

### Changed
- Project name: "Year Shape Calendar" → "YearWheel"
- Improved superellipse formula for smoother morphing
- Enhanced tooltip system with astronomical data

### Fixed
- Google Calendar URL format
- TypeScript compilation errors
- Arrow indicator positioning

## [0.4.0] - 2025-11-10

### Added
- 🌍 Esperanto language support
- 🧪 Initial unit test suite
- CI/CD integration for tests

## [0.3.0] - 2025-11-09

### Added
- Settings panel with display options
- Session persistence for Google Calendar login
- Current week arrow indicator

### Changed
- Renamed from "Year Shape Calendar" to "YearWheel"

## [0.2.0] - 2025-11-08

### Added
- Google Calendar API integration
- OAuth 2.0 authentication
- Week modal (Soviet-style diary view)
- Month and season labels
- Seasonal color tints

### Changed
- Improved shape morphing algorithm

## [0.1.0] - 2025-11-07

### Added
- Initial release
- Basic year wheel visualization
- Shape morphing (circle ↔ square)
- 52 weeks layout
- Seasonal organization
- Direction control (CW/CCW)
- Corner radius slider

---

## Version Policy

- **MAJOR (x.0.0):** Breaking changes, major redesigns
- **MINOR (0.x.0):** New features, significant improvements
- **PATCH (0.0.x):** Bug fixes, minor tweaks

Current version: **0.6.0**

