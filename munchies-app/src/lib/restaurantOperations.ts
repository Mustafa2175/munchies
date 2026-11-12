/**
 * @module lib/restaurantOperations
 * @description Single source of truth for restaurant operating modes, Africa/Cairo schedule
 * evaluation (including overnight hours), manual override rules, and next-opening computation.
 * Shared across Admin Operations, Admin Dashboard, Customer Storefront, Checkout, and Order Validation.
 */

export const CAIRO_TIMEZONE = 'Africa/Cairo';

export type OperatingMode = 'automatic' | 'manual';

export type OverrideReopenCondition = 'until_manual_reopen' | 'until_next_open';

export type RestaurantStatusReason =
  | 'manual_open'
  | 'manual_closed'
  | 'scheduled_open'
  | 'scheduled_closed'
  | 'manual_override';

export interface WorkingHoursEntry {
  day: string;
  open: string;   // "HH:mm" (24h)
  close: string;  // "HH:mm" (24h)
  active: boolean;
}

export interface NormalizedOperationsSettings {
  operatingMode: OperatingMode;
  openingTime: string; // "HH:mm"
  closingTime: string; // "HH:mm"
  manualOpen: boolean;
  manualOverrideClosed: boolean;
  manualOverrideUntil: string | null;
  closureMessage: string;
  useCustomDailySchedule: boolean;
  workingHours: WorkingHoursEntry[];
}

export interface EvaluatedRestaurantStatus {
  isOpen: boolean;
  operatingMode: OperatingMode;
  reason: RestaurantStatusReason;
  statusLabel: string;
  statusDescription: string;
  customerMessage: string;
  nextOpeningText: string | null;
  nextOpeningIso: string | null;
  scheduleText: string | null;
  crossesMidnight: boolean;
}

export interface CairoTimeParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  weekdayIndex: number; // 0 = Sunday .. 6 = Saturday
  hour: number; // 0-23
  minute: number; // 0-59
  minutesSinceMidnight: number; // 0-1439
}

export const DEFAULT_OPENING_TIME = '12:00';
export const DEFAULT_CLOSING_TIME = '03:00';
export const DEFAULT_CLOSURE_MESSAGE =
  'معلش، إحنا قافلين دلوقتي ومبنستقبلش طلبات جديدة. هنرجع نفتح قريب!';

export const DAY_INDEX_TO_ARABIC: string[] = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export const DEFAULT_SCHEDULE: WorkingHoursEntry[] = DAY_INDEX_TO_ARABIC.map((day) => ({
  day,
  open: DEFAULT_OPENING_TIME,
  close: DEFAULT_CLOSING_TIME,
  active: true,
}));

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function normalizeTimeString(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (TIME_REGEX.test(trimmed)) return trimmed;
  }
  return fallback;
}

export function parseTimeToMinutes(time: string): number {
  const safe = normalizeTimeString(time, '00:00');
  const [h, m] = safe.split(':').map(Number);
  return h * 60 + m;
}

export function formatTimeArabic12h(time24: string): string {
  const safe = normalizeTimeString(time24, '12:00');
  const [rawH, rawM] = safe.split(':').map(Number);
  const period = rawH >= 12 ? 'م' : 'ص';
  const hour12 = rawH % 12 === 0 ? 12 : rawH % 12;
  const minStr = String(rawM).padStart(2, '0');
  return `${hour12}:${minStr} ${period}`;
}

/**
 * Extracts exact wall-clock date & time components in Africa/Cairo timezone.
 */
export function getCairoTimeParts(date: Date = new Date()): CairoTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CAIRO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || '';

  const year = parseInt(get('year'), 10);
  const month = parseInt(get('month'), 10);
  const day = parseInt(get('day'), 10);
  const weekdayStr = get('weekday');
  const rawHour = parseInt(get('hour'), 10);
  const hour = rawHour % 24;
  const minute = parseInt(get('minute'), 10);

  return {
    year,
    month,
    day,
    weekdayIndex: WEEKDAY_MAP[weekdayStr] ?? 0,
    hour,
    minute,
    minutesSinceMidnight: hour * 60 + minute,
  };
}

/**
 * Converts an Africa/Cairo wall-clock date/time into an exact UTC Date instance.
 */
export function cairoWallClockToDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const normalizedTargetMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const targetMinutesTotal = Math.floor(normalizedTargetMs / 60000);
  let utcMs = normalizedTargetMs;

  for (let i = 0; i < 3; i++) {
    const p = getCairoTimeParts(new Date(utcMs));
    const currentWallMinutesTotal = Math.floor(
      Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, 0, 0) / 60000
    );
    const diffMinutes = targetMinutesTotal - currentWallMinutesTotal;
    if (diffMinutes === 0) break;
    utcMs += diffMinutes * 60000;
  }

  return new Date(utcMs);
}

/**
 * Normalizes raw Firestore `settings/restaurant` or store objects into the canonical format,
 * preserving backward compatibility with legacy documents.
 */
export function normalizeRestaurantSettings(raw?: Record<string, any> | null): NormalizedOperationsSettings {
  if (!raw) {
    return {
      operatingMode: 'automatic',
      openingTime: DEFAULT_OPENING_TIME,
      closingTime: DEFAULT_CLOSING_TIME,
      manualOpen: true,
      manualOverrideClosed: false,
      manualOverrideUntil: null,
      closureMessage: DEFAULT_CLOSURE_MESSAGE,
      useCustomDailySchedule: false,
      workingHours: DEFAULT_SCHEDULE,
    };
  }

  const operatingMode: OperatingMode =
    raw.operatingMode === 'manual' ? 'manual' : 'automatic';

  const legacyWorkingHours = Array.isArray(raw.workingHours) && raw.workingHours.length > 0
    ? (raw.workingHours as WorkingHoursEntry[])
    : DEFAULT_SCHEDULE;

  const firstActiveLegacy = legacyWorkingHours.find((e) => e?.active) || legacyWorkingHours[0];
  const openingTime = normalizeTimeString(
    raw.openingTime ?? firstActiveLegacy?.open,
    DEFAULT_OPENING_TIME
  );
  const closingTime = normalizeTimeString(
    raw.closingTime ?? firstActiveLegacy?.close,
    DEFAULT_CLOSING_TIME
  );

  const closureMessage =
    typeof raw.closureMessage === 'string' && raw.closureMessage.trim()
      ? raw.closureMessage.trim()
      : typeof raw.closureMessage?.ar === 'string' && raw.closureMessage.ar.trim()
      ? raw.closureMessage.ar.trim()
      : DEFAULT_CLOSURE_MESSAGE;

  const manualOpen =
    typeof raw.manualOpen === 'boolean' ? raw.manualOpen : !raw.isManualClosed;

  const manualOverrideClosed =
    operatingMode === 'automatic'
      ? typeof raw.manualOverrideClosed === 'boolean'
        ? raw.manualOverrideClosed
        : Boolean(raw.isManualClosed)
      : false;

  const manualOverrideUntil =
    operatingMode === 'automatic' &&
    manualOverrideClosed &&
    typeof raw.manualOverrideUntil === 'string' &&
    !Number.isNaN(Date.parse(raw.manualOverrideUntil))
      ? raw.manualOverrideUntil
      : null;

  return {
    operatingMode,
    openingTime,
    closingTime,
    manualOpen,
    manualOverrideClosed,
    manualOverrideUntil,
    closureMessage,
    useCustomDailySchedule: Boolean(raw.useCustomDailySchedule),
    workingHours: legacyWorkingHours,
  };
}

/**
 * Formats an opening target relative to `now` in Africa/Cairo ("اليوم الساعة ...", "غداً الساعة ...", or day name).
 */
export function formatRelativeOpeningLabel(targetDate: Date, now: Date = new Date()): string {
  const nowParts = getCairoTimeParts(now);
  const targetParts = getCairoTimeParts(targetDate);

  const nowDayEpoch = Math.floor(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day) / 86400000);
  const targetDayEpoch = Math.floor(
    Date.UTC(targetParts.year, targetParts.month - 1, targetParts.day) / 86400000
  );
  const dayDiff = targetDayEpoch - nowDayEpoch;

  const timeStr = formatTimeArabic12h(
    `${String(targetParts.hour).padStart(2, '0')}:${String(targetParts.minute).padStart(2, '0')}`
  );

  if (dayDiff === 0) return `اليوم الساعة ${timeStr}`;
  if (dayDiff === 1) return `غداً الساعة ${timeStr}`;
  const dayName = DAY_INDEX_TO_ARABIC[targetParts.weekdayIndex] || '';
  return `${dayName ? `يوم ${dayName} ` : ''}الساعة ${timeStr}`;
}

/**
 * Computes the next scheduled opening Date & Arabic label for Automatic Mode.
 */
export function computeNextScheduledOpening(
  settings: NormalizedOperationsSettings,
  now: Date = new Date()
): { date: Date; iso: string; label: string } | null {
  const cairo = getCairoTimeParts(now);

  if (!settings.useCustomDailySchedule) {
    const openMin = parseTimeToMinutes(settings.openingTime);
    const [openH, openM] = settings.openingTime.split(':').map(Number);
    const dayOffset = cairo.minutesSinceMidnight < openMin ? 0 : 1;
    const nextDate = cairoWallClockToDate(
      cairo.year,
      cairo.month,
      cairo.day + dayOffset,
      openH,
      openM
    );
    return {
      date: nextDate,
      iso: nextDate.toISOString(),
      label: formatRelativeOpeningLabel(nextDate, now),
    };
  }

  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const targetWeekday = (cairo.weekdayIndex + dayOffset) % 7;
    const dayName = DAY_INDEX_TO_ARABIC[targetWeekday];
    const entry = settings.workingHours.find((e) => e.day === dayName);
    if (!entry || !entry.active) continue;

    const safeOpen = normalizeTimeString(entry.open, settings.openingTime);
    const openMin = parseTimeToMinutes(safeOpen);

    if (dayOffset === 0 && cairo.minutesSinceMidnight >= openMin) {
      continue;
    }

    const [openH, openM] = safeOpen.split(':').map(Number);
    const nextDate = cairoWallClockToDate(
      cairo.year,
      cairo.month,
      cairo.day + dayOffset,
      openH,
      openM
    );
    return {
      date: nextDate,
      iso: nextDate.toISOString(),
      label: formatRelativeOpeningLabel(nextDate, now),
    };
  }

  return null;
}

/**
 * Evaluates whether the schedule is currently open in Africa/Cairo (ignoring manual override).
 */
function evaluateAutomaticSchedule(
  settings: NormalizedOperationsSettings,
  now: Date
): { isWithinSchedule: boolean; scheduleText: string | null; crossesMidnight: boolean } {
  const cairo = getCairoTimeParts(now);
  const nowMin = cairo.minutesSinceMidnight;

  if (!settings.useCustomDailySchedule) {
    const openMin = parseTimeToMinutes(settings.openingTime);
    const closeMin = parseTimeToMinutes(settings.closingTime);
    const scheduleText = `من ${formatTimeArabic12h(settings.openingTime)} إلى ${formatTimeArabic12h(settings.closingTime)}`;

    if (openMin === closeMin) {
      return { isWithinSchedule: true, scheduleText: 'مفتوح 24 ساعة', crossesMidnight: false };
    }

    if (closeMin > openMin) {
      return {
        isWithinSchedule: nowMin >= openMin && nowMin < closeMin,
        scheduleText,
        crossesMidnight: false,
      };
    }

    // Overnight shift (e.g. 12:00 -> 03:00): open from openingTime..23:59 and 00:00..closingTime-1
    return {
      isWithinSchedule: nowMin >= openMin || nowMin < closeMin,
      scheduleText,
      crossesMidnight: true,
    };
  }

  // Advanced optional custom daily schedule
  const todayEntry = settings.workingHours.find(
    (e) => e.day === DAY_INDEX_TO_ARABIC[cairo.weekdayIndex]
  );
  const prevEntry = settings.workingHours.find(
    (e) => e.day === DAY_INDEX_TO_ARABIC[(cairo.weekdayIndex + 6) % 7]
  );

  let isWithinSchedule = false;

  if (todayEntry?.active) {
    const openMin = parseTimeToMinutes(todayEntry.open);
    const closeMin = parseTimeToMinutes(todayEntry.close);
    if (openMin === closeMin) {
      isWithinSchedule = true;
    } else if (closeMin > openMin) {
      isWithinSchedule = nowMin >= openMin && nowMin < closeMin;
    } else {
      isWithinSchedule = nowMin >= openMin;
    }
  }

  if (!isWithinSchedule && prevEntry?.active) {
    const prevOpenMin = parseTimeToMinutes(prevEntry.open);
    const prevCloseMin = parseTimeToMinutes(prevEntry.close);
    if (prevCloseMin < prevOpenMin && nowMin < prevCloseMin) {
      isWithinSchedule = true;
    }
  }

  const scheduleText = todayEntry?.active
    ? `من ${formatTimeArabic12h(todayEntry.open)} إلى ${formatTimeArabic12h(todayEntry.close)}`
    : null;

  const crossesMidnight = todayEntry?.active
    ? parseTimeToMinutes(todayEntry.close) < parseTimeToMinutes(todayEntry.open)
    : false;

  return { isWithinSchedule, scheduleText, crossesMidnight };
}

/**
 * Single authoritative evaluator used across Customer Storefront, Checkout,
 * Admin Operations/Dashboard, and Order Creation validation.
 */
export function evaluateRestaurantStatus(
  rawSettings?: Record<string, any> | NormalizedOperationsSettings | null,
  now: Date = new Date()
): EvaluatedRestaurantStatus {
  const settings =
    rawSettings && 'operatingMode' in rawSettings && 'openingTime' in rawSettings && 'manualOpen' in rawSettings
      ? (rawSettings as NormalizedOperationsSettings)
      : normalizeRestaurantSettings(rawSettings as Record<string, any> | null);

  // 1. Manual Mode — schedule and temporary overrides do not apply
  if (settings.operatingMode === 'manual') {
    if (settings.manualOpen) {
      return {
        isOpen: true,
        operatingMode: 'manual',
        reason: 'manual_open',
        statusLabel: 'استقبال الطلبات مفتوح',
        statusDescription: 'التحكم اليدوي مفعل: المطعم مفتوح حالياً ويستقبل الطلبات حتى تقوم بإيقافه يدوياً.',
        customerMessage: '',
        nextOpeningText: null,
        nextOpeningIso: null,
        scheduleText: null,
        crossesMidnight: false,
      };
    }

    return {
      isOpen: false,
      operatingMode: 'manual',
      reason: 'manual_closed',
      statusLabel: 'استقبال الطلبات متوقف',
      statusDescription: 'التحكم اليدوي مفعل: تم إيقاف استقبال الطلبات يدوياً ولن يفتح تلقائياً.',
      customerMessage: settings.closureMessage || DEFAULT_CLOSURE_MESSAGE,
      nextOpeningText: null,
      nextOpeningIso: null,
      scheduleText: null,
      crossesMidnight: false,
    };
  }

  // 2. Automatic Mode
  const { isWithinSchedule, scheduleText, crossesMidnight } = evaluateAutomaticSchedule(settings, now);
  const nextScheduled = computeNextScheduledOpening(settings, now);

  // 2a. Check Manual Temporary Override (takes priority over automatic schedule until reopening condition is reached)
  if (settings.manualOverrideClosed) {
    const untilMs = settings.manualOverrideUntil ? Date.parse(settings.manualOverrideUntil) : NaN;
    const hasScheduledReopen = !Number.isNaN(untilMs);

    if (!hasScheduledReopen || now.getTime() < untilMs) {
      const overrideReopenText = hasScheduledReopen
        ? formatRelativeOpeningLabel(new Date(untilMs), now)
        : null;

      return {
        isOpen: false,
        operatingMode: 'automatic',
        reason: 'manual_override',
        statusLabel: 'إيقاف مؤقت يدوي',
        statusDescription: overrideReopenText
          ? `تم إيقاف استقبال الطلبات مؤقتاً، وسيُعاد الفتح تلقائياً ${overrideReopenText}.`
          : 'تم إيقاف استقبال الطلبات مؤقتاً فوق الجدول التلقائي حتى تقوم بإعادة الفتح يدوياً.',
        customerMessage: settings.closureMessage || DEFAULT_CLOSURE_MESSAGE,
        nextOpeningText: overrideReopenText,
        nextOpeningIso: hasScheduledReopen ? settings.manualOverrideUntil : null,
        scheduleText,
        crossesMidnight,
      };
    }
    // Otherwise: untilMs has elapsed -> override condition reached, fall through to automatic schedule!
  }

  // 2b. Scheduled Open / Closed
  if (isWithinSchedule) {
    return {
      isOpen: true,
      operatingMode: 'automatic',
      reason: 'scheduled_open',
      statusLabel: 'استقبال الطلبات مفتوح (تلقائي)',
      statusDescription: `يعمل المطعم تلقائياً حسب مواعيد العمل (${scheduleText || ''}).`,
      customerMessage: '',
      nextOpeningText: null,
      nextOpeningIso: null,
      scheduleText,
      crossesMidnight,
    };
  }

  return {
    isOpen: false,
    operatingMode: 'automatic',
    reason: 'scheduled_closed',
    statusLabel: 'مغلق حسب مواعيد العمل',
    statusDescription: nextScheduled
      ? `المطعم خارج ساعات العمل المحددة حالياً، وسيفتح تلقائياً ${nextScheduled.label}.`
      : 'المطعم خارج ساعات العمل المحددة حالياً.',
    customerMessage: nextScheduled
      ? `معلش، إحنا قافلين دلوقتي. هنفتح ${nextScheduled.label}`
      : 'معلش، إحنا قافلين دلوقتي. راجعنا قريب!',
    nextOpeningText: nextScheduled?.label ?? null,
    nextOpeningIso: nextScheduled?.iso ?? null,
    scheduleText,
    crossesMidnight,
  };
}
