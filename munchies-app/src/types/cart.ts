/**
 * @module types/cart
 * @description Client-side cart types for the Munchie's storefront.
 */

import type { LocalizedText } from './common';
import type { Coupon } from './offer';

// ─── Cart Customisation ──────────────────────────────────────────────────────

/**
 * A customisation selection stored in the cart.
 */
export interface CartCustomization {
  /** Customisation group ID. */
  groupId: string;
  /** Localised group name. */
  groupName: LocalizedText;
  /** Selected option ID. */
  optionId: string;
  /** Localised option name. */
  optionName: LocalizedText;
  /** Price of this option (EGP). */
  price: number;
}

// ─── Cart Item ───────────────────────────────────────────────────────────────

/**
 * A single item in the shopping cart.
 * Two items with the same productId but different customisations are stored
 * as separate line items, each with its own generated UUID.
 */
export interface CartItem {
  /** Unique cart-line identifier (UUID v4). */
  id: string;
  /** Product document ID. */
  productId: string;
  /** Localised product name. */
  productName: LocalizedText;
  /** Product image URL. */
  productImageUrl: string;
  /** Base price per unit (EGP). */
  basePrice: number;
  /** Quantity. */
  quantity: number;
  /** Selected customisations. */
  customizations: CartCustomization[];
  /** Per-item notes / special instructions. */
  notes?: string;
  /**
   * Computed line total: (basePrice + Σ option.price) × quantity.
   * Recomputed on every add / update.
   */
  lineTotal: number;
}

// ─── Cart Store Interface ────────────────────────────────────────────────────

/**
 * Shape of the Zustand cart store (state + actions + computed getters).
 */
export interface CartStore {
  // ── State ──
  /** All items currently in the cart. */
  items: CartItem[];
  /** Applied coupon (null if none). */
  appliedCoupon: Coupon | null;

  // ── Actions ──
  /**
   * Add an item to the cart.
   * If an item with the same productId AND identical customisations already
   * exists, its quantity is incremented instead of creating a duplicate.
   */
  addItem: (item: Omit<CartItem, 'id' | 'lineTotal'>) => void;
  /** Remove an item by its cart-line ID. */
  removeItem: (id: string) => void;
  /** Update the quantity for a given cart-line ID. */
  updateQuantity: (id: string, quantity: number) => void;
  /** Clear all items and remove the applied coupon. */
  clearCart: () => void;
  /** Apply a coupon to the cart. */
  applyCoupon: (coupon: Coupon) => void;
  /** Remove the currently applied coupon. */
  removeCoupon: () => void;

  // ── Computed (derived via getters) ──
  /** Total number of individual items (sum of quantities). */
  readonly itemCount: number;
  /** Sum of all line totals before coupon / delivery. */
  readonly subtotal: number;
}
