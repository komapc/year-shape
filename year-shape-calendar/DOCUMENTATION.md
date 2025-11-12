# YearWheel - Code Documentation

## Architecture Overview

YearWheel is built with a modular architecture following these principles:
- **Separation of Concerns**: Each component has a single, well-defined responsibility
- **Type Safety**: Full TypeScript coverage with explicit interfaces
- **No Dependencies**: Pure vanilla TypeScript/JavaScript (except for Google APIs)
- **Settings Persistence**: localStorage for user preferences
- **Responsive Design**: Adapts to all screen sizes

## Core Components

### 1. **CalendarApp** (`src/calendar/CalendarApp.ts`)
**Main application controller** - orchestrates all components and handles user interactions.

**Responsibilities:**
- Initialize all UI components
- Manage application state
- Handle DOM events (clicks, slider changes, resizes)
- Coordinate Google Calendar integration
- Persist user settings

**Key Methods:**
- `constructor()` - Initialize app, load settings, setup event listeners
- `initializeGoogleCalendar()` - Async Google API initialization
- `handleRadiusChange()` - Update shape morphing (square ↔ circle)
- `handleRefreshEvents()` - Fetch calendar events from Google
- `handleSignIn()` - OAuth 2.0 authentication flow

---

### 2. **CalendarRenderer** (`src/calendar/CalendarRenderer.ts`)
**Rendering engine** - handles all visual layout and positioning logic.

**Responsibilities:**
- Create and position 52 WeekElement instances
- Calculate positions using superellipse formula (square ↔ circle morphing)
- Layout month labels and season indicators
- Position current week arrow indicator
- Apply seasonal color tints

**Key Methods:**
- `layoutWeeks()` - Position all 52 weeks around the shape
- `setCornerRadius(r)` - Update shape morphing parameter (0-100)
- `toggleDirection()` - Switch between CW/CCW rotation
- `calculatePositionOnPath()` - Superellipse position calculation

**Algorithm:**
Uses **superellipse** formula for smooth shape transitions:
```
r(θ) = 1 / (|cos(θ)|^n + |sin(θ)|^n)^(1/n)
```
where `n` varies from 2 (circle) to higher values (square).

---

### 3. **WeekElement** (`src/calendar/WeekElement.ts`)
**Individual week representation** - encapsulates week data and behavior.

**Responsibilities:**
- Render a single week as a clickable DOM element
- Display event count and seasonal colors
- Show tooltip on hover (with moon phase, zodiac, Hebrew month)
- Handle click events to open weekly detail modal

**Data:**
- Week number (1-52)
- Start/end dates
- Associated calendar events
- Seasonal information

---

### 4. **WeekModal** (`src/calendar/WeekModal.ts`)
**Weekly detail view** - displays Soviet-style diary layout for a week.

**Responsibilities:**
- Show all 7 days with date headers
- Display events for each day
- Provide "Open in Google Calendar" link
- Support keyboard navigation (ESC to close)

---

### 5. **GoogleCalendarService** (`src/services/googleCalendar.ts`)
**Google Calendar API integration** - handles authentication and data fetching.

**Responsibilities:**
- Initialize GAPI (Google API Client)
- Initialize GIS (Google Identity Services for OAuth 2.0)
- Manage access tokens and session persistence
- Fetch events from user's primary calendar
- Map Google Calendar events to internal format

**Key Methods:**
- `initializeGapi()` - Init API client with API key
- `initializeGis()` - Init OAuth 2.0 token client
- `signIn()` - Trigger OAuth consent flow
- `fetchEvents()` - Retrieve events for current year
- `restoreSession()` - Load saved access token from localStorage
- `storeSession()` - Persist access token and expiry time

**Session Management:**
- Tokens stored in `localStorage`
- Auto-restore on page load
- 5-minute expiry buffer for safety
- Typical token lifetime: 1 hour

---

## Utility Modules

### **math.ts** - Mathematical calculations
- `degreesToRadians()` - Angle conversion
- `getRadialModulation()` - Superellipse formula implementation
- `calculatePositionOnPath()` - 2D position from angle and radius

### **date.ts** - Date manipulation
- `getWeekNumber()` - ISO week number (1-52)
- `getWeekStartDate()` - Get Sunday of a given week
- `formatDateRange()` - Human-readable date ranges
- `isCurrentWeek()` - Check if week is current
- `openGoogleCalendarForWeek()` - Generate Google Calendar URL

### **astronomy.ts** - Astronomical calculations
- `calculateMoonPhase()` - Pure math moon phase (0-1 scale)
- `getMoonEmoji()` - Moon phase emoji representation
- `getWeekZodiacSigns()` - Zodiac signs for a week

### **hebrew.ts** - Hebrew calendar calculations
- `gregorianToHebrew()` - Date conversion (approximation)
- `getWeekHebrewMonths()` - Hebrew months for a week
- `getHebrewMonthName()` - Month name and emoji

### **settings.ts** - Settings persistence
- `loadSettings()` - Retrieve from localStorage with defaults
- `saveSettings()` - Persist to localStorage
- `DEFAULT_SETTINGS` - Default configuration

### **dom.ts** - DOM utilities
- `getElement()` - Type-safe element querying
- `createElement()` - Create elements with attributes
- `makeAccessible()` - Add ARIA attributes

---

## Data Flow

```
User Interaction
     ↓
CalendarApp (event handler)
     ↓
CalendarRenderer (update layout)
     ↓
WeekElement[] (re-render)
     ↓
DOM Update
```

```
Google Sign In
     ↓
GoogleCalendarService.signIn()
     ↓
OAuth 2.0 Consent Screen
     ↓
Access Token Received
     ↓
Store in localStorage
     ↓
Fetch Events
     ↓
CalendarRenderer.setEvents()
     ↓
WeekElement.setEvents()
     ↓
Visual Update (color + count)
```

---

## Settings Schema

All settings persisted to `localStorage` under key `yearwheel_settings`:

```typescript
{
  cornerRadius: number;        // 0-100 (square to circle)
  direction: 1 | -1;           // CW / CCW
  seasons: 'top-winter' | ...;  // Seasonal alignment
  rotationOffset: number;       // Degrees
  showMoonPhase: boolean;       // Show in tooltips
  showZodiac: boolean;          // Show in tooltips
  showHebrewMonth: boolean;     // Show in tooltips
  theme: 'light' | 'dark';      // Color scheme
  locale: Locale;               // Language (en, he, eo, etc.)
}
```

---

## Testing

- **Unit Tests**: `src/utils/__tests__/` - 68 tests for core logic
- **Framework**: Vitest with JSDOM
- **Coverage**: Math, date, astronomy, Hebrew, settings utilities
- **CI/CD**: Tests run on every PR via GitHub Actions

Run tests:
```bash
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:ui     # Visual UI
```

---

## Build & Deploy

- **Build Tool**: Vite
- **Output**: Static HTML/CSS/JS → `dist/`
- **Deployment**: GitHub Pages (automatic on merge to `main`)
- **Base URL**: `/year-shape/` (configured in `vite.config.ts`)

Build process:
1. TypeScript compilation (`tsc`)
2. Vite bundling (`vite build`)
3. PostCSS/TailwindCSS processing
4. Asset optimization (minification, tree-shaking)

---

## Environment Variables

Required for Google Calendar integration:

- `VITE_GOOGLE_CLIENT_ID` - OAuth 2.0 Client ID
- `VITE_GOOGLE_API_KEY` - API Key for Calendar API

**Security:**
- Never commit `.env` file
- Set as GitHub Secrets for CI/CD
- Restrict API key to referrer URLs
- Set OAuth consent screen test users

---

## Performance Considerations

1. **DOM Efficiency**
   - Batch DOM updates in `requestAnimationFrame`
   - Reuse WeekElement instances (no recreation)
   - CSS transforms for positioning (GPU accelerated)

2. **Event Handling**
   - Debounced resize handler (100ms)
   - Event delegation for week clicks
   - Passive event listeners where possible

3. **Data Fetching**
   - Single API call for entire year
   - Events cached in memory
   - Session tokens cached in localStorage

4. **Rendering**
   - Only re-layout on shape changes
   - CSS transitions for smooth morphing
   - Tooltip created on-demand

---

## Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Required APIs**: localStorage, CSS Grid, CSS transforms, fetch
- **Google APIs**: gapi.client, google.accounts.oauth2
- **No polyfills** (assumes ES2020+ support)

---

## Accessibility

- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Escape)
- **ARIA Labels**: All interactive elements labeled
- **Color Contrast**: WCAG AA compliant (dark theme)
- **Screen Readers**: Semantic HTML + ARIA attributes
- **Focus Management**: Visible focus indicators

---

## Internationalization (i18n)

**Supported Languages:**
- English (en) - Default
- Hebrew (he) - RTL support
- Esperanto (eo)
- Russian (ru) - Placeholder
- Spanish (es) - Placeholder
- French (fr) - Placeholder
- German (de) - Placeholder

**System:**
- Translations in `src/i18n/index.ts`
- `t(key)` function for lookups
- `setLocale()` to switch languages
- Persisted in settings

---

## Troubleshooting

### Events not loading
- Check browser console for errors
- Verify Google API credentials in `.env`
- Ensure OAuth consent screen has test users
- Check API key restrictions (referrer URLs)

### Session not persisting
- Check localStorage is enabled
- Token expires after ~1 hour (expected)
- Clear localStorage and re-login

### Arrow pointing wrong direction
- Verify `rotationAngle = (angle * 180 / Math.PI) + 90`
- No additional offsets needed

### Shape not morphing smoothly
- Adjust `getRadialModulation()` exponent in `math.ts`
- Currently: `n = 2 + (cornerRadius / 100) * 8`

---

## Contributing

1. **Create feature branch**: `git checkout -b feature/name`
2. **Follow style guide**: TypeScript, JSDoc comments, TailwindCSS
3. **Add tests**: For any utility functions
4. **Update docs**: Modify this file if architecture changes
5. **Version bump**: Increment in `package.json` + `index.html`
6. **Create PR**: Use `.github/PR_TEMPLATE.md`

**Versioning:** Semantic (MAJOR.MINOR.PATCH)
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

Current: **v0.5.0**

---

## License

YearWheel © 2025 - All Rights Reserved

---

**Questions?** Check:
- `README.md` - Quick start guide
- `QUICKSTART.md` - 60-second setup
- `TESTING.md` - Test suite documentation
- `src/utils/__tests__/README.md` - Test examples

