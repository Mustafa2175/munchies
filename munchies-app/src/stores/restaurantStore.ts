/**
 * @module stores/restaurantStore
 * @description Centralized Zustand store for restaurant operating mode (Automatic vs Manual),
 * operating hours (Africa/Cairo), and manual overrides.
 * Provides real-time sync via Firestore onSnapshot (cross-device), BroadcastChannel (cross-tab),
 * and localStorage persistence. Delegates all open/closed evaluation to `lib/restaurantOperations`.
 */

import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  DEFAULT_OPENING_TIME,
  DEFAULT_CLOSING_TIME,
  DEFAULT_CLOSURE_MESSAGE,
  DEFAULT_SCHEDULE,
  computeNextScheduledOpening,
  evaluateRestaurantStatus,
  normalizeRestaurantSettings,
  type EvaluatedRestaurantStatus,
  type NormalizedOperationsSettings,
  type OperatingMode,
  type OverrideReopenCondition,
  type WorkingHoursEntry,
} from '@/lib/restaurantOperations';

export type {
  WorkingHoursEntry,
  OperatingMode,
  OverrideReopenCondition,
  EvaluatedRestaurantStatus,
  NormalizedOperationsSettings,
};
export { DEFAULT_SCHEDULE };

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'munchies_restaurant_status';
const CHANNEL_NAME = 'munchies_restaurant_sync';
const FIRESTORE_DOC_PATH = 'settings/restaurant';

// ─── Store Interface ─────────────────────────────────────────────────────────

export interface RestaurantState extends NormalizedOperationsSettings {
  /** Legacy compatibility flag kept in sync with operatingMode + manualOpen / manualOverrideClosed. */
  isManualClosed: boolean;
  isLoaded: boolean;

  setClosureMessage: (message: string) => void;
  saveOperationsSettings: (partial: Partial<NormalizedOperationsSettings>) => Promise<void>;
  setManualOpenState: (open: boolean, message?: string) => Promise<void>;
  setManualOverride: (
    closed: boolean,
    reopenCondition?: OverrideReopenCondition,
    message?: string
  ) => Promise<void>;
  /** Legacy wrappers preserved for backward compatibility */
  toggleManualClosure: (closed: boolean, message?: string) => Promise<void>;
  saveScheduleToFirestore: (schedule: WorkingHoursEntry[]) => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeLegacyManualClosedFlag(s: Pick<
  NormalizedOperationsSettings,
  'operatingMode' | 'manualOpen' | 'manualOverrideClosed'
>): boolean {
  return s.operatingMode === 'manual' ? !s.manualOpen : s.manualOverrideClosed;
}

function extractNormalizedState(state: RestaurantState): NormalizedOperationsSettings {
  return {
    operatingMode: state.operatingMode,
    openingTime: state.openingTime,
    closingTime: state.closingTime,
    manualOpen: state.manualOpen,
    manualOverrideClosed: state.manualOverrideClosed,
    manualOverrideUntil: state.manualOverrideUntil,
    closureMessage: state.closureMessage,
    useCustomDailySchedule: state.useCustomDailySchedule,
    workingHours: state.workingHours,
  };
}

/**
 * Evaluates the full restaurant operating state using the single shared logic.
 */
export function getRestaurantOperationsStatus(now: Date = new Date()): EvaluatedRestaurantStatus {
  const state = useRestaurantStore.getState();
  return evaluateRestaurantStatus(extractNormalizedState(state), now);
}

/**
 * Determines if the restaurant is currently accepting orders.
 */
export function isStoreCurrentlyOpen(): boolean {
  return getRestaurantOperationsStatus().isOpen;
}

/**
 * Returns a formatted string for active schedule hours (e.g. "من 12:00 م إلى 3:00 ص"),
 * or null in Manual Mode / inactive day.
 */
export function getTodayWorkingHoursText(): string | null {
  return getRestaurantOperationsStatus().scheduleText;
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
  settings: NormalizedOperationsSettings;
}

function broadcastStatus(settings: NormalizedOperationsSettings) {
  try {
    const payload: RestaurantSyncPayload = {
      type: 'RESTAURANT_STATUS_UPDATED',
      settings,
    };
    getChannel()?.postMessage(payload);
  } catch {
    // ignore
  }
}

async function syncStatusToFirestore(data: Record<string, unknown>) {
  if (!db) return;
  const docRef = doc(db, FIRESTORE_DOC_PATH);
  await setDoc(docRef, data, { merge: true });
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set, get) => ({
      operatingMode: 'automatic',
      openingTime: DEFAULT_OPENING_TIME,
      closingTime: DEFAULT_CLOSING_TIME,
      manualOpen: true,
      manualOverrideClosed: false,
      manualOverrideUntil: null,
      isManualClosed: false,
      closureMessage: DEFAULT_CLOSURE_MESSAGE,
      useCustomDailySchedule: false,
      workingHours: DEFAULT_SCHEDULE,
      isLoaded: false,

      setClosureMessage: (message) => {
        set({ closureMessage: message });
      },

      saveOperationsSettings: async (partial) => {
        const current = extractNormalizedState(get());
        const merged = normalizeRestaurantSettings({
          ...current,
          ...partial,
        });
        const isManualClosed = computeLegacyManualClosedFlag(merged);

        set({ ...merged, isManualClosed });
        broadcastStatus(merged);

        await syncStatusToFirestore({
          operatingMode: merged.operatingMode,
          openingTime: merged.openingTime,
          closingTime: merged.closingTime,
          manualOpen: merged.manualOpen,
          manualOverrideClosed: merged.manualOverrideClosed,
          manualOverrideUntil: merged.manualOverrideUntil,
          isManualClosed,
          closureMessage: merged.closureMessage,
          useCustomDailySchedule: merged.useCustomDailySchedule,
          workingHours: merged.workingHours,
          updatedAt: new Date().toISOString(),
        });
      },

      setManualOpenState: async (open, message) => {
        const current = get();
        const closureMessage = message !== undefined ? message : current.closureMessage;
        await current.saveOperationsSettings({
          operatingMode: 'manual',
          manualOpen: open,
          manualOverrideClosed: false,
          manualOverrideUntil: null,
          closureMessage,
        });
      },

      setManualOverride: async (closed, reopenCondition = 'until_manual_reopen', message) => {
        const current = extractNormalizedState(get());
        const closureMessage = message !== undefined ? message : current.closureMessage;

        let manualOverrideUntil: string | null = null;
        if (closed && reopenCondition === 'until_next_open') {
          const nextOpening = computeNextScheduledOpening(
            { ...current, operatingMode: 'automatic' },
            new Date()
          );
          manualOverrideUntil = nextOpening?.iso ?? null;
        }

        await get().saveOperationsSettings({
          operatingMode: 'automatic',
          manualOverrideClosed: closed,
          manualOverrideUntil,
          closureMessage,
        });
      },

      toggleManualClosure: async (closed, message) => {
        const current = get();
        if (current.operatingMode === 'manual') {
          await current.setManualOpenState(!closed, message);
        } else {
          await current.setManualOverride(closed, 'until_manual_reopen', message);
        }
      },

      saveScheduleToFirestore: async (schedule) => {
        await get().saveOperationsSettings({
          workingHours: schedule,
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
      if (data?.type === 'RESTAURANT_STATUS_UPDATED' && data.settings) {
        const normalized = normalizeRestaurantSettings(data.settings);
        useRestaurantStore.setState({
          ...normalized,
          isManualClosed: computeLegacyManualClosedFlag(normalized),
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
        if (parsed?.state) {
          const normalized = normalizeRestaurantSettings(parsed.state);
          useRestaurantStore.setState({
            ...normalized,
            isManualClosed: computeLegacyManualClosedFlag(normalized),
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
          const normalized = normalizeRestaurantSettings(data);
          useRestaurantStore.setState({
            ...normalized,
            isManualClosed: computeLegacyManualClosedFlag(normalized),
            isLoaded: true,
          });
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
 * React hook returning the full evaluated operating status, re-evaluating automatically
 * every 15 seconds so scheduled opening/closing/override transitions update live in UI.
 */
export function useRestaurantOperationsStatus(): EvaluatedRestaurantStatus {
  const operatingMode = useRestaurantStore((s) => s.operatingMode);
  const openingTime = useRestaurantStore((s) => s.openingTime);
  const closingTime = useRestaurantStore((s) => s.closingTime);
  const manualOpen = useRestaurantStore((s) => s.manualOpen);
  const manualOverrideClosed = useRestaurantStore((s) => s.manualOverrideClosed);
  const manualOverrideUntil = useRestaurantStore((s) => s.manualOverrideUntil);
  const closureMessage = useRestaurantStore((s) => s.closureMessage);
  const useCustomDailySchedule = useRestaurantStore((s) => s.useCustomDailySchedule);
  const workingHours = useRestaurantStore((s) => s.workingHours);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 15_000);

    return () => clearInterval(timer);
  }, []);

  return evaluateRestaurantStatus(
    {
      operatingMode,
      openingTime,
      closingTime,
      manualOpen,
      manualOverrideClosed,
      manualOverrideUntil,
      closureMessage,
      useCustomDailySchedule,
      workingHours,
    },
    new Date(nowMs)
  );
}

/**
 * React hook returning whether the restaurant is currently accepting new orders.
 */
export function useIsStoreOpen(): boolean {
  return useRestaurantOperationsStatus().isOpen;
}
