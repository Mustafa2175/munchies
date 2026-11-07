/**
 * @module types/offer
 * @description Offer (banner promo) and coupon types for the Munchie's platform.
 */

import type { FirestoreDocument, LocalizedText, Timestamp } from './common';

// ─── Discount Type ───────────────────────────────────────────────────────────

/** How the discount value is interpreted. */
export type DiscountType = 'percentage' | 'fixed';

// ─── Offer ───────────────────────────────────────────────────────────────────

/**
 * A promotional offer / banner stored in Firestore `offers/{id}`.
 */
export interface Offer extends FirestoreDocument {
  /** Localised offer title. */
  title: LocalizedText;
  /** Localised offer description / terms. */
  description: LocalizedText;
  /** Banner image URL. */
  imageUrl: string;
  /** Type of discount. */
  discountType: DiscountType;
  /** Discount value (percentage 0-100 or fixed EGP amount). */
  discountValue: number;
  /** Minimum order subtotal to qualify (EGP, 0 = no minimum). */
  minOrderAmount: number;
  /** Maximum discount cap in EGP (only meaningful for percentage discounts). */
  maxDiscountAmount?: number;
  /** Restrict offer to specific product IDs (empty = all products). */
  applicableProductIds: string[];
  /** Restrict offer to specific category IDs (empty = all categories). */
  applicableCategoryIds: string[];
  /** When the offer becomes active. */
  startDate: Timestamp;
  /** When the offer expires. */
  endDate: Timestamp;
  /** Whether the offer is currently enabled by an admin. */
  isActive: boolean;
  /** Display sort order on the offers page. */
  sortOrder: number;
  /** Optional linked coupon code that auto-applies this offer. */
  couponCode?: string;
}

// ─── Coupon ──────────────────────────────────────────────────────────────────

/**
 * A coupon code stored in Firestore `coupons/{id}`.
 */
export interface Coupon extends FirestoreDocument {
  /** The coupon code string (uppercase, unique). */
  code: string;
  /** Localised description shown to the customer. */
  description: LocalizedText;
  /** Type of discount. */
  discountType: DiscountType;
  /** Discount value (percentage 0-100 or fixed EGP amount). */
  discountValue: number;
  /** Minimum order subtotal to qualify (EGP, 0 = no minimum). */
  minOrderAmount: number;
  /** Maximum discount cap in EGP (only meaningful for percentage discounts). */
  maxDiscountAmount?: number;
  /** Total number of times this coupon can be redeemed (null = unlimited). */
  maxUsageTotal: number | null;
  /** Number of times a single user can use this coupon (null = unlimited). */
  maxUsagePerUser: number | null;
  /** How many times it has been redeemed so far. */
  usageCount: number;
  /** When the coupon becomes active. */
  startDate: Timestamp;
  /** When the coupon expires. */
  endDate: Timestamp;
  /** Whether the coupon is currently enabled. */
  isActive: boolean;
  /** Restrict to specific product IDs (empty = all). */
  applicableProductIds: string[];
  /** Restrict to specific category IDs (empty = all). */
  applicableCategoryIds: string[];
}
