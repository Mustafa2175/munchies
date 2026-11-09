/**
 * @module hooks/useNewOrderNotification
 * @description Custom hook that detects newly arriving orders via Firestore real-time
 * subscription and triggers an audible POS bell chime + toast notification.
 * Designed with initial-load protection: existing orders on page open/refresh
 * are silently catalogued; only *truly new* orders fire the alert.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { subscribeToCollection } from '@/lib/firestore';
import { getLocalizedText } from '@/lib/i18n';
import type { Order } from '@/types';
import toast from 'react-hot-toast';
import {
  playNewOrderChime,
  isSoundEnabled,
  unlockAudioContext,
} from '@/utils/soundNotification';

/** Statuses that qualify as "new / just placed" */
const NEW_ORDER_STATUSES = new Set(['pending', 'confirmed']);

/** Max age (ms) for an order to be considered "just placed" — 2 minutes */
const MAX_NEW_ORDER_AGE_MS = 2 * 60 * 1000;

export interface NewOrderNotificationState {
  /** Count of unread new orders since the admin last acknowledged */
  unreadCount: number;
  /** Reset the unread badge counter (e.g., when user clicks the bell) */
  clearUnread: () => void;
}

/**
 * Hook: subscribes to the `orders` collection in Firestore and plays a bell
 * chime whenever a truly new order appears.
 *
 * **Initial-load protection:** The first snapshot populates the known-IDs set
 * without triggering any sound or toast.
 */
export function useNewOrderNotification(): NewOrderNotificationState {
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Auto-unlock AudioContext on first user interaction ────────────────────
  useEffect(() => {
    const unlock = () => {
      unlockAudioContext();
    };
    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, unlock, { once: false, passive: true }));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, unlock));
    };
  }, []);

  // ── Real-time Firestore subscription ─────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToCollection<Order>('orders', (remoteOrders) => {
      const allOrders = remoteOrders || [];

      if (isInitialLoadRef.current) {
        // ═══ INITIAL LOAD: catalogue every existing order silently ═══
        allOrders.forEach((order) => knownOrderIdsRef.current.add(order.id));
        isInitialLoadRef.current = false;
        return;
      }

      // ═══ SUBSEQUENT UPDATES: detect brand-new orders ═══
      const now = Date.now();
      let newOrdersDetected = 0;

      allOrders.forEach((order) => {
        // Skip already-known orders
        if (knownOrderIdsRef.current.has(order.id)) return;

        // Always add to known set so we don't re-trigger
        knownOrderIdsRef.current.add(order.id);

        // Only alert for orders with a "new" status
        if (!NEW_ORDER_STATUSES.has(order.status)) return;

        // Only alert for orders created within the last 2 minutes
        const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : 0;
        if (createdAt > 0 && now - createdAt > MAX_NEW_ORDER_AGE_MS) return;

        newOrdersDetected++;

        // ── Toast notification ──────────────────────────────────────────
        const rawNum = String(order.orderNumber || '').replace(/^#/, '');
        const customerName = getLocalizedText(order.customerName, 'عميل مانشيز');
        toast(
          `🔔 طلب جديد وارد! رقم الطلب #${rawNum} - ${customerName}`,
          {
            icon: '🛎️',
            duration: 8000,
            style: {
              direction: 'rtl',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '14px',
              background: '#512080',
              color: '#fff',
              padding: '12px 18px',
              maxWidth: '420px',
              boxShadow: '0 8px 30px rgba(81,32,128,0.35)',
            },
          },
        );
      });

      if (newOrdersDetected > 0) {
        // Play chime if sound is enabled
        if (isSoundEnabled()) {
          playNewOrderChime();
        }
        setUnreadCount((prev) => prev + newOrdersDetected);
      }
    });

    return () => unsub();
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { unreadCount, clearUnread };
}

