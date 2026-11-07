/**
 * @module components/cart/CartSummary
 * @description Subtotal, delivery fee, discounts, and total breakdown. Strictly Arabic.
 */

import React from 'react';
import { useCartStore } from '@/stores/cartStore';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';

export interface CartSummaryProps {
  orderType?: 'pickup' | 'delivery';
  showDiscountInput?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({ orderType = 'pickup' }) => {
  const subtotal = useCartStore((state) => state.getSubtotal());
  const discountAmount = useCartStore((state) => state.discountAmount);
  const deliveryFee = orderType === 'delivery' ? 25 : 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>المجموع الفرعي</span>
        <CurrencyDisplay amount={subtotal} />
      </div>

      <div className="flex justify-between text-gray-600">
        <span>رسوم الاستلام / التوصيل</span>
        {orderType === 'pickup' ? (
          <span className="text-[#27834B] font-bold">مجاني</span>
        ) : (
          <CurrencyDisplay amount={deliveryFee} />
        )}
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-[#27834B]">
          <span>الخصم</span>
          <span>-<CurrencyDisplay amount={discountAmount} /></span>
        </div>
      )}

      <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-base font-bold text-[#26212B]">
        <span>الإجمالي المطلوب</span>
        <CurrencyDisplay amount={total} className="text-xl text-[#512080]" />
      </div>
    </div>
  );
};
