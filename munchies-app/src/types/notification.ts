/**
 * @module types/notification
 * @description Notification types for real-time and push notifications.
 */

import type { FirestoreDocument, LocalizedText, Timestamp } from './common';

// ─── Notification Types ──────────────────────────────────────────────────────

/** Categories of notification. */
export const NOTIFICATION_TYPES = [
  'order_placed',
  'order_confirmed',
  'order_preparing',
  'order_ready',
  'order_out_for_delivery',
  'order_delivered',
  'order_cancelled',
  'order_refunded',
  'promotion',
  'announcement',
  'system',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// ─── Notification Target ─────────────────────────────────────────────────────

/** Who receives this notification. */
export type NotificationTarget =
  | { type: 'user'; userId: string }
  | { type: 'role'; role: string }
  | { type: 'all' };

// ─── Notification ────────────────────────────────────────────────────────────

/**
 * A notification document stored in Firestore
 * `notifications/{id}` (admin) or `users/{uid}/notifications/{id}` (customer).
 */
export interface Notification extends FirestoreDocument {
  /** Notification category. */
  type: NotificationType;
  /** Localised title. */
  title: LocalizedText;
  /** Localised body / message. */
  body: LocalizedText;
  /** Optional image URL (e.g. product thumbnail). */
  imageUrl?: string;
  /** Deep-link route within the app (e.g. "/orders/abc123"). */
  link?: string;
  /** Whether the recipient has read this notification. */
  isRead: boolean;
  /** When the notification was sent. */
  sentAt: Timestamp;
  /** Target audience. */
  target: NotificationTarget;
  /** Related entity ID (e.g. order ID, offer ID). */
  relatedEntityId?: string;
  /** Related entity type. */
  relatedEntityType?: 'order' | 'offer' | 'product' | 'coupon';
}
