/**
 * @module components/cart/CartSummary
 * @description Subtotal, delivery fee, discounts, and total breakdown. Strictly Arabic.
 */

import React from 'react';
import { useCartStore } from '@/stores/cartStore';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';

export interface CartSummaryProps {
  orderType?: 'pickup' | 'delivery';
  deliveryFee?: number;
  showDiscountInput?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({ orderType = 'pickup', deliveryFee: customDeliveryFee }) => {
  const subtotal = useCartStore((state) => state.getSubtotal());
  const discountAmount = useCartStore((state) => state.discountAmount);
  const deliveryFee = orderType === 'delivery' ? (customDeliveryFee !== undefined ? customDeliveryFee : 25) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex justify-between text-medium-gray">
        <span>المجموع الفرعي</span>
        <CurrencyDisplay amount={subtotal} className="text-dark font-semibold" />
      </div>

      <div className="flex justify-between text-medium-gray">
        <span>رسوم الاستلام / التوصيل</span>
        {orderType === 'pickup' ? (
          <span className="text-success font-bold">مجاني</span>
        ) : (
          <CurrencyDisplay amount={deliveryFee} className="text-dark font-semibold" />
        )}
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-success">
          <span>الخصم</span>
          <span>-<CurrencyDisplay amount={discountAmount} /></span>
        </div>
      )}

      <div className="border-t border-border pt-3 flex justify-between items-center text-base font-bold text-dark">
        <span>الإجمالي المطلوب</span>
        <CurrencyDisplay amount={total} className="text-xl font-black text-primary" />
      </div>
    </div>
  );
};
