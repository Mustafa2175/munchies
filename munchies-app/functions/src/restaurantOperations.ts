/**
 * @module functions/restaurantOperations
 * @description Backend mirror of `src/lib/restaurantOperations.ts` for Firebase Cloud Functions.
 * Ensures server-side order creation enforces the exact same operating modes, Africa/Cairo
 * schedule rules (including overnight shifts), and manual override rules as the client.
 */

export const CAIRO_TIMEZONE = 'Africa/Cairo';

export type OperatingMode = 'automatic' | 'manual';

export type RestaurantStatusReason =
  | 'manual_open'
  | 'manual_closed'
  | 'scheduled_open'
  | 'scheduled_closed'
  | 'manual_override';

export interface WorkingHoursEntry {
  day: string;
  open: string;
  close: string;
  active: boolean;
}

export interface NormalizedOperationsSettings {
  operatingMode: OperatingMode;
  openingTime: string;
  closingTime: string;
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
  customerMessage: string;
  nextOpeningText: string | null;
}

export const DEFAULT_OPENING_TIME = '12:00';
export const DEFAULT_CLOSING_TIME = '03:00';
export const DEFAULT_CLOSURE_MESSAGE =
  'معلش، إحنا قافلين دلوقتي ومبنستقبلش طلبات جديدة. هنرجع نفتح قريب!';

const DAY_INDEX_TO_ARABIC: string[] = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

const DEFAULT_SCHEDULE: WorkingHoursEntry[] = DAY_INDEX_TO_ARABIC.map((day) => ({
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

function normalizeTimeString(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (TIME_REGEX.test(trimmed)) return trimmed;
  }
  return fallback;
}

function parseTimeToMinutes(time: string): number {
  const safe = normalizeTimeString(time, '00:00');
  const [h, m] = safe.split(':').map(Number);
  return h * 60 + m;
}

function formatTimeArabic12h(time24: string): string {
  const safe = normalizeTimeString(time24, '12:00');
  const [rawH, rawM] = safe.split(':').map(Number);
  const period = rawH >= 12 ? 'م' : 'ص';
  const hour12 = rawH % 12 === 0 ? 12 : rawH % 12;
  const minStr = String(rawM).padStart(2, '0');
  return `${hour12}:${minStr} ${period}`;
}

function getCairoTimeParts(date: Date = new Date()) {
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

function cairoWallClockToDate(
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

function formatRelativeOpeningLabel(targetDate: Date, now: Date = new Date()): string {
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

export function normalizeRestaurantSettings(
  raw?: Record<string, any> | null
): NormalizedOperationsSettings {
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

  const legacyWorkingHours =
    Array.isArray(raw.workingHours) && raw.workingHours.length > 0
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
    typeof raw.manualOpen === 'boolean' ? raw.manualOpen : !Boolean(raw.isManualClosed);

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

function computeNextScheduledOpening(
  settings: NormalizedOperationsSettings,
  now: Date
): { label: string } | null {
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
    return { label: formatRelativeOpeningLabel(nextDate, now) };
  }

  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const targetWeekday = (cairo.weekdayIndex + dayOffset) % 7;
    const dayName = DAY_INDEX_TO_ARABIC[targetWeekday];
    const entry = settings.workingHours.find((e) => e.day === dayName);
    if (!entry || !entry.active) continue;

    const safeOpen = normalizeTimeString(entry.open, settings.openingTime);
    const openMin = parseTimeToMinutes(safeOpen);
    if (dayOffset === 0 && cairo.minutesSinceMidnight >= openMin) continue;

    const [openH, openM] = safeOpen.split(':').map(Number);
    const nextDate = cairoWallClockToDate(
      cairo.year,
      cairo.month,
      cairo.day + dayOffset,
      openH,
      openM
    );
    return { label: formatRelativeOpeningLabel(nextDate, now) };
  }

  return null;
}

function evaluateAutomaticSchedule(
  settings: NormalizedOperationsSettings,
  now: Date
): boolean {
  const cairo = getCairoTimeParts(now);
  const nowMin = cairo.minutesSinceMidnight;

  if (!settings.useCustomDailySchedule) {
    const openMin = parseTimeToMinutes(settings.openingTime);
    const closeMin = parseTimeToMinutes(settings.closingTime);

    if (openMin === closeMin) return true;
    if (closeMin > openMin) return nowMin >= openMin && nowMin < closeMin;
    return nowMin >= openMin || nowMin < closeMin;
  }

  const todayEntry = settings.workingHours.find(
    (e) => e.day === DAY_INDEX_TO_ARABIC[cairo.weekdayIndex]
  );
  const prevEntry = settings.workingHours.find(
    (e) => e.day === DAY_INDEX_TO_ARABIC[(cairo.weekdayIndex + 6) % 7]
  );

  if (todayEntry?.active) {
    const openMin = parseTimeToMinutes(todayEntry.open);
    const closeMin = parseTimeToMinutes(todayEntry.close);
    if (openMin === closeMin) return true;
    if (closeMin > openMin && nowMin >= openMin && nowMin < closeMin) return true;
    if (closeMin < openMin && nowMin >= openMin) return true;
  }

  if (prevEntry?.active) {
    const prevOpenMin = parseTimeToMinutes(prevEntry.open);
    const prevCloseMin = parseTimeToMinutes(prevEntry.close);
    if (prevCloseMin < prevOpenMin && nowMin < prevCloseMin) return true;
  }

  return false;
}

export function evaluateRestaurantStatus(
  rawSettings?: Record<string, any> | null,
  now: Date = new Date()
): EvaluatedRestaurantStatus {
  const settings = normalizeRestaurantSettings(rawSettings);

  if (settings.operatingMode === 'manual') {
    if (settings.manualOpen) {
      return {
        isOpen: true,
        operatingMode: 'manual',
        reason: 'manual_open',
        customerMessage: '',
        nextOpeningText: null,
      };
    }

    return {
      isOpen: false,
      operatingMode: 'manual',
      reason: 'manual_closed',
      customerMessage: settings.closureMessage || DEFAULT_CLOSURE_MESSAGE,
      nextOpeningText: null,
    };
  }

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
        customerMessage: settings.closureMessage || DEFAULT_CLOSURE_MESSAGE,
        nextOpeningText: overrideReopenText,
      };
    }
  }

  const isWithinSchedule = evaluateAutomaticSchedule(settings, now);
  if (isWithinSchedule) {
    return {
      isOpen: true,
      operatingMode: 'automatic',
      reason: 'scheduled_open',
      customerMessage: '',
      nextOpeningText: null,
    };
  }

  const nextScheduled = computeNextScheduledOpening(settings, now);
  return {
    isOpen: false,
    operatingMode: 'automatic',
    reason: 'scheduled_closed',
    customerMessage: nextScheduled
      ? `معلش، إحنا قافلين دلوقتي. هنفتح ${nextScheduled.label}`
      : 'معلش، إحنا قافلين دلوقتي. راجعنا قريب!',
    nextOpeningText: nextScheduled?.label ?? null,
  };
}

