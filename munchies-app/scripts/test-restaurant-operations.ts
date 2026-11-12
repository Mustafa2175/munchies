/**
 * @file test-restaurant-operations.ts
 * @description Comprehensive test suite verifying:
 * 1. Automatic opening
 * 2. Automatic closing
 * 3. Overnight operating hours (including midnight crossing)
 * 4. Manual mode without automatic closure
 * 5. Manual closure during automatic operation
 * 6. Reopening after manual closure (manual reopen & auto-resume condition)
 * 7. Switching between modes
 * 8. Customer checkout & Cloud Function parity while closed
 * 9. Existing accepted orders unaffected by closed order acceptance
 * 10. Africa/Cairo timezone & exact boundary behavior
 */

import {
  evaluateRestaurantStatus,
  normalizeRestaurantSettings,
  cairoWallClockToDate,
  getCairoTimeParts,
  computeNextScheduledOpening,
} from '../src/lib/restaurantOperations';
import {
  evaluateRestaurantStatus as evaluateBackendStatus,
} from '../functions/src/restaurantOperations';
import { isRestaurantOpen } from '../src/lib/date';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

/** Helper to construct a Date at an exact Africa/Cairo wall-clock time. */
function cairoDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  return cairoWallClockToDate(year, month, day, hour, minute);
}

console.log('🧪 Starting Restaurant Operations & Order Acceptance Test Suite...\n');

// ── 1 & 2. Automatic Opening & Automatic Closing (Same-Day Shift: 09:00 - 23:00) ──
console.log('--- Test 1 & 2: Automatic Opening & Closing (09:00 - 23:00 Cairo) ---');
const sameDaySettings = {
  operatingMode: 'automatic',
  openingTime: '09:00',
  closingTime: '23:00',
  manualOverrideClosed: false,
  manualOverrideUntil: null,
  closureMessage: 'مغلق مؤقتاً',
};

const beforeOpen = cairoDate(2026, 11, 12, 8, 59);
const atOpen = cairoDate(2026, 11, 12, 9, 0);
const midShift = cairoDate(2026, 11, 12, 16, 30);
const beforeClose = cairoDate(2026, 11, 12, 22, 59);
const atClose = cairoDate(2026, 11, 12, 23, 0);

let st = evaluateRestaurantStatus(sameDaySettings, beforeOpen);
assert(!st.isOpen && st.reason === 'scheduled_closed', '08:59 Cairo is scheduled_closed before 09:00 opening');
assert(st.nextOpeningText === 'اليوم الساعة 9:00 ص', `Next opening text shows today 9:00 AM (got "${st.nextOpeningText}")`);

st = evaluateRestaurantStatus(sameDaySettings, atOpen);
assert(st.isOpen && st.reason === 'scheduled_open', '09:00 Cairo exact boundary opens automatically');

st = evaluateRestaurantStatus(sameDaySettings, midShift);
assert(st.isOpen && st.reason === 'scheduled_open', '16:30 Cairo is open during automatic shift');

st = evaluateRestaurantStatus(sameDaySettings, beforeClose);
assert(st.isOpen && st.reason === 'scheduled_open', '22:59 Cairo is still open 1 min before close');

st = evaluateRestaurantStatus(sameDaySettings, atClose);
assert(!st.isOpen && st.reason === 'scheduled_closed', '23:00 Cairo exact boundary closes automatically');
assert(st.nextOpeningText === 'غداً الساعة 9:00 ص', `At 23:00, next opening text shows tomorrow 9:00 AM (got "${st.nextOpeningText}")`);

// ── 3. Overnight Operating Hours (12:00 - 03:00 Cairo) ──
console.log('\n--- Test 3: Overnight Operating Hours (12:00 - 03:00 Cairo) ---');
const overnightSettings = {
  operatingMode: 'automatic',
  openingTime: '12:00',
  closingTime: '03:00',
  manualOverrideClosed: false,
  manualOverrideUntil: null,
};

const beforeNoon = cairoDate(2026, 11, 12, 11, 59);
const atNoon = cairoDate(2026, 11, 12, 12, 0);
const lateNight = cairoDate(2026, 11, 12, 23, 45);
const justAfterMidnight = cairoDate(2026, 11, 13, 0, 0);
const at259am = cairoDate(2026, 11, 13, 2, 59);
const at300am = cairoDate(2026, 11, 13, 3, 0);

st = evaluateRestaurantStatus(overnightSettings, beforeNoon);
assert(!st.isOpen && st.reason === 'scheduled_closed', '11:59 Cairo is closed before 12:00 PM opening');
assert(st.nextOpeningText === 'اليوم الساعة 12:00 م', `Next opening is today 12:00 PM (got "${st.nextOpeningText}")`);

st = evaluateRestaurantStatus(overnightSettings, atNoon);
assert(st.isOpen && st.reason === 'scheduled_open' && st.crossesMidnight, '12:00 PM opens and marks crossesMidnight');

st = evaluateRestaurantStatus(overnightSettings, lateNight);
assert(st.isOpen && st.reason === 'scheduled_open', '23:45 Cairo remains open');

st = evaluateRestaurantStatus(overnightSettings, justAfterMidnight);
assert(st.isOpen && st.reason === 'scheduled_open', '00:00 Cairo midnight remains open in overnight shift');

st = evaluateRestaurantStatus(overnightSettings, at259am);
assert(st.isOpen && st.reason === 'scheduled_open', '02:59 Cairo remains open 1 min before 03:00 close');

st = evaluateRestaurantStatus(overnightSettings, at300am);
assert(!st.isOpen && st.reason === 'scheduled_closed', '03:00 Cairo exact boundary closes overnight shift');
assert(st.nextOpeningText === 'اليوم الساعة 12:00 م', `At 03:00 AM, next opening is same day 12:00 PM (got "${st.nextOpeningText}")`);

// Midnight exact close (12:00 -> 00:00)
const midnightCloseSettings = { operatingMode: 'automatic', openingTime: '12:00', closingTime: '00:00' };
assert(
  evaluateRestaurantStatus(midnightCloseSettings, cairoDate(2026, 11, 12, 23, 59)).isOpen,
  '12:00 -> 00:00 is open at 23:59'
);
assert(
  !evaluateRestaurantStatus(midnightCloseSettings, cairoDate(2026, 11, 13, 0, 0)).isOpen,
  '12:00 -> 00:00 closes strictly at 00:00'
);

// ── 4. Manual Mode Without Automatic Closure ──
console.log('\n--- Test 4: Manual Mode (No Automatic Closure) ---');
const manualOpenSettings = {
  operatingMode: 'manual',
  openingTime: '09:00',
  closingTime: '17:00', // should be ignored in Manual mode!
  manualOpen: true,
  manualOverrideClosed: true, // stale override should also be ignored in Manual mode!
};

st = evaluateRestaurantStatus(manualOpenSettings, cairoDate(2026, 11, 12, 4, 30)); // 4:30 AM outside schedule
assert(st.isOpen && st.reason === 'manual_open', 'Manual mode open stays open at 04:30 AM regardless of schedule');
assert(st.scheduleText === null, 'Manual mode exposes no active schedule text');

const manualClosedSettings = {
  operatingMode: 'manual',
  openingTime: '09:00',
  closingTime: '23:00',
  manualOpen: false,
  closureMessage: 'إغلاق يدوي للصيانة',
};

st = evaluateRestaurantStatus(manualClosedSettings, cairoDate(2026, 11, 12, 14, 0)); // 2:00 PM inside schedule
assert(!st.isOpen && st.reason === 'manual_closed', 'Manual mode closed stays closed during daytime');
assert(st.nextOpeningText === null, 'Manual mode closed has no automatic next opening time');
assert(st.customerMessage === 'إغلاق يدوي للصيانة', 'Manual mode closed returns configured closure message');

// ── 5 & 6. Manual Temporary Override During Automatic Operation & Reopening ──
console.log('\n--- Test 5 & 6: Manual Override Priority & Reopening Conditions ---');
const normalizedOvernight = normalizeRestaurantSettings(overnightSettings);

// Case A: Pause until manual reopen
const pausedUntilManual = {
  ...overnightSettings,
  manualOverrideClosed: true,
  manualOverrideUntil: null,
  closureMessage: 'ضغط عمل مؤقت في المطبخ',
};

st = evaluateRestaurantStatus(pausedUntilManual, cairoDate(2026, 11, 12, 20, 0)); // during open shift
assert(!st.isOpen && st.reason === 'manual_override', 'Manual temporary closure takes priority over open schedule');
assert(st.nextOpeningText === null, 'Indefinite manual override does not promise auto reopen time');

// Even next day at 13:00, indefinite manual override stays closed until admin reopens
st = evaluateRestaurantStatus(pausedUntilManual, cairoDate(2026, 11, 13, 13, 0));
assert(!st.isOpen && st.reason === 'manual_override', 'Indefinite manual override persists across next opening until manually reopened');

// Manual reopen clears override
const reopened = { ...pausedUntilManual, manualOverrideClosed: false, manualOverrideUntil: null };
st = evaluateRestaurantStatus(reopened, cairoDate(2026, 11, 12, 20, 5));
assert(st.isOpen && st.reason === 'scheduled_open', 'Clearing manual override immediately resumes automatic open state');

// Case B: Pause until next scheduled opening
const pauseTime = cairoDate(2026, 11, 12, 20, 0);
const nextOpening = computeNextScheduledOpening(normalizedOvernight, pauseTime);
assert(nextOpening !== null, 'Computes next opening for overnight shift at 20:00');
const pausedUntilNextOpen = {
  ...overnightSettings,
  manualOverrideClosed: true,
  manualOverrideUntil: nextOpening!.iso,
  closureMessage: 'خلصنا طلبات النهارده، هنفتح بكره',
};

st = evaluateRestaurantStatus(pausedUntilNextOpen, cairoDate(2026, 11, 12, 21, 0));
assert(!st.isOpen && st.reason === 'manual_override', 'Pause until next open keeps restaurant closed at 21:00');
assert(st.nextOpeningText === 'غداً الساعة 12:00 م', `Displays expected reopening time (got "${st.nextOpeningText}")`);

st = evaluateRestaurantStatus(pausedUntilNextOpen, cairoDate(2026, 11, 13, 11, 59));
assert(!st.isOpen && st.reason === 'manual_override', 'Pause until next open remains active at 11:59 next day');

st = evaluateRestaurantStatus(pausedUntilNextOpen, cairoDate(2026, 11, 13, 12, 0));
assert(st.isOpen && st.reason === 'scheduled_open', 'Reaching next scheduled opening automatically clears temporary override and opens');

// ── 7. Switching Between Modes ──
console.log('\n--- Test 7: Mode Switching & Legacy Settings Compatibility ---');
const legacyDoc = {
  isManualClosed: false,
  workingHours: [
    { day: 'الأحد', open: '11:00', close: '01:00', active: true },
  ],
};
const normalizedLegacy = normalizeRestaurantSettings(legacyDoc);
assert(
  normalizedLegacy.operatingMode === 'automatic' &&
    normalizedLegacy.openingTime === '11:00' &&
    normalizedLegacy.closingTime === '01:00' &&
    !normalizedLegacy.manualOverrideClosed,
  'Legacy Firestore settings doc migrates cleanly to Automatic mode (11:00 - 01:00)'
);

const switchedToManual = normalizeRestaurantSettings({
  ...normalizedLegacy,
  operatingMode: 'manual',
  manualOpen: true,
});
assert(
  switchedToManual.operatingMode === 'manual' && !switchedToManual.manualOverrideClosed,
  'Switching to Manual mode drops manualOverrideClosed cleanly'
);

// ── 8. Frontend, Cloud Function Backend & Date Helper Parity ──
console.log('\n--- Test 8: Frontend, Cloud Function & Helper Parity ---');
const testCases = [
  { settings: sameDaySettings, at: beforeOpen },
  { settings: sameDaySettings, at: atOpen },
  { settings: sameDaySettings, at: atClose },
  { settings: overnightSettings, at: justAfterMidnight },
  { settings: overnightSettings, at: at300am },
  { settings: manualOpenSettings, at: cairoDate(2026, 11, 12, 4, 0) },
  { settings: manualClosedSettings, at: cairoDate(2026, 11, 12, 14, 0) },
  { settings: pausedUntilManual, at: cairoDate(2026, 11, 12, 20, 0) },
  { settings: pausedUntilNextOpen, at: cairoDate(2026, 11, 13, 12, 0) },
];

for (const tc of testCases) {
  const fe = evaluateRestaurantStatus(tc.settings, tc.at);
  const be = evaluateBackendStatus(tc.settings, tc.at);
  assert(
    fe.isOpen === be.isOpen && fe.reason === be.reason && fe.operatingMode === be.operatingMode,
    `Backend Cloud Function matches Frontend for reason=${fe.reason} isOpen=${fe.isOpen}`
  );
}

// Also verify date.ts delegates cleanly to single source of truth
assert(
  !isRestaurantOpen({ ...manualClosedSettings } as any),
  'src/lib/date.ts isRestaurantOpen returns false when closed'
);

// ── 9. Existing Accepted Orders Unaffected by Closure ──
console.log('\n--- Test 9: Existing Accepted Orders & Tracking Unaffected ---');
const functionsSource = fs.readFileSync(
  path.resolve(__dirname, '../functions/src/index.ts'),
  'utf-8'
);
const updateOrderSection = functionsSource.slice(functionsSource.indexOf('export const updateOrderStatus'));
const cancelOrderSection = functionsSource.slice(
  functionsSource.indexOf('export const cancelOrder'),
  functionsSource.indexOf('export const updateOrderStatus')
);
const createOrderSection = functionsSource.slice(
  functionsSource.indexOf('export const createOrder'),
  functionsSource.indexOf('export const cancelOrder')
);

assert(
  createOrderSection.includes('evaluateRestaurantStatus'),
  'Cloud Function createOrder validates restaurant operating status on backend'
);
assert(
  !updateOrderSection.includes('evaluateRestaurantStatus') && !updateOrderSection.includes('isManualClosed'),
  'Cloud Function updateOrderStatus does NOT block admins from updating existing orders while closed'
);
assert(
  !cancelOrderSection.includes('evaluateRestaurantStatus') && !cancelOrderSection.includes('isManualClosed'),
  'Cloud Function cancelOrder does NOT depend on restaurant open status'
);

// ── 10. Africa/Cairo Timezone Independence from Host TZ ──
console.log('\n--- Test 10: Africa/Cairo Timezone Wall-Clock Verification ---');
// Verify UTC -> Cairo conversion: 2026-11-12T10:00:00.000Z in winter (UTC+2) MUST be 12:00 Cairo
const utcTenAm = new Date('2026-11-12T10:00:00.000Z');
const cairoParts = getCairoTimeParts(utcTenAm);
assert(
  cairoParts.hour === 12 && cairoParts.minute === 0,
  `2026-11-12T10:00Z maps to 12:00 Africa/Cairo (got ${cairoParts.hour}:${String(cairoParts.minute).padStart(2, '0')})`
);
assert(
  evaluateRestaurantStatus(overnightSettings, utcTenAm).isOpen,
  'Overnight 12:00-03:00 opens at exact 10:00Z (12:00 Cairo)'
);
assert(
  !evaluateRestaurantStatus(overnightSettings, new Date('2026-11-12T09:59:00.000Z')).isOpen,
  'Overnight 12:00-03:00 is closed at 09:59Z (11:59 Cairo)'
);
assert(
  !evaluateRestaurantStatus(overnightSettings, new Date('2026-11-13T01:00:00.000Z')).isOpen,
  'Overnight 12:00-03:00 closes at exact 01:00Z (03:00 Cairo)'
);

console.log('\n🎉 ALL RESTAURANT OPERATIONS TESTS PASSED SUCCESSFULLY!');
