/**
 * @fileoverview RingsMode - Multi-ring calendar visualization
 * 
 * RingsMode provides a layered, customizable calendar view where different
 * time periods (seasons, months, weeks, holidays) are displayed as concentric rings.
 * 
 * Features:
 * - 5 available ring types: Seasons, Gregorian Months, Hebrew Months, Weeks, Holidays
 * - Drag-and-drop layer reordering
 * - Toggle visibility for each ring
 * - Adjustable corner radius (square to circle)
 * - Configurable ring width
 * - Rotation direction control (CW/CCW)
 * - Settings persistence to localStorage
 * 
 * Architecture:
 * - RingSystem handles the actual rendering and layout
 * - Ring implementations define the data for each ring type
 * - RingsMode coordinates UI controls and settings
 * 
 * @module calendar/RingsMode
 */

import { RingSystem } from './rings/RingSystem';
import {
  SeasonsRing,
  MonthsRing,
  HebrewMonthsRing,
  WeeksRing,
  HolidaysRing,
} from './rings/ringImplementations';
import { Ring } from './rings/Ring';

/**
 * Metadata for a single ring layer - display information
 */
export interface RingMetadata {
  label: string;  // Display name (e.g., "Seasons")
  color: string;  // Primary color in hex format
  icon: string;   // Emoji icon for UI
}

/**
 * RingsMode class - manages the multi-ring calendar visualization
 * 
 * Coordinates between the RingSystem (rendering) and UI controls (user input),
 * providing a complete interactive experience with drag-and-drop layer management.
 * 
 * @class
 */
export class RingsMode {
  private ringSystem: RingSystem;
  private ringMetadata: Record<string, RingMetadata> = {
    seasons: { label: 'Seasons', color: '#667eea', icon: '🌸' },
    holidays: { label: 'Holidays', color: '#fdcb6e', icon: '🎊' },
    months: { label: 'Gregorian Months', color: '#f093fb', icon: '📅' },
    hebrew: { label: 'Hebrew Months', color: '#4facfe', icon: '✡️' },
    weeks: { label: 'Weeks', color: '#43e97b', icon: '📆' },
  };

  constructor(
    svgContainer: HTMLElement,
    centerX: number = 350,
    centerY: number = 350
  ) {
    const svgElement = svgContainer.querySelector('svg');
    if (!svgElement) {
      throw new Error('SVG element not found in container');
    }

    const ringsContainer = svgElement.querySelector('#rings-container') as SVGElement;
    if (!ringsContainer) {
      throw new Error('rings-container element not found in SVG');
    }

    this.ringSystem = new RingSystem(ringsContainer, centerX, centerY);
  }

  /**
   * Initialize rings mode from saved settings
   */
  initializeFromSettings(): void {
    // Load saved settings
    const savedSettings = this.ringSystem.loadSettings();

    // Add rings (from outermost to innermost)
    const defaultOrder = ['holidays', 'weeks', 'hebrew', 'months', 'seasons'];
    const ringOrder =
      savedSettings && savedSettings.ringOrder
        ? savedSettings.ringOrder
        : defaultOrder;

    // Create ring instances
    const ringInstances: Record<string, Ring> = {
      holidays: new HolidaysRing(),
      weeks: new WeeksRing(),
      hebrew: new HebrewMonthsRing(),
      months: new MonthsRing(),
      seasons: new SeasonsRing(),
    };

    // Add rings in saved order
    ringOrder.forEach((ringName) => {
      const ring = ringInstances[ringName];
      if (ring) {
        // Get saved visibility or use default
        const defaultVisible = ringName !== 'holidays'; // Holidays hidden by default
        const visible =
          savedSettings && savedSettings.ringVisibility
            ? savedSettings.ringVisibility[ringName] ?? defaultVisible
            : defaultVisible;
        this.ringSystem.addRing(ring, visible);
      }
    });

    // Apply saved settings to UI controls
    if (savedSettings) {
      const cornerRadiusInput = document.getElementById('cornerRadius') as HTMLInputElement;
      const cornerValue = document.getElementById('cornerValue');
      if (cornerRadiusInput && cornerValue) {
        cornerRadiusInput.value = Math.round(savedSettings.cornerRadius * 100).toString();
        cornerValue.textContent = `${Math.round(savedSettings.cornerRadius * 100)}%`;
      }

      const ringWidthInput = document.getElementById('ringWidth') as HTMLInputElement;
      const widthValue = document.getElementById('widthValue');
      if (ringWidthInput && widthValue) {
        ringWidthInput.value = savedSettings.ringWidth.toString();
        widthValue.textContent = `${savedSettings.ringWidth}px`;
      }

      const directionToggle = document.getElementById('directionToggle') as HTMLButtonElement;
      if (directionToggle) {
        const directionText = savedSettings.direction === 1 ? 'CW' : 'CCW';
        const directionIcon = savedSettings.direction === 1 ? '↻' : '↺';
        directionToggle.innerHTML = `${directionIcon} ${directionText}`;
        if (savedSettings.direction === -1) {
          directionToggle.style.background = 'rgba(100,200,255,0.3)';
        }
      }
    }

    // Initial layout
    this.ringSystem.layout();
  }

  /**
   * Set corner radius (0-1)
   */
  setCornerRadius(radius: number): void {
    this.ringSystem.setCornerRadius(radius);
  }

  /**
   * Set ring width in pixels
   */
  setRingWidth(width: number): void {
    this.ringSystem.setRingWidth(width);
  }

  /**
   * Get maximum allowed ring width
   */
  getMaxRingWidth(): number {
    return this.ringSystem.getMaxRingWidth();
  }

  /**
   * Toggle rotation direction (CW/CCW)
   */
  toggleDirection(): 1 | -1 {
    const direction = this.ringSystem.toggleDirection();
    return direction as 1 | -1;
  }

  /**
   * Rotate year by 90 degrees
   */
  rotateYear(): void {
    this.ringSystem.rotateYear();
  }

  /**
   * Get ring system for layer controls
   */
  getRingSystem(): RingSystem {
    return this.ringSystem;
  }

  /**
   * Get ring metadata for layer controls
   */
  getRingMetadata(): Record<string, RingMetadata> {
    return this.ringMetadata;
  }

  /**
   * Initialize layer controls (drag and drop, visibility toggles)
   */
  initializeLayerControls(): void {
    const layerList = document.getElementById('layerList');
    if (!layerList) return;

    const renderLayerControls = (): void => {
      layerList.innerHTML = '';
      const ringOrder = this.ringSystem.getRingOrder();
      const ringVisibility = this.ringSystem.getRingVisibility();

      ringOrder.forEach((ringName) => {
        const metadata = this.ringMetadata[ringName];
        if (!metadata) return;

        const isVisible = ringVisibility[ringName] ?? true;

        const li = document.createElement('li');
        li.className = 'layer-item';
        li.setAttribute('draggable', 'true');
        li.setAttribute('data-ring', ringName);

        li.innerHTML = `
          <span class="drag-handle">⋮⋮</span>
          <input 
            type="checkbox" 
            class="layer-checkbox" 
            ${isVisible ? 'checked' : ''} 
            data-ring="${ringName}"
          />
          <span class="layer-name">${metadata.icon} ${metadata.label}</span>
          <div class="layer-color" style="background: ${metadata.color};"></div>
        `;

        layerList.appendChild(li);
      });

      // Add event listeners
      attachLayerEventListeners();
    };

    const attachLayerEventListeners = (): void => {
      // Checkbox toggles
      document.querySelectorAll('.layer-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          const ringName = target.getAttribute('data-ring');
          if (ringName) {
            this.ringSystem.setRingVisibility(ringName, target.checked);
          }
        });
      });

      // Drag and drop
      const items = document.querySelectorAll('.layer-item');
      let draggedItem: HTMLElement | null = null;

      items.forEach((item) => {
        item.addEventListener('dragstart', (e) => {
          draggedItem = item as HTMLElement;
          item.classList.add('dragging');
          const dragEvent = e as DragEvent;
          if (dragEvent.dataTransfer) {
            dragEvent.dataTransfer.effectAllowed = 'move';
          }
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          draggedItem = null;
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (draggedItem && draggedItem !== item) {
            const rect = item.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const dragEvent = e as DragEvent;
            if (dragEvent.clientY !== undefined && dragEvent.clientY < midpoint) {
              item.classList.add('drag-over');
            } else {
              item.classList.remove('drag-over');
            }
          }
        });

        item.addEventListener('dragleave', () => {
          item.classList.remove('drag-over');
        });

        item.addEventListener('drop', (e) => {
          e.preventDefault();
          item.classList.remove('drag-over');

          if (draggedItem && draggedItem !== item) {
            const allItems = Array.from(layerList.children) as HTMLElement[];
            const draggedIndex = allItems.indexOf(draggedItem);
            const targetIndex = allItems.indexOf(item as HTMLElement);

            if (draggedIndex < targetIndex) {
              item.after(draggedItem);
            } else {
              item.before(draggedItem);
            }

            // Update ring system order
            const newOrder = Array.from(layerList.children)
              .map((li) => li.getAttribute('data-ring'))
              .filter((name): name is string => name !== null);
            this.ringSystem.reorderRings(newOrder);
          }
        });
      });
    };

    renderLayerControls();
  }

  /**
   * Destroy and clean up
   */
  destroy(): void {
    // Clean up if needed
  }
}
