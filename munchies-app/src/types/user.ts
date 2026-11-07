/**
 * @module types/user
 * @description User profile and address types for Munchie's.
 */

import type { FirestoreDocument, Timestamp } from './common';

/**
 * A customer's saved delivery address.
 */
export interface Address {
  /** Unique identifier for this address. */
  id: string;
  /** User-assigned label, e.g. "Home", "Work". */
  label: string;
  /** Full street address (first line). */
  addressLine1: string;
  /** Apartment / floor / building (optional). */
  addressLine2?: string;
  /** Area or district name. */
  area: string;
  /** City name. */
  city: string;
  /** Postal / ZIP code (optional in Egypt but supported). */
  postalCode?: string;
  /** Latitude for map pin. */
  lat?: number;
  /** Longitude for map pin. */
  lng?: number;
  /** Extra delivery instructions (e.g. "Ring the bell twice"). */
  deliveryInstructions?: string;
  /** Whether this is the user's default address. */
  isDefault: boolean;
}

/**
 * Customer user profile stored in Firestore `users/{uid}`.
 */
export interface User extends FirestoreDocument {
  /** Firebase Auth UID — same as the document ID. */
  uid: string;
  /** Display name. */
  displayName: string;
  /** Email address. */
  email: string;
  /** Phone number in E.164 format (e.g. "+201234567890"). */
  phone?: string;
  /** URL to the user's profile photo. */
  photoURL?: string;
  /** Saved delivery addresses. */
  addresses: Address[];
  /** Preferred language. */
  preferredLanguage: 'ar' | 'en';
  /** Whether the account is active (soft-delete flag). */
  isActive: boolean;
  /** Last time the user signed in. */
  lastLoginAt?: Timestamp;
  /** IDs of favourite product documents. */
  favouriteProductIds: string[];
}
