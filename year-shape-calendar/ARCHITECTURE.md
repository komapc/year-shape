# 🏗️ Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              User Interface (HTML)                   │   │
│  │  • Controls (buttons, sliders)                       │   │
│  │  • Calendar visualization area                       │   │
│  │  • Week detail modal                                 │   │
│  └───────────────────┬─────────────────────────────────┘   │
│                      │                                       │
│                      │ DOM Events                            │
│                      ▼                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          CalendarApp (Controller)                    │   │
│  │  • Handles user interactions                         │   │
│  │  • Coordinates components                            │   │
│  │  • Manages application state                         │   │
│  └─────┬──────────────────┬──────────────────┬─────────┘   │
│        │                  │                  │               │
│        ▼                  ▼                  ▼               │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │CalendarRend.│   │  WeekModal   │   │GoogleCalendar│    │
│  │  • Layout   │   │  • Display   │   │  • Auth      │    │
│  │  • Position │   │  • Events    │   │  • Fetch     │    │
│  │  • Season   │   │  • Soviet    │   │  • Sync      │    │
│  └──────┬──────┘   └──────────────┘   └──────────────┘    │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐                                            │
│  │ WeekElement │                                            │
│  │  • Visual   │  (×52 instances)                          │
│  │  • Events   │                                            │
│  │  • Click    │                                            │
│  └─────────────┘                                            │
│         │                                                    │
│         │ Uses                                              │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Utility Modules                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │   Math   │  │   Date   │  │   DOM    │         │   │
│  │  │ • Pos.   │  │ • Week # │  │ • Helper │         │   │
│  │  │ • Angle  │  │ • Format │  │ • Access.│         │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
CalendarApp (Root Controller)
│
├─ CalendarRenderer
│  └─ WeekElement (×52)
│     • Individual week visualization
│     • Event indicators
│     • Click handlers
│
├─ WeekModal
│  └─ Day Cards (×7)
│     • Event listings
│     • Soviet layout (4+3)
│
└─ GoogleCalendarService
   • Authentication
   • Event fetching
   • Data mapping
```

---

## Data Flow

### 1. User Interaction
```
User clicks button
      ↓
CalendarApp.handleXXX()
      ↓
Update state
      ↓
Call renderer/modal methods
      ↓
DOM updates
```

### 2. Calendar Rendering
```
CalendarRenderer.layoutWeeks()
      ↓
Calculate positions (math utils)
      ↓
Update each WeekElement
      ↓
WeekElement.setPosition()
      ↓
DOM style updates
```

### 3. Event Loading
```
User clicks "Refresh"
      ↓
CalendarApp.handleRefreshEvents()
      ↓
GoogleCalendarService.fetchEvents()
      ↓
API Request → Google Calendar
      ↓
Map response to internal format
      ↓
CalendarRenderer.updateEvents()
      ↓
Each WeekElement.setEvents()
      ↓
Visual updates (dots/colors)
```

### 4. Week Detail View
```
User clicks week
      ↓
WeekElement.onClick callback
      ↓
CalendarApp.handleWeekClick()
      ↓
Get week data + events
      ↓
WeekModal.open(weekIndex, events)
      ↓
Render 7 day cards
      ↓
Display events per day
```

---

## Module Dependencies

```
┌─────────────┐
│   main.ts   │  Entry point
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  CalendarApp    │  Main controller
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┬────────────────┐
         ▼                  ▼                  ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│CalendarRend. │  │  WeekModal   │  │GoogleCalendar│  │   Utils      │
└──────┬───────┘  └──────┬───────┘  └──────────────┘  └──────────────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ WeekElement  │  │  DOM Utils   │
└──────────────┘  └──────────────┘
```

**Key Principles:**
- ✅ **Unidirectional data flow** (top-down)
- ✅ **Single source of truth** (CalendarApp state)
- ✅ **Loose coupling** (components don't know each other)
- ✅ **High cohesion** (related code together)

---

## State Management

### Application State (CalendarApp)
```typescript
{
  // Managed by CalendarApp
  eventsByWeek: Record<number, CalendarEvent[]>
  
  // Managed by CalendarRenderer
  direction: Direction (-1 or 1)
  seasons: Season[] (order of seasons)
  weeks: WeekElement[] (52 instances)
  cornerRadius: number (0-50)
  
  // Managed by GoogleCalendarService
  isAuthenticated: boolean
  accessToken: string | null
}
```

### State Flow
```
User Action
    ↓
Event Handler
    ↓
Update State
    ↓
Update Components
    ↓
Re-render
```

---

## File Organization

### By Feature
```
src/
├── calendar/           # Calendar feature
│   ├── CalendarApp.ts      # Main controller
│   ├── CalendarRenderer.ts # Rendering logic
│   ├── WeekElement.ts      # Week component
│   └── WeekModal.ts        # Modal component
│
├── services/           # External integrations
│   └── googleCalendar.ts   # Google API
│
├── utils/              # Shared utilities
│   ├── constants.ts        # Configuration
│   ├── date.ts            # Date helpers
│   ├── dom.ts             # DOM helpers
│   └── math.ts            # Math helpers
│
└── types/              # Type definitions
    └── index.ts           # All types
```

**Benefits:**
- ✅ Easy to find related code
- ✅ Clear module boundaries
- ✅ Simple to test
- ✅ Scalable structure

---

## Design Patterns

### 1. **Module Pattern**
Each file exports specific functionality
```typescript
// math.ts
export const calculatePosition = (...) => { ... };
export const degreesToRadians = (...) => { ... };
```

### 2. **Class Pattern** (OOP)
Encapsulation for components
```typescript
class WeekElement {
  private element: HTMLDivElement;
  private weekIndex: number;
  
  constructor(weekIndex: number) { ... }
  
  public setPosition(x: number, y: number): void { ... }
}
```

### 3. **Observer Pattern** (Events)
Components communicate via callbacks
```typescript
// CalendarRenderer
onWeekClick(callback: (weekIndex: number) => void): void {
  this.weeks.forEach(week => {
    week.onClick(callback);
  });
}
```

### 4. **Service Pattern**
Singleton for shared services
```typescript
class GoogleCalendarService { ... }
export const googleCalendarService = new GoogleCalendarService();
```

### 5. **Strategy Pattern**
Different behaviors for same interface
```typescript
// Direction can be 1 or -1, changing behavior
const angle = startAngle + this.direction * progress * Math.PI * 2;
```

---

## TypeScript Type System

### Core Types
```typescript
// Primitives
type Season = 'winter' | 'spring' | 'summer' | 'autumn';
type Direction = -1 | 1;

// Interfaces
interface CalendarEvent {
  summary: string;
  start?: string;
  end?: string;
  _day?: number;
  _weekIndex?: number;
}

// Complex types
interface CalendarState {
  direction: Direction;
  seasons: Season[];
  eventsByWeek: Record<number, CalendarEvent[]>;
}
```

### Type Flow
```
User Input (unknown)
    ↓
Type Guards / Validation
    ↓
Typed Data (CalendarEvent, etc.)
    ↓
Type-safe Operations
    ↓
Typed Output
```

---

## Event Flow

### 1. DOM Events
```
User clicks element
    ↓
Native DOM event
    ↓
addEventListener callback
    ↓
Handler method (typed)
    ↓
Business logic
```

### 2. Custom Events
```
Component A action
    ↓
Callback prop
    ↓
Parent handler
    ↓
Update state
    ↓
Component B updates
```

---

## Performance Optimizations

### 1. **Lazy Initialization**
```typescript
// Google API loads async, doesn't block rendering
await this.waitForGoogleScripts();
```

### 2. **Event Delegation**
Not needed (only 52 weeks, each clickable)

### 3. **Efficient Re-renders**
Only update changed elements
```typescript
week.setEvents(events); // Only updates this week
```

### 4. **CSS Transitions**
Smooth animations without JavaScript
```css
transition: transform 0.3s ease;
```

### 5. **Vite Optimization**
- Code splitting
- Tree shaking
- Minification
- Lazy loading

---

## Testing Strategy (Future)

### Unit Tests
```typescript
// math.test.ts
describe('calculatePosition', () => {
  it('should calculate correct position', () => {
    const pos = calculatePosition(50, 50, 30, 0);
    expect(pos.x).toBe(80);
    expect(pos.y).toBe(50);
  });
});
```

### Integration Tests
```typescript
// CalendarRenderer.test.ts
describe('CalendarRenderer', () => {
  it('should layout 52 weeks', () => {
    const renderer = new CalendarRenderer(container);
    expect(renderer.getAllWeeks()).toHaveLength(52);
  });
});
```

### E2E Tests
```typescript
// calendar.spec.ts
test('should open week modal on click', async ({ page }) => {
  await page.click('.week[data-week="0"]');
  await expect(page.locator('#weekModal')).toBeVisible();
});
```

---

## Build Pipeline

```
Source Files (.ts)
    ↓
TypeScript Compiler
    ↓
JavaScript (.js)
    ↓
Vite Bundler
    ↓
PostCSS (TailwindCSS)
    ↓
Minification
    ↓
Output (dist/)
```

### Development Mode
```
Source Change
    ↓
Vite Hot Module Replacement (HMR)
    ↓
Browser updates instantly (no refresh)
```

---

## Security Considerations

### 1. **XSS Prevention**
```typescript
// Using textContent instead of innerHTML
title.textContent = event.summary; // ✅ Safe
// NOT: title.innerHTML = event.summary; // ❌ Unsafe
```

### 2. **CORS**
```typescript
// Google Calendar API uses CORS-enabled endpoints
// OAuth flow handles authentication securely
```

### 3. **Input Validation**
```typescript
// Type system prevents invalid data
const weekIndex: number = ...; // Must be number
const season: Season = ...; // Must be valid season
```

### 4. **No Secrets in Frontend**
```typescript
// CLIENT_ID and API_KEY are public (OAuth requirement)
// Access tokens are temporary and user-specific
```

---

## Scalability

### Current Capacity
- ✅ 52 weeks (fixed)
- ✅ Unlimited events per week
- ✅ Multiple calendar support (ready)

### Future Growth
- Add more views (month, day)
- Support multiple years
- Add event editing
- Offline support
- PWA capabilities

---

## Browser Rendering

```
HTML Parse
    ↓
CSS Parse (TailwindCSS)
    ↓
JavaScript Parse
    ↓
CalendarApp.init()
    ↓
Create 52 WeekElements
    ↓
Calculate positions
    ↓
Apply styles
    ↓
Render to DOM
    ↓
User interaction ready
```

**Time to Interactive:** ~200ms (fast!)

---

## Key Architectural Decisions

### 1. **TypeScript over JavaScript**
- **Why:** Type safety, better tooling, fewer bugs
- **Trade-off:** Slightly more verbose

### 2. **Vite over Webpack**
- **Why:** Faster dev server, simpler config
- **Trade-off:** Less mature ecosystem

### 3. **TailwindCSS over custom CSS**
- **Why:** Rapid development, consistent design
- **Trade-off:** Larger HTML, learning curve

### 4. **Class-based components**
- **Why:** Clear encapsulation, OOP patterns
- **Trade-off:** More boilerplate than pure functions

### 5. **Client-side rendering**
- **Why:** Simple deployment, no backend needed
- **Trade-off:** SEO limitations (not needed here)

---

## Summary

This architecture provides:

✅ **Maintainability** - Clear structure, easy to understand
✅ **Scalability** - Easy to add features
✅ **Performance** - Fast load and runtime
✅ **Type Safety** - TypeScript catches errors
✅ **Testability** - Modular, dependency injection ready
✅ **Developer Experience** - HMR, TypeScript, linting
✅ **User Experience** - Fast, responsive, accessible

**Next Steps:**
1. Review code in `src/` directory
2. Run `npm run dev` to see it in action
3. Experiment with modifications
4. Check `README.md` for feature details

---

**Questions?** Open an issue or check the other documentation files!

