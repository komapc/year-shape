/**
 * Application entry point
 */

import './style.css';
import { CalendarApp } from './calendar/CalendarApp';

// Initialize app when DOM is ready
const initApp = (): void => {
  try {
    new CalendarApp();
    console.log('Year Shape Calendar initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    alert('Failed to load calendar. Please refresh the page.');
  }
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

