# Changelog

All notable changes to YearWheel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Pending
- Google OAuth production publishing
- Server-side settings sync
- Complete Russian, Spanish, French, German translations

## [0.9.0] - 2025-11-13

### Added
- **Theme Auto-Detection**: Follows system preference (prefers-color-scheme)
  - 3-way selector: Auto / Light / Dark
  - Live system theme tracking
  - Default: 'auto' mode for native feel
- **PWA Install Prompt**: Smart install button in header
  - Auto-detection of installability
  - Auto-hide after installation
  - Standalone mode detection
- **Internationalization Expansion**:
  - Ukrainian (uk) - Complete professional translation
  - Toki Pona (tok) - Minimalist constructed language
  - Total: 5 complete languages (en, he, eo, uk, tok)

### Changed
- Theme selector changed from toggle to radio buttons
- Default theme is now 'auto' (was 'dark')
- Improved settings panel layout

### Technical
- New `src/utils/theme.ts` module
- New `PWAInstallManager` class
- Expanded locale type definitions
- Memory leak prevention in theme watcher
- 85 tests (up from 68)

## [0.8.1] - 2025-11-13

### Fixed
- Year selector positioning (moved to top of circle, avoids clock overlap)
- Settings persistence bug (corner radius, direction, rotation now save correctly)

### Changed
- Year navigation repositioned inside circle for cleaner UI
- Smaller, more elegant year selector buttons

## [0.8.0] - 2025-11-13

### Added
- **Year Navigation**: Navigate between years with prev/next buttons
  - Keyboard shortcuts: ← (previous), → (next)
  - Hash routing: `#year/YYYY`
  - Dynamic calendar re-rendering
  - Year-specific Google Calendar event fetching
- **Personalized Auth UX**:
  - "Hello, [User Name]" greeting when logged in
  - Logout button in settings panel
  - "Sign in with Google" clarified text
  - User info fetched from Google OAuth
- **Week URL Sharing**: Click week → `#week/N` shareable URL
- **Hash-Based Routing**: SPA navigation with browser history
  - Routes: `#settings`, `#about`, `#week/N`, `#year/YYYY`
  - Browser back/forward support
- **Toast Notifications**: Modern, non-blocking user feedback
  - Types: success, error, warning, info
  - Auto-dismiss with manual close option
  - Replaces all `alert()` calls
- **Keyboard Shortcuts**:
  - `S` - Open settings
  - `?` - Open about
  - `Esc` - Close panels/modals
  - `← →` - Navigate years
- **Error Boundary**: Graceful error handling with retry button
- **Memory Leak Fixes**: Cleanup/destroy patterns for event listeners

### Changed
- Settings now persist correctly to localStorage
- Current week has pulsing glow effect
- Close button visible on all screen sizes (not just mobile)

### Technical
- New utilities: `toast.ts`, `keyboard.ts`, `router.ts`
- Cleanup methods prevent memory leaks
- Better event listener management

## [0.7.0] - 2025-11-12

### Added
- **PWA Support**: Full Progressive Web App implementation
  - Offline caching with service worker
  - App installation support
  - `manifest.json` with app metadata
  - Runtime caching for Google APIs
- **Light Theme Improvements**:
  - Enhanced background gradient
  - Better button styles and hover states
  - Improved contrast and readability
  - Polished modal and week elements

### Changed
- Button colors now solid (was semi-transparent)
- Improved mobile UI with close button for settings

### Fixed
- Inconsistent button colors across app
- PWA caching issues in development

### Technical
- Added `vite-plugin-pwa`
- Workbox configuration for caching strategies
- Disabled PWA in dev mode

## [0.6.0] - 2025-11-11

### Added
- **Google Calendar Integration**: OAuth 2.0 with event fetching
- **Settings Panel**: Comprehensive configuration UI
  - Display options (moon phase, zodiac, Hebrew month)
  - Theme toggle (light/dark)
  - Language selector (7 languages)
  - Shape controls (corner radius, direction, rotation)
- **Internationalization Infrastructure**:
  - English (en) ✅
  - Hebrew (he) with RTL support ✅
  - Esperanto (eo) ✅
  - Russian, Spanish, French, German (placeholders)
- **Week Detail Modal**: Soviet-style diary view
  - Date and week number
  - Event list
  - Open in Google Calendar link

### Changed
- Migrated to Cloudflare Pages (primary hosting)
- GitHub Pages now legacy/backup

### Technical
- TypeScript strict mode
- Vitest for testing (68 tests)
- TailwindCSS for styling
- date-fns for date handling

## [0.5.0] - 2025-11-10

### Added
- **Calendar Renderer**: Sophisticated layout engine
  - Morphing shape (circle ↔ square)
  - 52-week visualization
  - Seasonal organization
  - Month labels
- **Astronomical Features**:
  - Moon phase calculations
  - Zodiac sign mapping
  - Hebrew calendar integration
- **Tooltips**: Rich hover information
  - Week number and date range
  - Moon phase with emoji
  - Zodiac sign
  - Hebrew month (optional)

### Technical
- Modular architecture
- Comprehensive mathematical utilities
- Astronomy calculations (Meeus algorithms)
- Hebrew calendar conversions

## [0.4.0] - 2025-11-09

### Added
- **Project Structure**: Organized codebase
  - `src/calendar/` - Calendar components
  - `src/utils/` - Utility functions
  - `src/types/` - TypeScript types
  - `src/i18n/` - Internationalization
- **Build System**: Vite configuration
- **Testing**: Vitest setup with initial tests

## [0.3.0] - 2025-11-08

### Added
- **Shape Morphing**: Dynamic corner radius adjustment
- **Direction Toggle**: Clockwise/Counter-clockwise time flow
- **Season Rotation**: 90-degree increments

## [0.2.0] - 2025-11-07

### Added
- **Week Elements**: Interactive week visualization
- **Event Indicators**: Visual representation of calendar events
- **Seasonal Colors**: Dynamic theming per season

## [0.1.0] - 2025-11-06

### Added
- **Initial Release**: Basic circular calendar
- **52-Week Layout**: Basic positioning
- **Development Environment**: TypeScript + Vite

---

## Version Numbering

- **Major (X.0.0)**: Breaking changes, major rewrites
- **Minor (0.X.0)**: New features, non-breaking changes
- **Patch (0.0.X)**: Bug fixes, minor improvements

---

**Live:** https://yearwheel.pages.dev/  
**Staging:** https://staging.yearwheel.pages.dev/
