/**
 * @module components/cart/CartItem
 * @description Fully responsive cart line item with resilient flexbox wrapping,
 * permanently visible delete button, and clean RTL support. Strictly Arabic.
 */

import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { type CartItem as CartItemType, useCartStore } from '@/stores/cartStore';
import { useProductStore, isProductAvailable } from '@/stores/productStore';
import { useIsCategoryActive } from '@/stores/categoryStore';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { formatPrice } from '@/lib/currency';
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
      className={`py-3.5 sm:py-4 border-b border-border last:border-0 w-full min-w-0 transition-all ${
        !isAvailable ? 'bg-danger-light/50 p-2.5 rounded-xl border-danger/20 my-1' : ''
      }`}
    >
      <div className="flex gap-3 sm:gap-4 items-start w-full min-w-0">
        {/* Product Image (Fixed, controlled size) */}
        <img
          src={item.image}
          alt={productName}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-light-gray border border-border ${
            !isAvailable ? 'grayscale opacity-60' : ''
          }`}
        />

        {/* Details Column (min-w-0 prevents flex children from expanding beyond parent width) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Header Row: Product Name + Permanently Visible Delete Action */}
          <div className="flex items-start justify-between gap-2 w-full min-w-0">
            <div className="flex-1 min-w-0">
              <h4
                className={`text-sm sm:text-base font-bold leading-snug break-words ${
                  isAvailable ? 'text-dark' : 'text-medium-gray line-through'
                }`}
              >
                {productName}
              </h4>

              {/* Status alerts for unavailable product or category */}
              {!isCategoryEnabled ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning-800 mt-1 bg-warning-light px-2 py-0.5 rounded-full border border-warning/30">
                  <AlertCircle className="w-3 h-3 text-warning-700 shrink-0" />
                  <span>القسم ده مش متاح دلوقتي</span>
                </span>
              ) : !isBaseAvailable ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger mt-1 bg-danger-light px-2 py-0.5 rounded-full border border-danger/30">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>خلص مننا مؤقتًا</span>
                </span>
              ) : null}
            </div>

            {/* Remove Action - Guaranteed visible and accessible with shrink-0 */}
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="shrink-0 p-1.5 text-medium-gray hover:text-danger hover:bg-danger-light/70 active:scale-95 transition-all rounded-lg cursor-pointer -mt-1 -mr-1"
              title="حذف المنتج"
              aria-label={`حذف ${productName} من السلة`}
            >
              <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>

          {/* Customization Details (Options list with natural multi-line wrapping) */}
          {item.customizations && item.customizations.length > 0 && (
            <div className="mt-1.5 space-y-0.5 w-full min-w-0">
              {item.customizations.map((group) => {
                const gTitle = getLocalizedText(group.groupName || group.groupId, '');
                const opts = Array.isArray(group.selectedOptions)
                  ? group.selectedOptions
                      .map((o: any) => getLocalizedText(o?.name || o, ''))
                      .filter(Boolean)
                      .join('، ')
                  : getLocalizedText((group as any).optionName, '');
                return (
                  <p
                    key={group.groupId}
                    className="text-[11px] sm:text-xs text-medium-gray leading-normal break-words"
                  >
                    {gTitle && <span className="font-semibold text-dark">{gTitle}: </span>}
                    <span>{opts}</span>
                  </p>
                );
              })}
            </div>
          )}

          {/* Special Instructions / Nutrition Details */}
          {item.specialInstructions && (
            <div className="mt-1 w-full min-w-0">
              <span className="text-[11px] text-warning-800 bg-warning-light/80 border border-warning/20 px-2 py-0.5 rounded-md inline-block max-w-full break-words">
                {item.specialInstructions}
              </span>
            </div>
          )}

          {/* Bottom Row: Quantity Controls & Price */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/40 w-full min-w-0">
            <div className="shrink-0">
              <QuantitySelector
                size="sm"
                value={item.quantity}
                onChange={(q) => updateQuantity(item.id, q)}
                disabled={!isAvailable}
              />
            </div>

            <div className="shrink-0 text-left">
              <span className="font-black tabular-nums number-ltr text-sm sm:text-base text-primary">
                {formatPrice(item.lineTotal)}
              </span>
              {item.quantity > 1 && (
                <span className="text-[10px] text-medium-gray block tabular-nums number-ltr font-medium">
                  ({formatPrice(item.lineTotal / item.quantity)} للواحد)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
