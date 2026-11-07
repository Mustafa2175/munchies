/**
 * @module stores/cartStore
 * @description Zustand cart store with localStorage persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { LocalizedText } from '@/types';

export interface SelectedOption {
  optionId: string;
  name: LocalizedText;
  price: number;
}

export interface SelectedCustomization {
  groupId: string;
  groupName: LocalizedText;
  selectedOptions: SelectedOption[];
}

export interface CartItem {
  id: string; // unique cart line ID (UUID)
  productId: string;
  name: LocalizedText;
  image: string;
  basePrice: number;
  quantity: number;
  customizations: SelectedCustomization[];
  specialInstructions?: string;
  lineTotal: number;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'lineTotal'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  
  // Getters
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discountAmount: 0,

      addItem: (item) => {
        const optionSum = item.customizations.reduce(
          (acc, group) =>
            acc + group.selectedOptions.reduce((oAcc, opt) => oAcc + opt.price, 0),
          0
        );
        const unitPrice = item.basePrice + optionSum;
        const lineTotal = unitPrice * item.quantity;

        // Check if an identical item exists (same productId and same customizations)
        const customKey = (c: SelectedCustomization[]) =>
          JSON.stringify(
            c
              .map((g) => ({
                groupId: g.groupId,
                options: g.selectedOptions.map((o) => o.optionId).sort(),
              }))
              .sort((a, b) => a.groupId.localeCompare(b.groupId))
          );

        const currentKey = customKey(item.customizations);
        const existingIndex = get().items.findIndex(
          (i) =>
            i.productId === item.productId &&
            customKey(i.customizations) === currentKey &&
            (i.specialInstructions || '') === (item.specialInstructions || '')
        );

        if (existingIndex > -1) {
          const updated = [...get().items];
          const exist = updated[existingIndex];
          const newQty = exist.quantity + item.quantity;
          updated[existingIndex] = {
            ...exist,
            quantity: newQty,
            lineTotal: unitPrice * newQty,
          };
          set({ items: updated });
        } else {
          const newItem: CartItem = {
            ...item,
            id: uuidv4(),
            lineTotal,
          };
          set({ items: [...get().items, newItem] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) => {
            if (item.id === id) {
              const optionSum = item.customizations.reduce(
                (acc, group) =>
                  acc + group.selectedOptions.reduce((oAcc, opt) => oAcc + opt.price, 0),
                0
              );
              const unitPrice = item.basePrice + optionSum;
              return {
                ...item,
                quantity,
                lineTotal: unitPrice * quantity,
              };
            }
            return item;
          }),
        });
      },

      clearCart: () => {
        set({ items: [], couponCode: null, discountAmount: 0 });
      },

      applyCoupon: (code, discount) => {
        set({ couponCode: code, discountAmount: discount });
      },

      removeCoupon: () => {
        set({ couponCode: null, discountAmount: 0 });
      },

      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.lineTotal, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().discountAmount;
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: 'munchies-cart-storage',
    }
  )
);

