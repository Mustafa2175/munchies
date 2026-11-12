/**
 * @module stores/restaurantStore
 * @description Centralized Zustand store for restaurant open/close status and weekly working hours.
 * Provides real-time sync via Firestore onSnapshot (cross-device), BroadcastChannel (cross-tab),
 * and localStorage persistence. Serves as the single source of truth for both Admin and Customer.
 */

import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { TIMEZONE } from '@/config/constants';
import { toZonedTime } from 'date-fns-tz';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single day's working hours entry. */
export interface WorkingHoursEntry {
  day: string;
  open: string;   // HH:mm (24h)
  close: string;  // HH:mm (24h)
  active: boolean;
}

/** Default weekly schedule matching OperationsPage defaults. */
export const DEFAULT_SCHEDULE: WorkingHoursEntry[] = [
  { day: 'الأحد', open: '12:00', close: '03:00', active: true },
  { day: 'الإثنين', open: '12:00', close: '03:00', active: true },
  { day: 'الثلاثاء', open: '12:00', close: '03:00', active: true },
  { day: 'الأربعاء', open: '12:00', close: '03:00', active: true },
  { day: 'الخميس', open: '12:00', close: '03:00', active: true },
  { day: 'الجمعة', open: '13:00', close: '04:00', active: true },
  { day: 'السبت', open: '12:00', close: '03:00', active: true },
];

/**
 * Maps JS Date.getDay() index (0=Sunday) to Arabic day names.
 * Index matches the order in DEFAULT_SCHEDULE.
 */
export const DAY_INDEX_TO_ARABIC: string[] = [
  'الأحد',     // 0 = Sunday
  'الإثنين',   // 1 = Monday
  'الثلاثاء',  // 2 = Tuesday
  'الأربعاء',  // 3 = Wednesday
  'الخميس',    // 4 = Thursday
  'الجمعة',    // 5 = Friday
  'السبت',     // 6 = Saturday
];

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'munchies_restaurant_status';
const CHANNEL_NAME = 'munchies_restaurant_sync';
const FIRESTORE_DOC_PATH = 'settings/restaurant';

// ─── Store Interface ─────────────────────────────────────────────────────────

interface RestaurantState {
  isManualClosed: boolean;
  closureMessage: string;
  workingHours: WorkingHoursEntry[];
  isLoaded: boolean;

  // Actions
  setManualClosed: (closed: boolean, message?: string) => void;
  setClosureMessage: (message: string) => void;
  setWorkingHours: (schedule: WorkingHoursEntry[]) => void;
  saveScheduleToFirestore: (schedule: WorkingHoursEntry[]) => Promise<void>;
  toggleManualClosure: (closed: boolean, message?: string) => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "HH:mm" into total minutes since midnight. */
function parseTimeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Determines if the restaurant is currently open based on schedule and manual override.
 * Evaluates in Cairo timezone. Handles overnight shifts crossing midnight.
 */
export function isStoreCurrentlyOpen(): boolean {
  const state = useRestaurantStore.getState();

  // 1. Manual close overrides everything
  if (state.isManualClosed) return false;

  // 2. Check working hours schedule
  try {
    const now = toZonedTime(new Date(), TIMEZONE);
    const currentDayIndex = now.getDay(); // 0=Sunday
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const schedule = state.workingHours;
    if (!schedule || schedule.length === 0) return true; // No schedule = always open

    // Check today's schedule
    const todayArabicDay = DAY_INDEX_TO_ARABIC[currentDayIndex];
    const todayEntry = schedule.find((e) => e.day === todayArabicDay);

    if (todayEntry && todayEntry.active) {
      const openMin = parseTimeToMinutes(todayEntry.open);
      const closeMin = parseTimeToMinutes(todayEntry.close);

      if (closeMin > openMin) {
        // Normal shift: e.g., 12:00 to 23:00
        if (currentMinutes >= openMin && currentMinutes < closeMin) {
          return true;
        }
      } else {
        // Overnight shift: e.g., 12:00 to 03:00 (close < open)
        // Today's shift extends past midnight: open if currentTime >= openTime
        if (currentMinutes >= openMin) {
          return true;
        }
      }
    }

    // Check previous day's overnight shift that may still be active now (after midnight)
    const prevDayIndex = (currentDayIndex + 6) % 7; // yesterday
    const prevArabicDay = DAY_INDEX_TO_ARABIC[prevDayIndex];
    const prevEntry = schedule.find((e) => e.day === prevArabicDay);

    if (prevEntry && prevEntry.active) {
      const prevOpenMin = parseTimeToMinutes(prevEntry.open);
      const prevCloseMin = parseTimeToMinutes(prevEntry.close);

      // Only if it's an overnight shift (close < open)
      if (prevCloseMin <= prevOpenMin) {
        // We're in the "after midnight" portion of yesterday's shift
        if (currentMinutes < prevCloseMin) {
          return true;
        }
      }
    }

    return false;
  } catch (err) {
    console.warn('Error evaluating working hours:', err);
    return true; // Fail-open to avoid accidentally blocking orders
  }
}

/**
 * Returns a formatted string for today's working hours, e.g., "من 12:00 ظهراً إلى 03:00 فجراً".
 * Returns null if today is closed.
 */
export function getTodayWorkingHoursText(): string | null {
  const state = useRestaurantStore.getState();
  try {
    const now = toZonedTime(new Date(), TIMEZONE);
    const currentDayIndex = now.getDay();
    const todayArabicDay = DAY_INDEX_TO_ARABIC[currentDayIndex];
    const todayEntry = state.workingHours.find((e) => e.day === todayArabicDay);

    if (todayEntry && todayEntry.active) {
      return `من ${todayEntry.open} إلى ${todayEntry.close}`;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── BroadcastChannel helpers ────────────────────────────────────────────────

let _channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!_channel) {
    _channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return _channel;
}

interface RestaurantSyncPayload {
  type: 'RESTAURANT_STATUS_UPDATED';
  isManualClosed: boolean;
  closureMessage: string;
  workingHours: WorkingHoursEntry[];
}

function broadcastStatus(state: Pick<RestaurantState, 'isManualClosed' | 'closureMessage' | 'workingHours'>) {
  try {
    const payload: RestaurantSyncPayload = {
      type: 'RESTAURANT_STATUS_UPDATED',
      isManualClosed: state.isManualClosed,
      closureMessage: state.closureMessage,
      workingHours: state.workingHours,
    };
    getChannel()?.postMessage(payload);
  } catch {
    // ignore
  }
}

/** Write restaurant status fields to Firestore settings/restaurant (merge). */
async function syncStatusToFirestore(data: Record<string, unknown>) {
  try {
    if (!db) return;
    const docRef = doc(db, FIRESTORE_DOC_PATH);
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.warn('Error syncing restaurant status to Firestore:', err);
  }
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set, get) => ({
      isManualClosed: false,
      closureMessage:
        'معلش، مش بنستقبل طلبات دلوقتي عشان ضغط الشغل في المطبخ. هنرجع نفتح قريب!',
      workingHours: DEFAULT_SCHEDULE,
      isLoaded: false,

      setManualClosed: (closed, message) => {
        const updates: Partial<RestaurantState> = { isManualClosed: closed };
        if (message !== undefined) updates.closureMessage = message;
        set(updates);
        broadcastStatus({ ...get(), ...updates });
      },

      setClosureMessage: (message) => {
        set({ closureMessage: message });
      },

      setWorkingHours: (schedule) => {
        set({ workingHours: schedule });
        broadcastStatus({ ...get(), workingHours: schedule });
      },

      saveScheduleToFirestore: async (schedule) => {
        set({ workingHours: schedule });
        broadcastStatus({ ...get(), workingHours: schedule });
        await syncStatusToFirestore({
          workingHours: schedule,
          workingHoursUpdatedAt: new Date().toISOString(),
        });
      },

      toggleManualClosure: async (closed, message) => {
        const closureMsg = message || get().closureMessage;
        set({ isManualClosed: closed, closureMessage: closureMsg });
        broadcastStatus({ ...get(), isManualClosed: closed, closureMessage: closureMsg });
        await syncStatusToFirestore({
          isManualClosed: closed,
          closureMessage: closureMsg,
          manualClosureUpdatedAt: new Date().toISOString(),
        });
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

// ── 1. BroadcastChannel listener: instant cross-tab sync ──
try {
  const ch = getChannel();
  if (ch) {
    ch.addEventListener('message', (event) => {
      const data = event.data as RestaurantSyncPayload;
      if (data?.type === 'RESTAURANT_STATUS_UPDATED') {
        useRestaurantStore.setState({
          isManualClosed: data.isManualClosed,
          closureMessage: data.closureMessage,
          workingHours: data.workingHours,
        });
      }
    });
  }
} catch {
  // Graceful degradation
}

// ── 2. Storage event listener: fallback cross-tab sync ──
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        const state = parsed?.state;
        if (state) {
          useRestaurantStore.setState({
            isManualClosed: !!state.isManualClosed,
            closureMessage: state.closureMessage || '',
            workingHours: Array.isArray(state.workingHours) ? state.workingHours : DEFAULT_SCHEDULE,
          });
        }
      } catch {
        // ignore
      }
    }
  });
}

// ── 3. Firestore onSnapshot real-time listener (cross-device sync) ──
try {
  if (db) {
    onSnapshot(
      doc(db, FIRESTORE_DOC_PATH),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const updates: Partial<RestaurantState> = { isLoaded: true };

          if (typeof data.isManualClosed === 'boolean') {
            updates.isManualClosed = data.isManualClosed;
          }
          if (typeof data.closureMessage === 'string') {
            updates.closureMessage = data.closureMessage;
          }
          if (Array.isArray(data.workingHours) && data.workingHours.length > 0) {
            updates.workingHours = data.workingHours;
          }

          useRestaurantStore.setState(updates);
        } else {
          useRestaurantStore.setState({ isLoaded: true });
        }
      },
      (err) => {
        console.warn('Firestore restaurant status sync info:', err.message);
        useRestaurantStore.setState({ isLoaded: true });
      }
    );
  }
} catch {
  // Graceful degradation
}

/**
 * React hook that re-evaluates `isStoreCurrentlyOpen()` every 30 seconds
 * so that schedule-based transitions (reaching open/close time) are reflected
 * in the UI without requiring a page refresh or Firestore change.
 */
export function useIsStoreOpen(): boolean {
  const isManualClosed = useRestaurantStore((s) => s.isManualClosed);
  const workingHours = useRestaurantStore((s) => s.workingHours);

  const [isOpen, setIsOpen] = useState(() => isStoreCurrentlyOpen());

  useEffect(() => {
    setIsOpen(isStoreCurrentlyOpen());

    const timer = setInterval(() => {
      setIsOpen(isStoreCurrentlyOpen());
    }, 30_000);

    return () => clearInterval(timer);
  }, [isManualClosed, workingHours]);

  return isOpen;
}
