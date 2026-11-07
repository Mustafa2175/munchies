/**
 * @module types/order
 * @description Order domain types for the Munchie's platform.
 */

import type {
  FirestoreDocument,
  LocalizedText,
  Timestamp,
  DeliveryType,
  PaymentMethod,
} from './common';
import type { Address } from './user';

// ─── Re-export status type from constants ────────────────────────────────────

import type { OrderStatus, PaymentStatus } from '../config/constants';
export type { OrderStatus, PaymentStatus };

// ─── Order Customisation Snapshot ────────────────────────────────────────────

/**
 * A snapshot of a selected customisation option at order time.
 * Prices are captured so that later menu changes don't affect order records.
 */
export interface OrderCustomization {
  /** Customisation group ID. */
  groupId: string;
  /** Localised group name (snapshot). */
  groupName: LocalizedText;
  /** Selected option ID. */
  optionId: string;
  /** Localised option name (snapshot). */
  optionName: LocalizedText;
  /** Price at the time of order (EGP). */
  price: number;
}

// ─── Order Line Item ─────────────────────────────────────────────────────────

/**
 * A single line item in an order.
 */
export interface OrderItem {
  /** Product document ID. */
  productId: string;
  /** Product name snapshot. */
  productName: LocalizedText;
  /** Product image URL snapshot. */
  productImageUrl: string;
  /** Base price per unit at order time (EGP). */
  basePrice: number;
  /** Quantity ordered. */
  quantity: number;
  /** Selected customisations. */
  customizations: OrderCustomization[];
  /** Computed line total: (basePrice + Σ option prices) × quantity. */
  lineTotal: number;
  /** Special instructions for this item. */
  notes?: string;
}

// ─── Order Event (Audit Trail) ───────────────────────────────────────────────

/**
 * An immutable event appended to the order's event log each time
 * its status changes.
 */
export interface OrderEvent {
  /** The new status after this event. */
  status: OrderStatus;
  /** When the transition occurred. */
  timestamp: Timestamp;
  /** UID of the actor who triggered the change (null = system). */
  actorId: string | null;
  /** Human-readable note (e.g. "Customer requested cancellation"). */
  note?: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────

/**
 * A customer order stored in Firestore `orders/{id}`.
 */
export interface Order extends FirestoreDocument {
  /** Auto-generated human-readable order number (e.g. "MUN-20241107-0042"). */
  orderNumber: string;
  /** Customer UID. */
  customerId: string;
  /** Customer display name (snapshot). */
  customerName: string;
  /** Customer email (snapshot). */
  customerEmail: string;
  /** Customer phone (snapshot). */
  customerPhone: string;

  /** Ordered items. */
  items: OrderItem[];

  /** Sum of all line totals before discounts. */
  subtotal: number;
  /** Discount amount applied (positive number). */
  discountAmount: number;
  /** Delivery fee (0 for pickup). */
  deliveryFee: number;
  /** Final total = subtotal − discount + deliveryFee. */
  total: number;

  /** Coupon code applied (if any). */
  couponCode?: string;
  /** Coupon document ID (if any). */
  couponId?: string;

  /** Delivery or pickup. */
  deliveryType: DeliveryType;
  /** Delivery address (null for pickup orders). */
  deliveryAddress: Address | null;
  /** Estimated delivery/pickup time. */
  estimatedTime?: Timestamp;

  /** Payment method. */
  paymentMethod: PaymentMethod;
  /** Payment status. */
  paymentStatus: PaymentStatus;
  /** External payment reference (e.g. Paymob transaction ID). */
  paymentReference?: string;

  /** Current order status. */
  status: OrderStatus;
  /** Chronological event log (immutable append-only). */
  events: OrderEvent[];

  /** Customer-facing notes for the whole order. */
  notes?: string;
  /** Internal admin-only notes. */
  adminNotes?: string;

  /** Cancellation reason (set when status = cancelled). */
  cancellationReason?: string;
  /** Refund reason (set when status = refunded). */
  refundReason?: string;
}
