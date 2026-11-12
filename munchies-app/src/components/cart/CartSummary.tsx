/**
 * @module components/cart/CartSummary
 * @description Subtotal, delivery fee, discounts, and total breakdown. Strictly Arabic.
 * Dynamic delivery fee reflects whether fulfillment has been selected:
 * - Unselected: "تُحدد عند اختيار طريقة الاستلام"
 * - Pickup: "مجاني (استلام من الفرع)"
 * - Delivery: configured delivery fee (e.g. 25 ج.م)
 */

import React from 'react';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/currency';

export interface CartSummaryProps {
  orderType?: 'pickup' | 'delivery' | null;
  deliveryFee?: number;
  showDiscountInput?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  orderType = null,
  deliveryFee: customDeliveryFee,
}) => {
  const subtotal = useCartStore((state) => state.getSubtotal());
  const discountAmount = useCartStore((state) => state.discountAmount);

  const isFulfillmentSelected = orderType === 'pickup' || orderType === 'delivery';
  const isDelivery = orderType === 'delivery';
  const isPickup = orderType === 'pickup';

  // Only apply delivery fee to total when Delivery is explicitly selected
  const deliveryFee = isDelivery ? (customDeliveryFee !== undefined ? customDeliveryFee : 25) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex justify-between text-medium-gray">
        <span>المجموع</span>
        <span className="font-bold tabular-nums number-ltr text-dark font-semibold">
          {formatPrice(subtotal)}
        </span>
      </div>

      <div className="flex justify-between items-center gap-2 text-medium-gray">
        <span className="shrink-0">رسوم التوصيل</span>
        {!isFulfillmentSelected ? (
          <span className="text-xs text-medium-gray font-medium text-left leading-snug">
            تُحدد عند اختيار طريقة الاستلام
          </span>
        ) : isPickup ? (
          <span className="text-success font-bold text-xs sm:text-sm">
            مجاني (استلام من الفرع)
          </span>
        ) : (
          <span className="font-bold tabular-nums number-ltr text-dark font-semibold">
            {formatPrice(deliveryFee)}
          </span>
        )}
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-success">
          <span>الخصم</span>
          <span>
            -<span className="font-bold tabular-nums number-ltr">{formatPrice(discountAmount)}</span>
          </span>
        </div>
      )}

      <div className="border-t border-border pt-3 flex justify-between items-center text-base font-bold text-dark">
        <span>الإجمالي</span>
        <span className="font-bold tabular-nums number-ltr text-xl font-black text-primary">
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
};
