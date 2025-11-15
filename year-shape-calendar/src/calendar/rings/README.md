# Rings Mode - Architecture Documentation

## Overview

The Rings Mode is a multi-ring calendar visualization that displays temporal data (seasons, months, weeks, holidays) as concentric rings around a central year indicator. The visualization supports morphing between circular and square shapes, clockwise/counter-clockwise rotation, and customizable ring ordering.

## Architecture

### Core Components

```
RingsMode (Facade)
    ↓
RingSystem (Manager)
    ↓
Ring[] (Abstract Base)
    ├── SeasonsRing
    ├── MonthsRing
    ├── HebrewMonthsRing
    ├── WeeksRing
    └── HolidaysRing
```

### File Structure

```
calendar/rings/
├── constants.ts          # Shared constants and configuration
├── Ring.ts              # Abstract base class for all rings
├── DayBasedRing.ts      # Base class for day-based rings (months, holidays)
├── ringImplementations.ts # Concrete ring implementations
├── RingSystem.ts        # Manages multiple rings and layout
├── README.md            # This documentation
└── __tests__/          # Unit tests
```

## Component Details

### 1. Constants (`constants.ts`)

**Purpose:** Centralized configuration and constants

**Key Constants:**
- `CALENDAR_CONSTANTS`: Year length, angles, perimeter calculations
- `SEASON_DATES`: Meteorological season boundaries
- `SVG_CONFIG`: SVG rendering parameters

**Usage:**
```typescript
import { CALENDAR_CONSTANTS, SEASON_DATES } from './constants';
```

---

### 2. Ring Base Class (`Ring.ts`)

**Purpose:** Abstract base class providing common ring functionality

**Key Responsibilities:**
- SVG rendering and DOM manipulation
- Sector path generation (circle/square interpolation)
- Label positioning and rotation
- CCW/CW direction handling with angle mirroring
- Perimeter calculation for shape morphing
- Precision management for SVG paths

**Abstract Methods (must implement):**
- `get sectorCount(): number` - Number of sectors in ring
- `getSectorLabel(index: number): string` - Label for sector

**Key Methods:**
- `render(container)` - Creates SVG group
- `layout(...)` - Positions sectors based on geometry
- `drawSector(index, startAngle, endAngle)` - Draws individual sector
- `getPointOnShape(angle, radius)` - Interpolates between circle/square
- `createLabelElement(index, angle)` - Creates text label with rotation
- `getPrecision()` - Returns precision based on sector count

**Design Patterns:**
- Template Method: Base class defines structure, subclasses fill details
- Strategy: Different rings use different layout strategies

---

### 2a. Day-Based Ring Base Class (`DayBasedRing.ts`)

**Purpose:** Abstract base class for rings that position sectors based on day-of-year calculations

**Key Responsibilities:**
- Common day-based positioning logic
- Angle calculation from day numbers
- CCW direction mirroring
- Sector angle computation

**Abstract Methods:**
- `getSectors(): DayBasedSector[]` - Returns sectors with day ranges

**Key Methods:**
- `calculateSectorAngles(sector, rotationOffset)` - Converts day ranges to angles
- `applyDirectionMirroring(startAngle, endAngle)` - Applies CCW mirroring
- `layout(...)` - Default layout implementation for day-based rings

**Usage:**
- Extend this class for rings that use day-based positioning (months, holidays)
- Override `getSectors()` to provide sector data
- Optionally override `layout()` for special cases (e.g., seasons with wrap-around)

---

### 3. Ring Implementations (`ringImplementations.ts`)

**Purpose:** Concrete ring types with specific data and behavior

#### SeasonsRing
- **Sectors:** 4 (Winter, Spring, Summer, Autumn)
- **Special:** Handles year wrap-around for Winter (Dec 1 → Mar 1)
- **Layout:** Custom day-based positioning with split segments

#### MonthsRing
- **Sectors:** 12 (Jan-Dec)
- **Special:** Uses white fill (no gradient) to match year/week style
- **Layout:** Day-based positioning using actual month lengths

#### HebrewMonthsRing
- **Sectors:** 13 (Hebrew months in Gregorian year 2025)
- **Layout:** Day-based positioning aligned to Hebrew calendar

#### WeeksRing
- **Sectors:** 52 (one per week)
- **Special:** Only labels every 4th week to reduce clutter
- **Layout:** Uses base class default (equal sectors)

#### HolidaysRing
- **Sectors:** 20 (major holidays for 2025)
- **Special:** Small sectors (±1.5 days) for point markers
- **Layout:** Day-based positioning with narrow sectors

---

### 4. RingSystem (`RingSystem.ts`)

**Purpose:** Manages multiple rings, layout calculations, and state

**Key Responsibilities:**
- Ring lifecycle (add, remove, reorder)
- Visibility management
- Layout calculation with perimeter preservation
- Settings persistence (localStorage)
- Today indicator positioning

**Key Methods:**
- `addRing(ring, visible)` - Register a ring
- `layout()` - Calculate and apply layout to all rings
- `setRingWidth(width)` - Adjust ring thickness
- `setCornerRadius(radius)` - Morph shape (0=square, 1=circle)
- `toggleDirection()` - Switch CW/CCW
- `rotateYear()` - Rotate by 90° increments

**Layout Algorithm:**
1. Calculate target perimeter (from base circle)
2. Adjust radius for current corner radius (maintain perimeter)
3. Calculate effective ring width (respect min inner radius)
4. Layout rings from outermost to innermost
5. Update today indicator

**Settings Persistence:**
- Stored in `localStorage` as `multiRingCalendarSettings`
- Includes: corner radius, ring width, direction, rotation, order, visibility

---

### 5. RingsMode (`RingsMode.ts`)

**Purpose:** High-level facade for rings mode functionality

**Key Responsibilities:**
- Initialize rings from saved settings
- UI control integration
- Layer controls (drag & drop, visibility toggles)
- Metadata management for UI

**Key Methods:**
- `initializeFromSettings()` - Restore from localStorage
- `setCornerRadius(radius)` - Proxy to RingSystem
- `setRingWidth(width)` - Proxy to RingSystem
- `initializeLayerControls()` - Setup drag & drop UI

---

### 6. Entry Point (`rings.ts`)

**Purpose:** Initialize rings mode and wire up UI controls

**Key Responsibilities:**
- DOM element selection
- Event handler setup
- Login status management
- Theme initialization
- Mode navigation

**UI Controls:**
- Corner radius slider (0-100%)
- Ring width slider (with dynamic max)
- Direction toggle (CW/CCW)
- Rotate year button (90° increments)
- Layer controls (drag & drop, checkboxes)

---

## Data Flow

### Initialization Flow

```
1. rings.ts: initRingsMode()
   ↓
2. RingsMode.initializeFromSettings()
   ↓
3. Create ring instances (SeasonsRing, MonthsRing, etc.)
   ↓
4. RingSystem.addRing() for each ring
   ↓
5. RingSystem.layout()
   ↓
6. For each ring: Ring.layout() → Ring.drawSector() → SVG rendering
```

### User Interaction Flow

```
User adjusts slider
   ↓
Event handler in rings.ts
   ↓
RingsMode.setCornerRadius() / setRingWidth()
   ↓
RingSystem.setCornerRadius() / setRingWidth()
   ↓
RingSystem.layout()
   ↓
All rings re-render with new geometry
```

---

## Key Algorithms

### 1. Shape Morphing (Circle ↔ Square)

**Location:** `Ring.getPointOnShape()`

**Algorithm:**
1. Calculate pure circle coordinates: `(x, y) = center + radius * (cos θ, sin θ)`
2. Calculate pure square coordinates (inscribed in circle)
3. Linear interpolation: `point = t * circle + (1-t) * square`
   - `t = 0`: Pure square
   - `t = 1`: Pure circle
   - `t = 0.5`: Rounded square

**Square Calculation:**
- Determine which side (top/bottom/left/right) based on angle
- Calculate intersection with that side
- Use half-diagonal as square radius

---

### 2. CCW Direction Mirroring

**Location:** `Ring.layout()`, `RingSystem.updateTodayIndicator()`

**Algorithm:**
- For CCW (`direction === -1`), mirror angles around vertical axis
- Formula: `θ' = π - θ`
- **Critical:** Must swap start and end angles to maintain correct arc direction

**Why:**
- SVG arcs have direction (clockwise/counter-clockwise)
- Mirroring flips the arc direction
- Swapping start/end compensates for the flip

---

### 3. Perimeter Preservation

**Location:** `Ring.calculatePerimeterConstantRadius()`

**Algorithm:**
1. Establish target perimeter from base circle (`cornerRadius = 1`)
2. For new `cornerRadius`, use binary search to find radius that matches target
3. Iterate until perimeter difference < tolerance

**Why:**
- As shape morphs from circle to square, perimeter changes
- Preserving perimeter keeps visual consistency
- Prevents rings from "jumping" when corner radius changes

---

### 4. Day-Based Positioning

**Location:** `MonthsRing.layout()`, `HebrewMonthsRing.layout()`, etc.

**Algorithm:**
1. Convert day of year (0-364) to angle: `angle = (day / 365) * 2π`
2. Apply base offset (Jan 1 at top): `angle += BASE_OFFSET`
3. Apply rotation offset: `angle += rotationOffset`
4. Apply CCW mirroring if needed: `angle = π - angle` (with swap)

**Precision:**
- Uses higher precision (4 decimals) for rings with many sectors (>20)
- Prevents rounding errors that cause gaps/overlaps

---

## State Management

### RingSystem State

```typescript
{
  rings: Ring[]                    // Ring instances (outermost to innermost)
  ringVisibility: Record<string, boolean>  // Per-ring visibility
  cornerRadius: number            // 0-1 (square to circle)
  ringWidth: number               // Pixels
  direction: number               // 1 = CW, -1 = CCW
  rotationOffset: number          // 0, 90, 180, 270 degrees
  targetPerimeter: number        // Cached for perimeter preservation
}
```

### Persisted Settings

```typescript
{
  cornerRadius: number
  ringWidth: number
  direction: number
  rotationOffset: number
  ringOrder: string[]            // ['holidays', 'weeks', ...]
  ringVisibility: Record<string, boolean>
}
```

---

## Rendering Pipeline

### Sector Rendering

```
1. Calculate sector angles (start, end)
2. Apply CCW mirroring if needed
3. Create sector group (SVG <g>)
4. Generate path (arc + lines)
5. Create path element with fill color
6. Create label element (if label exists)
7. Append to sector group (path first, label on top)
8. Append sector group to ring group
```

### Label Rendering

```
1. Calculate label position (midpoint of sector)
2. Determine text rotation (perpendicular to radius)
3. Flip if upside down (rotation > 90° && < 270°)
4. Create SVG <text> element
5. Set transform with rotation
6. Append to sector group (renders on top)
```

---

## Performance Considerations

### Optimization Strategies

1. **Precision Scaling:**
   - 2 decimals for rings with ≤20 sectors
   - 4 decimals for rings with >20 sectors (weeks, holidays)
   - Prevents visual gaps from rounding errors

2. **Selective Rendering:**
   - Hidden rings skip layout calculation
   - Only visible rings render sectors

3. **Cached Calculations:**
   - `targetPerimeter` cached after first layout
   - Avoids recalculating on every layout

4. **DOM Efficiency:**
   - Clear and rebuild (`innerHTML = ''`) instead of incremental updates
   - Single layout pass for all rings

---

## Known Issues & Limitations

### Current Limitations

1. **Hardcoded Year:** 2025 (non-leap year)
   - Month lengths fixed for 2025
   - Hebrew months calculated for 2025
   - Holidays for 2025 only

2. **Leap Year Handling:** Not implemented
   - February always 28 days
   - Year length always 365 days

3. **Precision Trade-offs:**
   - Higher precision (4 decimals) for many sectors
   - May cause slight performance impact

4. **Today Indicator:**
   - Uses `getElementById()` (tight coupling to HTML)
   - Should be passed as dependency

---

## Testing

### Test Files

- `Ring.test.ts` - Base class functionality
- `ringImplementations.test.ts` - Concrete ring implementations
- `RingSystem.test.ts` - Ring system management

### Test Coverage Areas

- Sector count calculations
- Label generation
- Layout positioning
- CCW mirroring
- Perimeter calculations

---

## Future Improvements

### Potential Enhancements

1. **Dynamic Year Support:**
   - Calculate month lengths based on year
   - Handle leap years
   - Update Hebrew calendar for any year

2. **Dependency Injection:**
   - Pass today indicator element to RingSystem
   - Reduce DOM coupling

3. **Code Deduplication:**
   - Extract common layout logic from MonthsRing/HebrewMonthsRing
   - Create `DayBasedRing` base class

4. **Type Safety:**
   - Replace `any` types with proper interfaces
   - Add stricter type checking

5. **Performance:**
   - Virtual rendering for rings with many sectors
   - Debounce layout updates during slider drag

6. **Accessibility:**
   - ARIA labels for sectors
   - Keyboard navigation
   - Screen reader support

---

## Usage Examples

### Creating a Custom Ring

```typescript
class CustomRing extends Ring {
  constructor() {
    super('custom', 'gradient-custom');
  }

  get sectorCount(): number {
    return 12;
  }

  getSectorLabel(index: number): string {
    return `Sector ${index + 1}`;
  }
}

// Add to RingSystem
const customRing = new CustomRing();
ringSystem.addRing(customRing, true);
```

### Programmatic Control

```typescript
// Change shape
ringsMode.setCornerRadius(0.75); // 75% circle

// Adjust ring width
ringsMode.setRingWidth(60);

// Toggle direction
ringsMode.toggleDirection();

// Rotate
ringsMode.rotateYear();

// Hide/show ring
ringSystem.setRingVisibility('holidays', false);
```

---

## Dependencies

### External
- None (pure TypeScript/JavaScript)

### Internal
- `utils/settings` - Settings persistence
- `utils/modeNavigation` - Mode switching
- `utils/theme` - Theme management
- `services/googleCalendar` - Login status

---

## Code Quality Metrics

### Complexity
- **Ring.ts:** Medium (376 lines, well-structured)
- **RingSystem.ts:** Medium (315 lines, clear responsibilities)
- **ringImplementations.ts:** Low-Medium (449 lines, repetitive patterns)
- **RingsMode.ts:** Low (299 lines, facade pattern)

### Maintainability
- ✅ Good separation of concerns
- ✅ Clear abstraction layers
- ⚠️ Some code duplication in layout methods
- ⚠️ Magic numbers in some calculations

### Testability
- ✅ Pure functions for calculations
- ✅ Dependency injection ready
- ⚠️ DOM coupling in some methods

---

**Last Updated:** 2025-11-14  
**Version:** 0.11.0

