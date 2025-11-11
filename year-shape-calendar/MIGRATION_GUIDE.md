# 🔄 Migration Guide: Old → New

## File Mapping

If you're familiar with the old code, here's where everything went:

### Root Files (Old → New)

| Old File | New File(s) | Notes |
|----------|-------------|-------|
| `app.js` | `src/calendar/CalendarApp.ts` | Split into multiple modules |
| | `src/calendar/CalendarRenderer.ts` | Layout logic extracted |
| | `src/calendar/WeekElement.ts` | Week component |
| | `src/calendar/WeekModal.ts` | Modal extracted |
| `index.html` | `src/index.html` | Updated with TailwindCSS |
| `styles.css` | `src/style.css` | Now using TailwindCSS |
| `README.md` | `README.md` | Complete rewrite |

### Old Directories → Removed

- ❌ `calendar-shape/` - Empty, removed
- ❌ `shape-calendar/` - Broken references, removed
- ❌ `year-viz/` - Duplicate code, removed
- ❌ `year-shape-calendar/` - Incomplete, removed

### New Additions

- ✅ `src/types/` - TypeScript type definitions
- ✅ `src/utils/` - Reusable utility functions
- ✅ `src/services/` - External API integrations
- ✅ Configuration files (Vite, TypeScript, Tailwind, ESLint)
- ✅ `.vscode/` - Editor settings
- ✅ Comprehensive documentation

---

## Code Changes

### 1. From Inline Handlers to Event Listeners

**Old (Bad):**
```javascript
<button onclick="handleClick()">Click</button>

function handleClick() {
  // ...
}
```

**New (Good):**
```typescript
<button id="myButton">Click</button>

const handleClick = (): void => {
  // ...
};

button.addEventListener('click', handleClick);
```

---

### 2. From Inline Styles to TailwindCSS

**Old (Bad):**
```javascript
element.style.background = '#1f77b4';
element.style.padding = '10px';
element.style.borderRadius = '8px';
```

**New (Good):**
```typescript
element.classList.add('bg-primary-500', 'p-3', 'rounded-lg');
```

---

### 3. From Global Variables to Class State

**Old (Bad):**
```javascript
let direction = -1;
let seasons = ['winter', 'spring', 'summer', 'autumn'];
let weeks = [];
```

**New (Good):**
```typescript
class CalendarRenderer {
  private direction: Direction = -1;
  private seasons: Season[] = [...CALENDAR_CONFIG.defaultSeasons];
  private weeks: WeekElement[] = [];
}
```

---

### 4. From Any to Typed

**Old (Bad):**
```javascript
function layoutWeeks() {
  const rect = yearShape.getBoundingClientRect();
  // ...
}
```

**New (Good):**
```typescript
layoutWeeks = (): void => {
  const rect: DOMRect = this.container.getBoundingClientRect();
  // ...
};
```

---

### 5. From Monolith to Modules

**Old (170 lines in one file):**
```javascript
// app.js
const WEEKS = 52;
function init() { /* ... */ }
function layoutWeeks() { /* ... */ }
function openWeek() { /* ... */ }
// ... everything mixed together
```

**New (Separated by concern):**
```typescript
// src/types/index.ts - Data structures
// src/utils/constants.ts - Configuration
// src/utils/math.ts - Math functions
// src/calendar/CalendarRenderer.ts - Layout
// src/calendar/WeekModal.ts - Modal
// src/calendar/CalendarApp.ts - Controller
```

---

## API Changes

### Week Creation

**Old:**
```javascript
for(let i=0; i<WEEKS; i++){
  const el = document.createElement('div');
  el.className = 'week empty';
  el.addEventListener('click', ()=>openWeek(i));
  yearShape.appendChild(el);
}
```

**New:**
```typescript
for (let i = 0; i < CALENDAR_CONFIG.totalWeeks; i++) {
  const seasonIndex = Math.floor((i / CALENDAR_CONFIG.totalWeeks) * 4);
  const season = this.seasons[seasonIndex % 4];
  const week = new WeekElement(i, season);
  
  this.weeks.push(week);
  this.container.appendChild(week.getElement());
}
```

---

### Event Handling

**Old:**
```javascript
function openWeek(i) {
  weekModal.classList.remove('hidden');
  weekTitle.textContent = `Week ${i+1}`;
  renderSovietDiary(i);
}
```

**New:**
```typescript
private handleWeekClick = (weekIndex: number): void => {
  const week = this.renderer.getWeek(weekIndex);
  if (!week) return;

  const events = week.getEvents();
  this.modal.open(weekIndex, events);
};
```

---

### Google Calendar Integration

**Old:**
```javascript
googleSignInBtn.addEventListener('click', () => {
  alert('Google sign-in requires CLIENT_ID. See README to configure.');
});
```

**New:**
```typescript
private handleSignIn = async (): Promise<void> => {
  if (!googleCalendarService.isReady()) {
    this.showConfigurationAlert();
    return;
  }

  try {
    this.signInBtn.disabled = true;
    await googleCalendarService.signIn();
    await this.handleRefreshEvents();
    this.updateSignInState();
  } catch (error) {
    this.handleSignInError(error);
  }
};
```

---

## Configuration Migration

### Environment Setup

**Old:** No configuration needed

**New:** Install dependencies first
```bash
npm install
```

### Development Server

**Old:** 
```bash
# Open index.html directly in browser
open index.html
```

**New:**
```bash
# Use Vite dev server with HMR
npm run dev
# Visit http://localhost:5173
```

### Production Build

**Old:** No build step

**New:**
```bash
npm run build
# Outputs to dist/
```

---

## TypeScript Benefits

### 1. Autocomplete
Your editor now knows all available methods and properties!

### 2. Compile-time Errors
Catch bugs before running code:
```typescript
// Old: Runtime error
const week = weeks[100]; // undefined
week.classList.add('active'); // 💥 Error at runtime

// New: Compile-time error
const week = this.weeks[100]; // TS warns about potential undefined
```

### 3. Refactoring Safety
Rename a method? TypeScript finds all usages automatically.

### 4. Documentation
Types serve as inline documentation:
```typescript
const calculatePosition = (
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
): Position => {
  // Clear what parameters mean and what's returned
};
```

---

## Performance Improvements

### 1. Build Optimization
- **Tree shaking**: Unused code removed
- **Minification**: Smaller file sizes
- **Code splitting**: Faster initial load

### 2. Development Speed
- **HMR**: Instant updates without refresh
- **TypeScript**: Catch errors immediately
- **Vite**: Fast build times (~200ms)

---

## Breaking Changes

### None! (For Users)

The application works the same way from a user perspective. All changes are internal improvements.

### For Developers

If you were extending the old code:

1. **Import paths changed**: Now using ES modules
2. **Global variables removed**: Use class instances
3. **Function names**: More descriptive, following conventions
4. **File structure**: Moved into `src/` directory

---

## Upgrading Custom Code

If you added custom features to the old version:

### 1. Find Old Code Location
Check `REFACTOR_SUMMARY.md` for file mapping

### 2. Identify New Module
- UI controls → `CalendarApp.ts`
- Layout logic → `CalendarRenderer.ts`
- Week behavior → `WeekElement.ts`
- Utilities → `src/utils/`

### 3. Convert to TypeScript
- Add type annotations
- Use arrow functions
- Follow class patterns

### 4. Test
```bash
npm run dev
```

---

## Common Questions

### Q: Can I still use plain JavaScript?
**A:** No, the project is now TypeScript-only. But TypeScript is easy to learn!

### Q: Do I need to learn TailwindCSS?
**A:** Not required, but recommended. It's intuitive: `bg-blue-500`, `p-4`, etc.

### Q: What about browser compatibility?
**A:** Better! Vite adds polyfills automatically.

### Q: Can I revert to the old version?
**A:** The old files are deleted but available in git history (if committed).

### Q: Where's my old customization?
**A:** Check git history or use this migration guide to port it.

---

## Next Steps

1. ✅ Read `QUICKSTART.md` - Get running in 60 seconds
2. ✅ Try `npm run dev` - See it in action
3. ✅ Review `README.md` - Full documentation
4. ✅ Explore `src/` - Understand the code
5. ✅ Check `REFACTOR_SUMMARY.md` - Detailed changes

---

## Getting Help

### Resources
- Main docs: `README.md`
- Quick start: `QUICKSTART.md`
- This guide: `MIGRATION_GUIDE.md`
- Summary: `REFACTOR_SUMMARY.md`

### Debugging
```bash
# Check for errors
npm run lint

# Type check
npx tsc --noEmit

# Clean install
rm -rf node_modules && npm install
```

---

**Welcome to the new Year Shape Calendar!** 🎉

The code is now professional, maintainable, and ready for production. Happy coding! 🚀

