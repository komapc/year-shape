/**
 * @fileoverview Rings Mode Entry Point
 *
 * This is the entry point for the rings calendar mode.
 * It initializes the RingsMode renderer and sets up UI controls.
 */

import { RingsMode } from './calendar/RingsMode';
import { loadSettings, updateSetting, type CalendarMode } from './utils/settings';
import { navigateToMode } from './utils/modeNavigation';

/**
 * Initialize rings mode when DOM is ready
 */
const initRingsMode = (): void => {
  try {
    // Get SVG container
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
      throw new Error('canvas-container element not found');
    }

    // Create rings mode instance
    const ringsMode = new RingsMode(canvasContainer, 350, 350);

    // Initialize from saved settings
    ringsMode.initializeFromSettings();

    // Setup UI controls
    setupUIControls(ringsMode);

    console.log('Rings mode initialized successfully');
  } catch (error) {
    console.error('Failed to initialize rings mode:', error);
    // Alert removed per user request - using console.error only
  }
};

/**
 * Setup UI controls and event handlers
 */
const setupUIControls = (ringsMode: RingsMode): void => {
  // Corner radius slider
  const cornerInput = document.getElementById('cornerRadius') as HTMLInputElement;
  const cornerValue = document.getElementById('cornerValue') as HTMLElement;

  if (cornerInput && cornerValue) {
    cornerInput.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      cornerValue.textContent = `${value}%`;
      ringsMode.setCornerRadius(value / 100);
    });
  }

  // Ring width slider
  const widthInput = document.getElementById('ringWidth') as HTMLInputElement;
  const widthValue = document.getElementById('widthValue') as HTMLElement;

  if (widthInput && widthValue) {
    // Update max value based on current visible rings
    const updateMaxWidth = (): void => {
      const maxWidth = Math.floor(ringsMode.getMaxRingWidth());
      const currentValue = parseInt(widthInput.value);
      widthInput.max = maxWidth.toString();
      // Clamp current value if it exceeds new max
      if (currentValue > maxWidth) {
        widthInput.value = maxWidth.toString();
        widthValue.textContent = `${maxWidth}px`;
        ringsMode.setRingWidth(maxWidth);
      }
    };

    // Initial max width update
    updateMaxWidth();

    widthInput.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      const maxWidth = Math.floor(ringsMode.getMaxRingWidth());
      const clampedValue = Math.min(value, maxWidth);
      widthValue.textContent = `${clampedValue}px`;
      ringsMode.setRingWidth(clampedValue);
      // Update max in case visibility changed
      updateMaxWidth();
    });

    // Update max width when ring visibility changes
    const originalInitializeLayerControls = ringsMode.initializeLayerControls.bind(ringsMode);
    ringsMode.initializeLayerControls = () => {
      originalInitializeLayerControls();
      // After visibility changes, update max width
      setTimeout(updateMaxWidth, 100);
    };
  }

  // Direction toggle
  const directionToggle = document.getElementById('directionToggle') as HTMLButtonElement;

  if (directionToggle) {
    directionToggle.addEventListener('click', () => {
      const newDirection = ringsMode.toggleDirection();
      const directionText = newDirection === 1 ? 'CW' : 'CCW';
      const directionIcon = newDirection === 1 ? '↻' : '↺';
      directionToggle.innerHTML = `${directionIcon} ${directionText}`;
      directionToggle.style.background =
        newDirection === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(100,200,255,0.3)';
    });
  }

  // Rotate year button
  const rotateYearBtn = document.getElementById('rotateYear') as HTMLButtonElement;

  if (rotateYearBtn) {
    rotateYearBtn.addEventListener('click', () => {
      ringsMode.rotateYear();
      rotateYearBtn.style.transform = 'rotate(90deg)';
      setTimeout(() => {
        rotateYearBtn.style.transform = '';
      }, 200);
    });
  }

  // Layer controls toggle
  const toggleLayerControls = document.getElementById('toggleLayerControls');
  const layerControlsContent = document.getElementById('layerControlsContent');
  const layerControlsToggleText = document.getElementById('layerControlsToggleText');
  let layerControlsVisible = false; // Hidden by default

  if (toggleLayerControls && layerControlsContent && layerControlsToggleText) {
    toggleLayerControls.addEventListener('click', () => {
      layerControlsVisible = !layerControlsVisible;
      if (layerControlsVisible) {
        layerControlsContent.style.display = 'block';
        layerControlsToggleText.textContent = '▼ Hide';
      } else {
        layerControlsContent.style.display = 'none';
        layerControlsToggleText.textContent = '▶ Show';
      }
    });
  }

  // Mode selector (radio buttons in header)
  const headerModeOldRadio = document.getElementById('headerModeOld') as HTMLInputElement;
  const headerModeRingsRadio = document.getElementById('headerModeRings') as HTMLInputElement;
  const headerModeZoomRadio = document.getElementById('headerModeZoom') as HTMLInputElement;

  const handleModeChange = (selectedMode: CalendarMode): void => {
    // Save mode preference
    updateSetting('mode', selectedMode);

    // Navigate to selected mode
    navigateToMode(selectedMode);
  };

  if (headerModeOldRadio) {
    headerModeOldRadio.addEventListener('change', () => {
      if (headerModeOldRadio.checked) {
        handleModeChange('old');
      }
    });
  }

  if (headerModeRingsRadio) {
    headerModeRingsRadio.addEventListener('change', () => {
      if (headerModeRingsRadio.checked) {
        handleModeChange('rings');
      }
    });
  }

  if (headerModeZoomRadio) {
    headerModeZoomRadio.addEventListener('change', () => {
      if (headerModeZoomRadio.checked) {
        handleModeChange('zoom');
      }
    });
  }

  // Load saved mode preference
  const settings = loadSettings();
  if (settings.mode) {
    if (settings.mode === 'old' && headerModeOldRadio) {
      headerModeOldRadio.checked = true;
    } else if (settings.mode === 'zoom' && headerModeZoomRadio) {
      headerModeZoomRadio.checked = true;
    } else if (headerModeRingsRadio) {
      headerModeRingsRadio.checked = true;
    }
  }

  // Layer controls (drag and drop, visibility toggles)
  ringsMode.initializeLayerControls();
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRingsMode);
} else {
  initRingsMode();
}
