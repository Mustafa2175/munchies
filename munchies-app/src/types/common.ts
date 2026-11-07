/**
 * @module types/common
 * @description Shared primitive types used across the Munchie's domain model.
 */

import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore';

// ─── Firebase Timestamp ──────────────────────────────────────────────────────

/**
 * Re-export the Firestore Timestamp type so domain modules don't need
 * a direct Firebase import.
 */
export type Timestamp = FirestoreTimestamp;

// ─── Localised Text ──────────────────────────────────────────────────────────

/**
 * A bilingual text value (Arabic + English).
 * Every user-facing string stored in Firestore should use this shape.
 */
export interface LocalizedText {
  /** Arabic text (primary). */
  ar: string;
  /** English text. */
  en: string;
}

// ─── Generic Firestore Document ──────────────────────────────────────────────

/**
 * Base fields present on every Firestore document.
 */
export interface FirestoreDocument {
  /** Firestore document ID. */
  id: string;
  /** Server-set creation timestamp. */
  createdAt: Timestamp;
  /** Server-set last-update timestamp. */
  updatedAt: Timestamp;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

/**
 * Cursor-based pagination metadata returned alongside collection queries.
 */
export interface PaginationMeta {
  /** Total number of documents matching the query. */
  total: number;
  /** Current page number (1-based). */
  page: number;
  /** Number of items per page. */
  pageSize: number;
  /** Whether more pages exist after the current page. */
  hasMore: boolean;
}

// ─── API Response Wrapper ────────────────────────────────────────────────────

/**
 * Standard wrapper for Firebase callable function responses.
 */
export interface ApiResponse<T = unknown> {
  /** Whether the operation succeeded. */
  success: boolean;
  /** Payload (present on success). */
  data?: T;
  /** Human-readable error message (present on failure). */
  message?: string;
  /** Machine-readable error code. */
  errorCode?: string;
}

// ─── Sort & Filter ───────────────────────────────────────────────────────────

/** Sort direction. */
export type SortDirection = 'asc' | 'desc';

/** A single Firestore filter descriptor. */
export interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}

/** Re-export for convenience. */
export type WhereFilterOp =
  | '<'
  | '<='
  | '=='
  | '!='
  | '>='
  | '>'
  | 'array-contains'
  | 'array-contains-any'
  | 'in'
  | 'not-in';

/** Sort descriptor for collection queries. */
export interface SortOption {
  field: string;
  direction: SortDirection;
}

// ─── Delivery Types ──────────────────────────────────────────────────────────

/** Available order fulfilment methods. */
export type DeliveryType = 'delivery' | 'pickup';

/** Available payment methods. */
export type PaymentMethod = 'cash' | 'card' | 'wallet';
