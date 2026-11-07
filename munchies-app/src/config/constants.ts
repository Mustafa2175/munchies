/**
 * @module config/constants
 * @description Application-wide constants for the Munchie's platform.
 */

// ─── Order Statuses ──────────────────────────────────────────────────────────

/** All possible order lifecycle statuses. */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'picked_up',
  'cancelled',
  'refunded',
] as const;

/** Human-readable labels for order statuses (English). */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  picked_up: 'Picked Up',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

/** Valid status transitions from a given status. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'picked_up', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  picked_up: ['refunded'],
  cancelled: [],
  refunded: [],
};

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ─── Payment Statuses ────────────────────────────────────────────────────────

export const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'failed',
  'refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ─── Admin Roles & Permissions ───────────────────────────────────────────────

export const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'staff'] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PERMISSIONS = [
  'manage_menu',
  'manage_orders',
  'manage_users',
  'manage_settings',
  'manage_offers',
  'manage_staff',
  'view_analytics',
  'manage_roles',
  'manage_notifications',
  'view_audit_log',
] as const;

export type AdminPermission = (typeof PERMISSIONS)[number];

/** Maps each admin role to its allowed permissions. */
export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  super_admin: [...PERMISSIONS],
  admin: [
    'manage_menu',
    'manage_orders',
    'manage_users',
    'manage_settings',
    'manage_offers',
    'manage_staff',
    'view_analytics',
    'manage_notifications',
    'view_audit_log',
  ],
  manager: [
    'manage_menu',
    'manage_orders',
    'manage_offers',
    'view_analytics',
    'manage_notifications',
  ],
  staff: ['manage_orders'],
};

// ─── i18n & Localisation ────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = ['ar', 'en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Default application language (Arabic). */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'ar';

/** Currency code used throughout the app. */
export const CURRENCY = 'EGP' as const;

/** Currency display symbol — localised per language. */
export const CURRENCY_SYMBOL: Record<SupportedLanguage, string> = {
  ar: 'ج.م',
  en: 'LE',
};

/** IANA timezone used for all date/time operations. */
export const TIMEZONE = 'Africa/Cairo' as const;

// ─── Pagination ──────────────────────────────────────────────────────────────

/** Selectable page sizes in data tables. */
export const PAGE_SIZES = [10, 20, 50, 100] as const;

/** Default page size. */
export const DEFAULT_PAGE_SIZE = 20;

// ─── Cart ────────────────────────────────────────────────────────────────────

/** Maximum quantity per line item in the cart. */
export const MAX_CART_QUANTITY = 99;

/** Minimum quantity per line item (below this the item is removed). */
export const MIN_CART_QUANTITY = 1;

// ─── Misc ────────────────────────────────────────────────────────────────────

/** Maximum file upload size in bytes (5 MB). */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Accepted image MIME types. */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
