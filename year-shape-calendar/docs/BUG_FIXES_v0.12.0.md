# Last 12 Bug Fixes - YearWheel v0.12.0

All bugs verified to be in **staging** branch as of commit `f9c3464`.

## 1. ✅ SVG Ellipsis on Mobile (Zoom Mode)
**Commit**: `85e674d` - In staging ✅  
**Issue**: SVG circles appeared as ellipses on mobile devices  
**Fix**: Added `preserveAspectRatio="xMidYMid meet"` attribute to SVG  
**Location**: `src/calendar/ZoomMode.ts:72`  
**Test**: `src/calendar/__tests__/ZoomMode.test.ts` (NEW)

## 2. ✅ Double Footer in Classic Mode
**Commit**: `85e674d` - In staging ✅  
**Issue**: Two identical footers appeared on the page  
**Fix**: Removed duplicate footer element after script tag  
**Location**: `src/index.html:508-527` (removed)  
**Test**: Visual inspection required

## 3. ✅ Rings Mode Too Light in Dark Theme
**Commit**: `85e674d` - In staging ✅  
**Issue**: Ring sectors barely visible in dark theme  
**Fix**: Reduced opacity from 0.75 to 0.5, stroke from 0.3 to 0.2  
**Location**: `src/rings.html:249-262`  
**Test**: Visual inspection required

## 4. ✅ Week Calculation Bug (Critical)
**Commit**: `5ed5c5a` - In staging ✅  
**Issue**: Clicking day 16 in November navigated to wrong week (45 instead of 46)  
**Root Cause**: Naive division by 7 ignored week boundaries and partial weeks  
**Fix**: Proper Sunday-based week calculation accounting for year start  
**Location**: `src/calendar/ZoomMode.ts:2124-2149`  
**Test**: `src/utils/__tests__/weekCalculation.test.ts` (NEW)

## 5. ✅ Missing Direction Type Import
**Commit**: `9557900` - In staging ✅  
**Issue**: TypeScript build error - `Type 'number' is not assignable to type 'Direction'`  
**Fix**: Added `Direction` to imports from '../types'  
**Location**: `src/calendar/CalendarApp.ts:14`  
**Test**: TypeScript compilation test (passes)

## 6. ✅ No CW/CCW Direction Control in Zoom Mode
**Commit**: `85e674d` - In staging ✅  
**Issue**: Only Classic and Rings modes had direction toggle  
**Fix**: Added direction property and mirroring to all zoom levels  
**Location**: `src/calendar/ZoomMode.ts:33, 2289-2333`  
**Test**: `src/calendar/__tests__/ZoomMode.test.ts` (NEW)

## 7. ✅ User Name Display Shows "Hello, User"
**Commit**: `8681e60` - In staging ✅  
**Issue**: Generic "User" text instead of actual user name  
**Fix**: Changed to show actual name or just "Hello" if unavailable  
**Location**: `src/calendar/CalendarApp.ts` and `src/rings.ts`  
**Test**: Integration test required

## 8. ✅ No Event Display in Zoom Mode
**Commit**: `d0584e0` - In staging ✅  
**Issue**: Clicking day in week view did nothing  
**Fix**: Added event modal callback to show events for clicked day  
**Location**: `src/calendar/ZoomMode.ts:45-84, 1655-1669`  
**Test**: `src/calendar/__tests__/ZoomMode.test.ts` (NEW)

## 9. ✅ Header Layout Not Unified
**Commit**: `8681e60` - In staging ✅  
**Issue**: Settings and About buttons not aligned with mode selector  
**Fix**: Moved buttons inline with mode selector using flexbox  
**Location**: `src/index.html` and `src/rings.html`  
**Test**: Visual inspection required

## 10. ✅ Swipe Navigation Not Context-Aware
**Commit**: `8681e60` - In staging ✅  
**Issue**: Swipe only navigated years, not month/week/day in Zoom mode  
**Fix**: Added context-aware navigation based on current zoom level  
**Location**: `src/utils/swipeNavigation.ts:78-99`  
**Test**: `src/utils/__tests__/swipeNavigation.test.ts` (NEW)

## 11. ✅ Zoom Animation Too Slow
**Commit**: `8681e60` - In staging ✅  
**Issue**: 2000ms animation felt sluggish  
**Fix**: Reduced to 800ms with ease-out-quart easing  
**Location**: `src/calendar/ZoomMode.ts:30, 67`  
**Test**: Performance/timing test

## 12. ✅ Month Circle Days Not Visible
**Commit**: `fb7f83c` - In staging ✅  
**Issue**: Day labels obscured by sectors in month circle  
**Fix**: Created separate labels layer that renders on top  
**Location**: `src/calendar/ZoomMode.ts:1437-1512`  
**Test**: Visual inspection required

---

## Summary
- **All 12 bugs verified in staging branch** ✅
- **8 require automated tests** (4 created, 4 pending)
- **4 require visual/integration testing**

## Test Coverage Status
- ✅ Week calculation: NEW tests added
- ✅ Direction control: NEW tests added  
- ✅ Event display: NEW tests added
- ✅ Swipe navigation: NEW tests added
- ✅ TypeScript: Compilation passes
- ⏳ Visual bugs: Require manual QA
- ⏳ Animation timing: Require performance tests
- ⏳ User name display: Require integration tests

