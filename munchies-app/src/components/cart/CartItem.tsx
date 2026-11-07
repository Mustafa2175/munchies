/**
 * @module components/cart/CartItem
 * @description Single line item inside the cart drawer and cart page. Strictly Arabic.
 */

import React from 'react';
import { Trash2 } from 'lucide-react';
import { type CartItem as CartItemType, useCartStore } from '@/stores/cartStore';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';

export interface CartItemProps {
  item: CartItemType;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useCartStore();

  const productName = item.name.ar;

  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0 items-start">
      <img
        src={item.image}
        alt={productName}
        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-50 border border-gray-100"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-[#26212B] truncate">{productName}</h4>
          <button
            onClick={() => removeItem(item.id)}
            className="p-1 text-gray-400 hover:text-[#E84D45] transition-colors rounded-lg hover:bg-red-50 cursor-pointer"
            title="حذف الصنف"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Customization options list */}
        {item.customizations && item.customizations.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {item.customizations.map((group) => (
              <p key={group.groupId} className="text-[11px] text-gray-500 truncate">
                <span className="font-medium text-gray-600">
                  {group.groupName.ar}:
                </span>{' '}
                {group.selectedOptions.map((o) => o.name.ar).join('، ')}
              </p>
            ))}
          </div>
        )}

        {item.specialInstructions && (
          <p className="mt-1 text-[11px] text-amber-700 italic bg-amber-50 px-2 py-0.5 rounded">
            "{item.specialInstructions}"
          </p>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <QuantitySelector
            size="sm"
            value={item.quantity}
            onChange={(q) => updateQuantity(item.id, q)}
          />
          <CurrencyDisplay amount={item.lineTotal} className="text-sm text-[#512080]" />
        </div>
      </div>
    </div>
  );
};
