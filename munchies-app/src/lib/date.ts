/**
 * @module lib/date
 * @description Date and time formatting with Africa/Cairo timezone, supporting ISO strings, Dates, numbers, and Firestore Timestamps.
 */

import type { RestaurantSettings } from '@/types';

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
  if (settings.isManualClosed) return false;
  if (settings.orderAcceptanceEnabled === false) return false;

  const hours = settings.workingHours;
  if (!hours) return true;

  const now = new Date();
  const cairoFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = cairoFormatter.formatToParts(now);
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value;
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  const currentMinutes = hour * 60 + minute;

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const dayIndex = weekdayStr ? dayMap[weekdayStr] ?? now.getDay() : now.getDay();
  const todaySchedule = hours[dayIndex];

  if (!todaySchedule || !todaySchedule.isOpen) return false;

  const [openH, openM] = todaySchedule.openTime.split(':').map(Number);
  const [closeH, closeM] = todaySchedule.closeTime.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}
