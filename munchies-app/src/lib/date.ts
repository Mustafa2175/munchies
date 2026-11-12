/**
 * @module lib/date
 * @description Date and time formatting with Africa/Cairo timezone, supporting ISO strings, Dates, numbers, and Firestore Timestamps.
 */

import type { RestaurantSettings } from '@/types';
import { evaluateRestaurantStatus } from '@/lib/restaurantOperations';

export const TIMEZONE = 'Africa/Cairo';

/**
 * Safely parses any date input including Firestore Timestamps ({ toDate } or { seconds }).
 */
export function parseDate(dateInput: unknown): Date | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    return Number.isNaN(dateInput.getTime()) ? null : dateInput;
  }

  if (typeof dateInput === 'object' && dateInput !== null) {
    const maybeTimestamp = dateInput as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') {
      const d = maybeTimestamp.toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof maybeTimestamp.seconds === 'number') {
      const d = new Date(maybeTimestamp.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function formatDate(dateInput: unknown, locale: 'ar' | 'en' = 'ar'): string {
  const date = parseDate(dateInput);
  if (!date) return '-';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-EG' : 'ar-EG', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatTime(dateInput: unknown, locale: 'ar' | 'en' = 'ar'): string {
  const date = parseDate(dateInput);
  if (!date) return '-';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-EG' : 'ar-EG', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

export function formatDateTime(dateInput: unknown, locale: 'ar' | 'en' = 'ar'): string {
  const date = parseDate(dateInput);
  if (!date) return '-';
  return `${formatDate(date, locale)} - ${formatTime(date, locale)}`;
}

export function isRestaurantOpen(settings?: RestaurantSettings | null): boolean {
  if (!settings) return true;
  if ((settings as any).orderAcceptanceEnabled === false) return false;
  return evaluateRestaurantStatus(settings as any, new Date()).isOpen;
}
