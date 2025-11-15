# Zoom Mode Documentation

## Overview
Zoom mode provides a hierarchical calendar view: Year → Month → Week → Day.
Each level is rendered as a circular visualization with interactive hover effects.

## Known Issues

### 1. Month Circle Date Labels Disappearing on Hover
**Status**: Unresolved

**Problem**: When hovering over days in the month circle, date labels disappear or become invisible.

**Current Implementation**:
- Labels are rendered in a separate `.labels-layer` group AFTER all sector groups
- Labels use `transform: none` to avoid transform-related visibility issues
- `ensureLabelsLayerVisible()` is called during hover updates to:
  - Force visibility with explicit styles
  - Move labels layer to end of DOM (ensuring z-order)
  - Reset all transform/visibility/opacity styles

**Possible Causes**:
1. Labels might be getting occluded by scaled sectors despite being in separate layer
2. SVG transform calculations might be affecting label positioning
3. Labels might be getting re-rendered/removed during hover updates
4. Browser rendering optimization might be hiding off-screen labels

**Debugging Steps**:
1. Check if labels are in DOM after hover: `document.querySelectorAll('.day-label')`
2. Check computed styles: `getComputedStyle(label).visibility`
3. Check if labels are being removed/re-added during hover
4. Verify labels layer is actually last child of wrapper group
5. Check if labels are outside viewBox (x/y coordinates)

### 2. Week Circle Hover Not Working
**Status**: Unresolved

**Problem**: Hover effects on week circle sectors don't work correctly.

**Current Implementation**:
- Uses `findWrapperGroup()` to find wrapper group
- Queries `g[data-week-day]` within wrapper
- Updates `transform: scale()` on sector groups

**Possible Causes**:
1. Wrapper group query might not be finding the right element
2. Sector groups might not have `data-week-day` attributes set correctly
3. Transform might not be applying correctly
4. Event listeners might not be attached correctly

**Debugging Steps**:
1. Verify wrapper group exists: `this.svg.querySelector('g[transform*="scale"]')`
2. Verify sector groups exist: `wrapperGroup.querySelectorAll('g[data-week-day]')`
3. Check if `data-week-day` attributes are set during render
4. Check if transform styles are actually being applied
5. Verify hover event listeners are attached to sectors

### 3. Week Period Text Split
**Status**: Implemented but needs verification

**Implementation**:
- Uses two `<tspan>` elements within `<text>` element
- First line: "Week X"
- Second line: "DD-DD MMM" or "DD MMM - DD MMM"

## SVG Structure

```
<svg viewBox="0 0 800 800">
  <g transform="translate(400,400) scale(0.8)">  <!-- Wrapper group -->
    
    <!-- For Year/Week/Day circles: -->
    <g data-month="0" class="sector-group">
      <path class="month-sector">...</path>
      <text class="month-label">...</text>  <!-- Label INSIDE group -->
    </g>
    
    <!-- For Month circle ONLY: -->
    <g data-day="1" class="sector-group">
      <path class="day-sector">...</path>
      <!-- No label here - labels are separate -->
    </g>
    ...
    <g class="labels-layer">  <!-- Separate layer, rendered AFTER sectors -->
      <circle data-day="1" class="label-bg-circle">...</circle>
      <text data-day="1" class="day-label">1</text>
      ...
    </g>
    
  </g>
</svg>
```

## Key Differences Between Circles

### Year Circle
- **Labels**: Inside sector groups (scale with sectors)
- **Update method**: `updateMonthScales()`
- **Works**: ✅ Yes

### Month Circle  
- **Labels**: In separate `.labels-layer` group (fixed size, no scaling)
- **Update method**: `updateDayScales()` + `ensureLabelsLayerVisible()`
- **Works**: ❌ No - labels disappear on hover

### Week Circle
- **Labels**: Inside sector groups (scale with sectors)  
- **Update method**: `updateWeekDayScales()`
- **Works**: ❌ No - hover doesn't work

### Day Circle
- **Labels**: Inside sector groups (scale with sectors)
- **Update method**: `updateHourScales()`
- **Works**: ✅ Likely (not reported as broken)

## Code Organization

### Helper Methods
- `findWrapperGroup()`: Finds the wrapper group with transform attribute
- `ensureLabelsLayerVisible()`: Ensures labels layer is visible and on top (month circle only)

### Update Methods
All update methods follow this pattern:
1. Check current level
2. Find wrapper group using `findWrapperGroup()`
3. Query sector groups by data attribute (`data-month`, `data-day`, `data-week-day`, `data-hour`)
4. Update transform scale based on hover state
5. (Month circle only) Call `ensureLabelsLayerVisible()`

## Recommendations for Next Session

1. **Add console logging** to track when labels disappear:
   ```typescript
   console.log('Labels after hover:', monthGroup.querySelectorAll('.day-label').length);
   ```

2. **Inspect DOM structure** during hover to see if labels are actually removed

3. **Check if labels are outside viewBox** - month circle uses centerX=0, centerY=0, but labels might be positioned incorrectly

4. **Consider alternative approach**: Instead of separate labels layer, try rendering labels with higher z-index or using SVG filters/masks

5. **Verify week circle attributes** are set correctly during render

6. **Test in different browsers** to rule out rendering differences

