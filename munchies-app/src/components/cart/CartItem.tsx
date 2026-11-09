/**
 * @module components/cart/CartItem
 * @description Single line item inside the cart drawer and cart page. Strictly Arabic.
 */

import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { type CartItem as CartItemType, useCartStore } from '@/stores/cartStore';
import { useProductStore, isProductAvailable } from '@/stores/productStore';
import { useIsCategoryActive } from '@/stores/categoryStore';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { getLocalizedText } from '@/lib/i18n';

export interface CartItemProps {
  item: CartItemType;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useCartStore();
  const products = useProductStore((state) => state.products);
  const matchedProduct = products.find((p) => p.id === item.productId);
  const isCategoryEnabled = useIsCategoryActive(matchedProduct?.categoryId);
  const isBaseAvailable = matchedProduct ? isProductAvailable(matchedProduct) : true;
  const isAvailable = isBaseAvailable && isCategoryEnabled;

  const productName = getLocalizedText(item.name, 'صنف');

  return (
    <div
      className={`flex gap-3 py-3 border-b border-gray-100 last:border-0 items-start transition-all ${
        !isAvailable ? 'bg-red-50/40 p-2 rounded-xl -mx-2 border-red-100' : ''
      }`}
    >
      <img
        src={item.image}
        alt={productName}
        className={`w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-50 border border-gray-100 ${
          !isAvailable ? 'grayscale opacity-60' : ''
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4
              className={`text-sm font-bold truncate ${
                isAvailable ? 'text-[#26212B]' : 'text-gray-500 line-through'
              }`}
            >
              {productName}
            </h4>
            {!isCategoryEnabled ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 mt-0.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>القسم غير متاح حالياً</span>
              </span>
            ) : !isBaseAvailable ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 mt-0.5">
                <AlertCircle className="w-3 h-3" />
                <span>غير متوفر حالياً</span>
              </span>
            ) : null}
          </div>
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
            {item.customizations.map((group) => {
              const gTitle = getLocalizedText(group.groupName || group.groupId, '');
              const opts = Array.isArray(group.selectedOptions)
                ? group.selectedOptions
                    .map((o: any) => getLocalizedText(o?.name || o, ''))
                    .filter(Boolean)
                    .join('، ')
                : getLocalizedText((group as any).optionName, '');
              return (
                <p key={group.groupId} className="text-[11px] text-gray-500 truncate">
                  {gTitle && <span className="font-medium text-gray-600">{gTitle}: </span>}
                  {opts}
                </p>
              );
            })}
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
            disabled={!isAvailable}
          />
          <CurrencyDisplay amount={item.lineTotal} className="text-sm text-[#512080]" />
        </div>
      </div>
    </div>
  );
};
