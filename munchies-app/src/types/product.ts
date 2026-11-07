/**
 * @module types/product
 * @description Product, category, and customisation types for the Munchie's menu.
 */

import type { FirestoreDocument, LocalizedText } from './common';

// ─── Customisation ───────────────────────────────────────────────────────────

/**
 * A single selectable option within a customisation group.
 * E.g. "Extra Cheese" with a +15 LE surcharge.
 */
export interface CustomizationOption {
  /** Unique option ID within its group. */
  id: string;
  /** Localised option name. */
  name: LocalizedText;
  /** Additional price in EGP (0 if free). */
  price: number;
  /** Whether this option is currently available. */
  isAvailable: boolean;
  /** Display sort order. */
  sortOrder: number;
}

/**
 * A group of customisation options for a product.
 * E.g. "Choose your size" (required, pick exactly 1).
 */
export interface CustomizationGroup {
  /** Unique group ID. */
  id: string;
  /** Localised group name. */
  name: LocalizedText;
  /** Whether the customer must select from this group. */
  isRequired: boolean;
  /** Minimum selections required (0 for optional groups). */
  minSelections: number;
  /** Maximum selections allowed (1 = radio, >1 = checkbox). */
  maxSelections: number;
  /** Available options in this group. */
  options: CustomizationOption[];
  /** Display sort order among sibling groups. */
  sortOrder: number;
}

// ─── Product ─────────────────────────────────────────────────────────────────

/**
 * A menu product stored in Firestore `products/{id}`.
 */
export interface Product extends FirestoreDocument {
  /** Localised product name. */
  name: LocalizedText;
  /** Localised product description. */
  description: LocalizedText;
  /** URL-friendly slug used in routes. */
  slug: string;
  /** Base price in EGP (before customisations). */
  price: number;
  /** Original price before discount (shown struck through). */
  originalPrice?: number;
  /** Primary image URL. */
  imageUrl: string;
  /** Additional gallery image URLs. */
  galleryUrls: string[];
  /** Reference to the parent category document ID. */
  categoryId: string;
  /** Customisation groups offered with this product. */
  customizationGroups: CustomizationGroup[];
  /** Whether the product is currently available for ordering. */
  isAvailable: boolean;
  /** Whether the product is featured on the home page. */
  isFeatured: boolean;
  /** Whether the product is marked as popular / best-seller. */
  isPopular: boolean;
  /** Tags for search / filtering (e.g. "spicy", "vegetarian"). */
  tags: string[];
  /** Preparation time estimate in minutes. */
  prepTimeMinutes?: number;
  /** Calorie count (optional nutritional info). */
  calories?: number;
  /** Display sort order within its category. */
  sortOrder: number;
}

// ─── Category ────────────────────────────────────────────────────────────────

/**
 * A menu category stored in Firestore `categories/{id}`.
 */
export interface Category extends FirestoreDocument {
  /** Localised category name. */
  name: LocalizedText;
  /** Localised category description. */
  description: LocalizedText;
  /** URL-friendly slug. */
  slug: string;
  /** Category thumbnail/icon image URL. */
  imageUrl: string;
  /** Whether this category is visible on the storefront. */
  isActive: boolean;
  /** Display sort order among sibling categories. */
  sortOrder: number;
  /** Number of active products in this category (denormalised). */
  productCount: number;
}
