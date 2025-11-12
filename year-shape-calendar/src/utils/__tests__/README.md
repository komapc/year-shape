# Unit Tests

This directory contains unit tests for the YearWheel utility functions.

## Test Framework

We use **Vitest** - a fast unit test framework for Vite projects.

## Running Tests

```bash
# Run tests in watch mode (during development)
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### 📐 Math Utilities (`math.test.ts`)
- `degreesToRadians` - Angle conversion
- `getRadialModulation` - Superellipse formula for shape morphing
- `calculatePositionOnPath` - Positioning weeks on circular/square path

### 📅 Date Utilities (`date.test.ts`)
- `getWeekNumber` - Calculate week index (0-52)
- `getWeekStartDate` - Get Sunday start date for a week
- `getWeekEndDate` - Get Saturday end date for a week
- `formatDate` - Format dates for display

### 🌙 Astronomy Utilities (`astronomy.test.ts`)
- `calculateMoonPhase` - Pure mathematical moon phase calculation
- `getMoonEmoji` - Moon phase emoji selector
- `getMoonPhaseName` - Moon phase name (New Moon, Full Moon, etc.)
- `getWeekZodiacSigns` - Zodiac signs for a given week

### ✡️ Hebrew Calendar Utilities (`hebrew.test.ts`)
- `getWeekHebrewMonths` - Hebrew months for a given week
- `getHebrewMonthEmoji` - Hebrew month emojis
- `getHebrewMonthName` - Hebrew month names (English/Hebrew)

### ⚙️ Settings Utilities (`settings.test.ts`)
- `loadSettings` - Load settings from localStorage
- `saveSettings` - Save settings to localStorage
- Settings persistence and defaults

## CI/CD Integration

Tests run automatically on every push to `main` via GitHub Actions.

The build will **fail** if any tests fail, ensuring code quality.

## Writing New Tests

When adding new utility functions:

1. Create test file in `__tests__` directory
2. Follow existing test patterns
3. Test happy paths and edge cases
4. Run `npm test` to verify
5. Check coverage with `npm run test:coverage`

## Test Philosophy

- ✅ Test **behavior**, not implementation
- ✅ Test **edge cases** and error handling
- ✅ Keep tests **simple** and **readable**
- ✅ Use **descriptive** test names
- ❌ Don't test external libraries
- ❌ Don't test UI components (use E2E for that)

