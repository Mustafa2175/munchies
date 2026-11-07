/**
 * @module types/settings
 * @description Restaurant settings, working hours, and announcement types.
 */

import type { FirestoreDocument, LocalizedText, Timestamp } from './common';

// ─── Working Hours ───────────────────────────────────────────────────────────

/**
 * A single time range (e.g. 09:00 – 23:00).
 * Times are in 24 h "HH:mm" format in the Africa/Cairo timezone.
 */
export interface TimeRange {
  /** Opening time in "HH:mm" format. */
  open: string;
  /** Closing time in "HH:mm" format. */
  close: string;
}

/**
 * Schedule for a single day of the week.
 */
export interface DaySchedule {
  /** Whether the restaurant is open on this day. */
  isOpen: boolean;
  /**
   * Time ranges for this day (supports split shifts, e.g. lunch + dinner).
   * Empty when `isOpen` is false.
   */
  ranges: TimeRange[];
}

/** Days of the week, zero-indexed from Sunday. */
export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

/**
 * Full weekly working-hours map.
 */
export type WorkingHours = Record<DayOfWeek, DaySchedule>;

// ─── Delivery Zone ───────────────────────────────────────────────────────────

/**
 * A delivery zone with its own fee and estimated time.
 */
export interface DeliveryZone {
  /** Unique zone ID. */
  id: string;
  /** Localised zone name (e.g. "Downtown Cairo"). */
  name: LocalizedText;
  /** Delivery fee for this zone (EGP). */
  fee: number;
  /** Estimated delivery time in minutes. */
  estimatedMinutes: number;
  /** Whether delivery is available to this zone. */
  isActive: boolean;
}

// ─── Announcement ────────────────────────────────────────────────────────────

/**
 * A site-wide announcement banner (e.g. holiday closures, promos).
 */
export interface Announcement {
  /** Unique announcement ID. */
  id: string;
  /** Localised message. */
  message: LocalizedText;
  /** Visual type determines colour/icon. */
  type: 'info' | 'warning' | 'success' | 'error';
  /** Whether the announcement is currently shown. */
  isActive: boolean;
  /** Optional start time (shown from). */
  startDate?: Timestamp;
  /** Optional end time (hidden after). */
  endDate?: Timestamp;
  /** Whether the user can dismiss the banner. */
  isDismissible: boolean;
}

// ─── Restaurant Settings ─────────────────────────────────────────────────────

/**
 * Global restaurant configuration stored in Firestore
 * `settings/restaurant` (singleton document).
 */
export interface RestaurantSettings extends FirestoreDocument {
  /** Restaurant name. */
  name: LocalizedText;
  /** Tagline / slogan. */
  tagline: LocalizedText;
  /** Restaurant logo URL. */
  logoUrl: string;
  /** Favicon URL. */
  faviconUrl: string;
  /** Restaurant phone number. */
  phone: string;
  /** Restaurant email. */
  email: string;
  /** Full address. */
  address: LocalizedText;
  /** Google Maps location coordinates. */
  location: { lat: number; lng: number };

  /** Weekly operating hours. */
  workingHours: WorkingHours;
  /** Whether ordering is temporarily paused (e.g. kitchen overload). */
  isOrderingPaused: boolean;
  /** Reason shown to customers when ordering is paused. */
  pauseReason?: LocalizedText;

  /** Delivery zones. */
  deliveryZones: DeliveryZone[];
  /** Minimum order subtotal for delivery (EGP). */
  minOrderAmount: number;
  /** Estimated preparation time in minutes (default). */
  defaultPrepTimeMinutes: number;

  /** Active announcements. */
  announcements: Announcement[];

  /** Social media links. */
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    whatsapp?: string;
  };

  /** SEO metadata. */
  seo: {
    title: LocalizedText;
    description: LocalizedText;
    ogImageUrl?: string;
  };
}
