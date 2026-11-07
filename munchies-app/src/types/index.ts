/**
 * @module types
 * @description Centralized TypeScript types for the Munchie's platform.
 */

import type { OrderStatus, PaymentStatus, AdminRole, AdminPermission, SupportedLanguage } from '@/config/constants';

export type { OrderStatus, PaymentStatus, AdminRole, AdminPermission, SupportedLanguage };

// ─── Localized Text ──────────────────────────────────────────────────────────

export interface LocalizedText {
  ar: string;
  en: string;
  [key: string]: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: LocalizedText;
  slug: string;
  description?: LocalizedText;
  image?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Customization ───────────────────────────────────────────────────────────

export interface CustomizationOption {
  id: string;
  name: LocalizedText;
  price: number;
  isDefault?: boolean;
}

export interface CustomizationGroup {
  id: string;
  name: LocalizedText;
  type: 'single' | 'multiple';
  required?: boolean;
  isRequired?: boolean;
  minSelect?: number;
  minSelections?: number;
  maxSelect?: number;
  maxSelections?: number;
  options: CustomizationOption[];
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  name: LocalizedText;
  price: number;
}

export interface Product {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  slug: string;
  categoryId: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images?: string[];
  variants?: ProductVariant[];
  customizationGroups?: CustomizationGroup[];
  hasCustomization?: boolean;
  badges?: Array<'best-seller' | 'new' | 'offer'>;
  isBestSeller?: boolean;
  isNew?: boolean;
  isAvailable: boolean;
  isActive?: boolean;
  sortOrder: number;
  preparationTime?: number;
  calories?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItemCustomization {
  groupId: string;
  groupName: LocalizedText;
  selectedOptions: {
    id?: string;
    optionId?: string;
    name: LocalizedText;
    price: number;
  }[];
}

export interface CartItem {
  id: string;
  productId: string;
  product?: Product;
  name?: LocalizedText;
  image?: string;
  basePrice?: number;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  lineTotal?: number;
  selectedVariant?: ProductVariant;
  customizations?: any[];
  specialInstructions?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  itemCount: number;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  id?: string;
  productId: string;
  name?: LocalizedText;
  productName?: LocalizedText;
  image?: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedVariant?: ProductVariant;
  customizations?: any[];
  specialInstructions?: string;
}

export interface OrderStatusEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  statusHistory?: OrderStatusEntry[];
  type?: 'delivery' | 'pickup';
  orderType?: 'delivery' | 'pickup';
  deliveryAddress?: Address;
  paymentMethod: 'cash' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  couponCode?: string;
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  label: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  area: string;
  city: string;
  notes?: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  phone: string;
  photoURL?: string;
  addresses?: Address[];
  preferredLanguage?: SupportedLanguage;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export type User = UserProfile;

export interface AdminUser {
  uid: string;
  email: string;
  name?: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface RestaurantSettings {
  name: LocalizedText;
  description: LocalizedText;
  phone: string;
  address: LocalizedText;
  workingHours?: any;
  deliveryFee?: number;
  freeDeliveryMinimum?: number;
  minimumOrderAmount?: number;
  isOpen?: boolean;
  isManualClosed?: boolean;
  orderAcceptanceEnabled?: boolean;
  announcement?: LocalizedText;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };
}

// ─── Offer ───────────────────────────────────────────────────────────────────

export interface Offer {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  image: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrder?: number;
  productIds?: string[];
  categoryIds?: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}
