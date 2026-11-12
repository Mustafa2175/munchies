/**
 * @module types/admin
 * @description Admin user, role, permission, and audit-log types.
 */

import type { FirestoreDocument, Timestamp } from './common';
import type { AdminRole, AdminPermission } from '../config/constants';

export type { AdminRole, AdminPermission };

// ─── Admin User ──────────────────────────────────────────────────────────────

/**
 * An admin/staff user stored in Firestore `admins/{uid}`.
 * Separate from the customer `User` document.
 */
export interface AdminUser extends FirestoreDocument {
  /** Firebase Auth UID. */
  uid: string;
  /** Display name. */
  displayName: string;
  /** Email address. */
  email: string;
  /** Phone number. */
  phone?: string;
  /** Profile photo URL. */
  photoURL?: string;
  /** Assigned admin role. */
  role: AdminRole;
  /** Whether this admin account is active. */
  isActive: boolean;
  /** Last login timestamp. */
  lastLoginAt?: Timestamp;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

/** All auditable actions. */
export const AUDIT_ACTIONS = [
  'create_product',
  'update_product',
  'delete_product',
  'create_category',
  'update_category',
  'delete_category',
  'create_offer',
  'update_offer',
  'delete_offer',
  'create_coupon',
  'update_coupon',
  'delete_coupon',
  'update_order_status',
  'cancel_order',
  'refund_order',
  'update_settings',
  'create_staff',
  'update_staff',
  'delete_staff',
  'send_notification',
  'update_user',
  'disable_user',
  'failed_login',
  'repeated_failed_logins',
  'password_change',
  'password_reset_request',
  'admin_login',
  'record_payment',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

/**
 * An immutable audit-log entry stored in Firestore `auditLogs/{id}`.
 */
export interface AuditLog {
  /** Firestore document ID */
  id: string;
  /** The action that was performed. */
  action: AuditAction;
  /** UID of the admin or system actor who performed the action. */
  actorId: string;
  /** Admin display name (snapshot for readability). */
  actorName: string;
  /** Admin role or actor type at the time of action. */
  actorRole: AdminRole | 'system' | 'customer' | 'anonymous';
  /** The Firestore collection affected (e.g. "products"). */
  targetCollection: string;
  /** The document ID affected. */
  targetId: string;
  /** Human-readable summary of the change. */
  summary: string;
  /** JSON-serialisable diff / details (optional, strictly without sensitive data). */
  details?: Record<string, unknown>;
  /** Client IP address (captured server-side if available). */
  ipAddress?: string;
  /** Event severity level */
  severity?: AuditSeverity;
  /** Flag indicating high-priority security alert (e.g. repeated failed logins) */
  isAlert?: boolean;
  /** When the action occurred. */
  timestamp?: Timestamp | string;
  /** Creation timestamp */
  createdAt?: Timestamp | string;
  /** Update timestamp */
  updatedAt?: Timestamp | string;
}
