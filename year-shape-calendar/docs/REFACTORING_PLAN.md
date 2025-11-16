# Code Refactoring Plan - v0.12.0

## Executive Summary

This document outlines a comprehensive refactoring strategy to eliminate code duplication across calendar modes (Classic, Rings, Zoom) and within ZoomMode's circle rendering methods.

## Current Issues Identified

### 1. ZoomMode Circle Rendering Duplication

All four `render*Circle` methods (`renderYearCircle`, `renderMonthCircle`, `renderWeekCircle`, `renderDayCircle`) share ~70% identical code:

**Common patterns:**
- Constants: `centerX=0`, `centerY=0`, `radius=320`
- Angle calculations with direction mirroring
- Sector group creation with transform origin
- Sector creation with colors
- Event handlers (click, touch, hover)
- Label placement
- Current item highlighting

**Differences:**
- Number of items (12 months, 28-31 days, 7 week days, 12 hours)
- Data source (month names, day numbers, etc.)
- Color schemes
- Navigation targets

### 2. SVG Creation Duplication

Multiple files create SVG elements similarly:
- `ZoomMode.ts`: 4 occurrences of `createElementNS`
- `RingsMode.ts`: 3 occurrences
- Test files: Multiple occurrences

### 3. Event Handler Patterns

Similar event handling logic appears across:
- Click handlers with touch support
- Hover effects with transform scaling
- Navigation logic

## Refactoring Strategy

### Phase 1: Extract SVG Utilities ✅ PRIORITY

**File:** `src/utils/svg.ts`

```typescript
/**
 * SVG utility functions for creating and manipulating SVG elements
 */

// Create SVG element with attributes
export function createSVGElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes?: Record<string, string>,
  styles?: Partial<CSSStyleDeclaration>
): SVGElementTagNameMap[K];

// Create circular sector path
export interface SectorConfig {
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fillColor: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export function createSectorPath(config: SectorConfig): SVGPathElement;

// Create sector group with transform origin
export interface SectorGroupConfig {
  centerX: number;
  centerY: number;
  angle: number;
  radius: number;
  scale?: number;
  dataAttributes?: Record<string, string>;
}

export function createSectorGroup(config: SectorGroupConfig): SVGGElement;

// Add text label to SVG
export interface LabelConfig {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontWeight?: string;
  fill?: string;
  classList?: string[];
}

export function createLabel(config: LabelConfig): SVGTextElement;
```

### Phase 2: Extract Circle Rendering Base Class

**File:** `src/calendar/CircleRenderer.ts`

```typescript
/**
 * Base class for rendering circular calendar views
 * Eliminates duplication between ZoomMode's four circle renderers
 */

export interface CircleItem {
  index: number;          // Position in circle (0-based)
  label: string;          // Display text
  value: any;             // The actual data (month index, day number, etc.)
  isCurrent?: boolean;    // Is this the current period?
  isSpecial?: boolean;    // Special styling (e.g., Sunday)
  events?: CalendarEvent[]; // Associated events
}

export interface CircleConfig {
  centerX: number;
  centerY: number;
  radius: number;
  innerRadius: number;    // For ring thickness
  items: CircleItem[];
  colorScheme: (item: CircleItem) => string;
  direction: number;      // 1 = CW, -1 = CCW
  onItemClick: (item: CircleItem) => void;
  onItemHover?: (item: CircleItem | null) => void;
}

export class CircleRenderer {
  private hoveredIndex: number | null = null;
  
  /**
   * Render a complete circle with sectors
   */
  render(group: SVGElement, config: CircleConfig): void {
    const { items, centerX, centerY, radius, innerRadius } = config;
    
    items.forEach((item, index) => {
      const sectorGroup = this.createSectorGroup(item, index, config);
      const sector = this.createSector(item, index, config);
      const label = this.createLabel(item, index, config);
      
      sectorGroup.appendChild(sector);
      group.appendChild(sectorGroup);
      // Labels in separate layer
    });
  }
  
  private createSectorGroup(item: CircleItem, index: number, config: CircleConfig): SVGGElement;
  private createSector(item: CircleItem, index: number, config: CircleConfig): SVGPathElement;
  private createLabel(item: CircleItem, index: number, config: CircleConfig): SVGTextElement;
  private setupEventHandlers(sector: SVGPathElement, item: CircleItem, config: CircleConfig): void;
  private calculateAngles(index: number, totalItems: number, direction: number): { start: number; end: number; mid: number };
}
```

### Phase 3: Refactor ZoomMode to Use CircleRenderer

**File:** `src/calendar/ZoomMode.ts`

```typescript
// BEFORE (1500+ lines of duplicated code)
private renderYearCircle = (group: SVGElement, state: ZoomState): SVGElement => {
  // 200 lines of code...
}

private renderMonthCircle = (group: SVGElement, state: ZoomState): SVGElement => {
  // 300 lines of similar code...
}

private renderWeekCircle = (group: SVGElement, state: ZoomState): SVGElement => {
  // 250 lines of similar code...
}

private renderDayCircle = (group: SVGElement, state: ZoomState): SVGElement => {
  // 200 lines of similar code...
}

// AFTER (clean, DRY code)
private renderYearCircle = (group: SVGElement, state: ZoomState): SVGElement => {
  const items: CircleItem[] = MONTHS.map((name, index) => ({
    index,
    label: name,
    value: index,
    isCurrent: state.year === new Date().getFullYear() && index === new Date().getMonth(),
  }));
  
  this.circleRenderer.render(group, {
    centerX: 0,
    centerY: 0,
    radius: 320,
    innerRadius: 224,
    items,
    colorScheme: (item) => `hsl(${(item.index * 30) % 360}, 70%, 60%)`,
    direction: this.direction,
    onItemClick: (item) => this.navigateToLevel("month", { month: item.value }),
    onItemHover: (item) => this.handleHover(item),
  });
  
  return group;
}

// Similar 20-30 line implementations for other circles
```

### Phase 4: Extract Common Mode Functionality

**File:** `src/calendar/BaseMode.ts`

```typescript
/**
 * Base class for all calendar modes (Classic, Rings, Zoom)
 * Provides common functionality:
 * - SVG initialization
 * - Event handling patterns
 * - Direction control (CW/CCW)
 * - Event data management
 */

export abstract class BaseMode {
  protected container: HTMLElement;
  protected svg!: SVGElement;
  protected direction: number = 1; // CW/CCW
  protected eventData: Record<string, CalendarEvent[]> = {};
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeSVG();
  }
  
  protected abstract render(): void;
  
  // Common SVG initialization
  protected initializeSVG(): void { /* shared logic */ }
  
  // Common direction control
  toggleDirection(): number { /* shared logic */ }
  setDirection(direction: number): void { /* shared logic */ }
  applyDirectionMirroring(angle: number): number { /* shared logic */ }
  
  // Common event handling
  setEvents(events: CalendarEvent[]): void { /* shared logic */ }
  
  // Common cleanup
  destroy(): void { /* shared logic */ }
}
```

### Phase 5: Create Shared Animation Utilities

**File:** `src/utils/animation.ts`

```typescript
/**
 * Animation utilities shared across modes
 */

export type EasingFunction = (t: number) => number;

export const Easing = {
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  linear: (t: number) => t,
};

export interface AnimationConfig {
  duration: number;
  easing: EasingFunction;
  onUpdate: (progress: number) => void;
  onComplete?: () => void;
}

export class Animator {
  private animationFrame: number | null = null;
  private startTime: number = 0;
  
  start(config: AnimationConfig): void;
  stop(): void;
  isAnimating(): boolean;
}
```

## Implementation Plan

### Sprint 1: Foundation (High Priority)
1. ✅ Create `src/utils/svg.ts` with SVG utilities
2. ✅ Create `src/utils/animation.ts` with animation helpers
3. ✅ Write unit tests for utilities
4. ✅ Update existing code to use new utilities (non-breaking)

### Sprint 2: Circle Renderer (High Priority)
1. ✅ Create `src/calendar/CircleRenderer.ts`
2. ✅ Write comprehensive unit tests
3. ✅ Refactor `ZoomMode.renderYearCircle` to use CircleRenderer
4. ✅ Verify no regressions, test thoroughly
5. ✅ Refactor remaining three circle methods

### Sprint 3: Base Mode (Medium Priority)
1. ✅ Create `src/calendar/BaseMode.ts`
2. ✅ Extract common logic from ZoomMode, RingsMode, CalendarRenderer
3. ✅ Update mode classes to extend BaseMode
4. ✅ Test all three modes thoroughly

### Sprint 4: Polish & Documentation (Medium Priority)
1. ✅ Update all JSDoc comments
2. ✅ Create architectural documentation
3. ✅ Update README with new structure
4. ✅ Performance profiling and optimization

## Expected Benefits

### Code Reduction
- **ZoomMode**: ~1500 lines → ~800 lines (47% reduction)
- **Overall**: Eliminate ~2000 lines of duplicated code
- **Test coverage**: Easier to test with focused utilities

### Maintainability
- Single source of truth for circle rendering
- Easier to add new circle types or modes
- Consistent behavior across all views

### Performance
- Optimized, reusable SVG creation
- Efficient event handling with delegation
- Faster animation with shared utilities

### Extensibility
- Easy to add new zoom levels (e.g., decade view, hour view)
- Simple to create new calendar modes
- Plugin-friendly architecture

## Risk Mitigation

1. **Breaking Changes**: Phase 1-2 are non-breaking, modes continue working
2. **Testing**: Comprehensive tests at each phase before proceeding
3. **Rollback**: Each phase is a separate commit, easy to revert
4. **User Impact**: No UI changes, purely internal refactoring

## Success Metrics

- [ ] All existing tests pass
- [ ] Code coverage remains >80%
- [ ] Build time improves by >10%
- [ ] Bundle size reduces by >5%
- [ ] No visual regressions in any mode
- [ ] Performance metrics maintained or improved

## Timeline

- **Phase 1**: 2-3 hours
- **Phase 2**: 4-6 hours
- **Phase 3**: 3-4 hours
- **Phase 4**: 2-3 hours

**Total Estimated Effort**: 11-16 hours

## Next Steps

1. Review and approve this refactoring plan
2. Create feature branch: `refactor/shared-utilities`
3. Begin Phase 1: SVG and Animation utilities
4. Incremental commits with tests at each step
5. PR review after each major phase

---

*This refactoring will significantly improve code quality, maintainability, and developer experience while maintaining 100% backward compatibility and zero user-facing changes.*

