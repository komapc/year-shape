/**
 * Week modal component for displaying Soviet-style diary view
 */

import type { CalendarEvent } from '../types';
import { DAYS_OF_WEEK } from '../utils/constants';
import { getWeekStartDate, formatDate, openGoogleCalendarForWeek } from '../utils/date';
import { getElement, createElement, makeAccessible } from '../utils/dom';
import { router } from '../utils/router';

export class WeekModal {
  private modal: HTMLElement;
  private weekTitle: HTMLElement;
  private daysLeft: HTMLElement;
  private daysRight: HTMLElement;
  private closeButton: HTMLElement;
  private openInGoogleBtn: HTMLElement;
  private currentWeekIndex: number = 0;

  constructor() {
    this.modal = getElement('weekModal');
    this.weekTitle = getElement('weekTitle');
    this.daysLeft = getElement('daysLeft');
    this.daysRight = getElement('daysRight');
    this.closeButton = getElement('closeModal');
    this.openInGoogleBtn = getElement('openInGoogle');

    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners = (): void => {
    // Close button
    makeAccessible(this.closeButton, this.close, 'Close week details modal');

    // Open in Google Calendar button
    makeAccessible(
      this.openInGoogleBtn,
      () => openGoogleCalendarForWeek(this.currentWeekIndex),
      'Open this week in Google Calendar'
    );

    // Click outside to close
    this.modal.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
        // Clear URL hash to sync with UI state
        router.navigate('');
      }
    });
  };

  /**
   * Open the modal with week details
   */
  open = (weekIndex: number, events: CalendarEvent[]): void => {
    this.currentWeekIndex = weekIndex;
    const weekStartDate = getWeekStartDate(weekIndex);
    this.weekTitle.textContent = `Week ${weekIndex + 1} - ${formatDate(weekStartDate)}`;

    this.renderDays(events);
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');

    // Focus trap
    this.closeButton.focus();
  };

  /**
   * Close the modal
   */
  close = (): void => {
    this.modal.classList.add('hidden');
    this.modal.classList.remove('flex');
  };

  /**
   * Check if modal is open
   */
  isOpen = (): boolean => {
    return !this.modal.classList.contains('hidden');
  };

  /**
   * Render days in Soviet diary layout (4 left, 3 right)
   * Starting from Sunday
   */
  private renderDays = (events: CalendarEvent[]): void => {
    this.daysLeft.innerHTML = '';
    this.daysRight.innerHTML = '';

    // Sunday (0), Monday (1), Tuesday (2), Wednesday (3) on left
    // Thursday (4), Friday (5), Saturday (6) on right
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayCard = this.createDayCard(dayIndex, events);
      
      if (dayIndex < 4) {
        this.daysLeft.appendChild(dayCard);
      } else {
        this.daysRight.appendChild(dayCard);
      }
    }
  };

  /**
   * Create a day card
   */
  private createDayCard = (dayIndex: number, allEvents: CalendarEvent[]): HTMLElement => {
    const card = createElement('div', [
      'day-card',
      'bg-gradient-to-b',
      'from-white/5',
      'to-white/3',
      'rounded-lg',
      'p-4',
      'border',
      'border-dark-border',
      'min-w-[140px]',
    ]);

    // Day header
    const header = createElement('h4', [
      'text-sm',
      'font-semibold',
      'mb-3',
      'text-gray-200',
    ]);
    header.textContent = DAYS_OF_WEEK[dayIndex];
    card.appendChild(header);

    // Filter events for this day
    const dayEvents = allEvents.filter((event) => event._day === dayIndex);

    if (dayEvents.length === 0) {
      const noEvents = createElement('div', [
        'text-xs',
        'text-dark-muted',
        'italic',
      ]);
      noEvents.textContent = 'No events';
      card.appendChild(noEvents);
    } else {
      dayEvents.forEach((event) => {
        const eventItem = this.createEventItem(event);
        card.appendChild(eventItem);
      });
    }

    return card;
  };

  /**
   * Create an event item
   */
  private createEventItem = (event: CalendarEvent): HTMLElement => {
    const item = createElement('div', [
      'event-item',
      'bg-primary-500/10',
      'border',
      'border-primary-500/20',
      'rounded-md',
      'p-2',
      'mb-2',
      'text-xs',
    ]);

    const title = createElement('div', ['font-medium', 'text-gray-100', 'mb-1']);
    title.textContent = event.summary;
    item.appendChild(title);

    if (event.start) {
      const time = createElement('div', ['text-dark-muted', 'text-xs']);
      const timeStr = new Date(event.start).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      time.textContent = timeStr;
      item.appendChild(time);
    }

    return item;
  };
}

