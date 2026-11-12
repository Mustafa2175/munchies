/**
 * @module components/product/ProductCard
 * @description Compact horizontal product card inspired by Arabic food ordering apps.
 * Features:
 * - Fixed-size product image on the RIGHT (in RTL)
 * - Prominent product title, description, and price in the CENTER
 * - Dedicated shopping cart icon button on the LEFT (in RTL)
 * - Direct add-to-cart when no required customization, or opens CustomizationModal when required
 */

import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Product, CustomizationGroup } from '@/types';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { CustomizationModal } from './CustomizationModal';
import { useCartStore, type SelectedCustomization } from '@/stores/cartStore';
import { isProductAvailable } from '@/stores/productStore';
import { useIsStoreOpen } from '@/stores/restaurantStore';
import { useIsCategoryActive } from '@/stores/categoryStore';
import toast from 'react-hot-toast';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const isStoreOpen = useIsStoreOpen();
  const isCategoryActive = useIsCategoryActive(product.categoryId);

  const isProductBaseAvailable = isProductAvailable(product);
  const isAvailable = isProductBaseAvailable && isCategoryActive;
  const isOrderable = isAvailable && isStoreOpen;
  const productName = product.name.ar;
  const productDesc = product.description.ar;

  // Determine if the product requires customization before adding
  const hasRequiredCustomization = Boolean(
    product.customizationGroups &&
    product.customizationGroups.some((group: CustomizationGroup) => {
      return Boolean(
        group.isRequired ||
        (group.minSelections && group.minSelections > 0) ||
        (group.minSelect && group.minSelect > 0)
      );
    })
  );

  const hasAnyCustomizations = Boolean(
    product.customizationGroups && product.customizationGroups.length > 0
  );

  const displayImage =
    product.image && !product.image.includes('unsplash.com')
      ? product.image
      : '/hero_burger_clean_cutout.png';

  const handleCardClick = () => {
    if (!isStoreOpen) {
      toast.error('معلش، إحنا قافلين دلوقتي. راجعنا قريب!', {
        id: 'store-closed-toast',
      });
      return;
    }
    if (!isCategoryActive) {
      toast.error('القسم ده مش متاح للطلب دلوقتي', {
        id: `category-disabled-${product.categoryId}`,
      });
      return;
    }
    if (!isProductBaseAvailable) {
      toast.error('الصنف ده خلص مننا مؤقتًا', {
        id: `unavailable-card-${product.id}`,
      });
      return;
    }

    if (hasAnyCustomizations) {
      setIsModalOpen(true);
    } else {
      addItem({
        productId: product.id,
        name: product.name,
        image: displayImage,
        basePrice: product.price,
        quantity: 1,
        customizations: [],
      });
      toast.success(`ضيفنا "${productName}" للسلة!`);
    }
  };

  const handleCartButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isStoreOpen) {
      toast.error('معلش، إحنا قافلين دلوقتي. راجعنا قريب!', {
        id: 'store-closed-toast',
      });
      return;
    }
    if (!isCategoryActive) {
      toast.error('القسم ده مش متاح للطلب دلوقتي', {
        id: `category-disabled-${product.categoryId}`,
      });
      return;
    }
    if (!isProductBaseAvailable) {
      toast.error('الصنف ده خلص مننا مؤقتًا', {
        id: `unavailable-action-${product.id}`,
      });
      return;
    }

    if (hasRequiredCustomization) {
      setIsModalOpen(true);
      return;
    }

    const defaultCustomizations: SelectedCustomization[] = [];

    if (product.customizationGroups) {
      product.customizationGroups.forEach((group: CustomizationGroup) => {
        const defaultOpt = group.options?.find((o) => o.isDefault);
        if (defaultOpt) {
          defaultCustomizations.push({
            groupId: group.id,
            groupName: group.name,
            selectedOptions: [
              {
                optionId: defaultOpt.id,
                name: defaultOpt.name,
                price: defaultOpt.price,
              },
            ],
          });
        }
      });
    }

    addItem({
      productId: product.id,
      name: product.name,
      image: displayImage,
      basePrice: product.price,
      quantity: 1,
      customizations: defaultCustomizations,
    });

    toast.success(`ضيفنا "${productName}" للسلة!`);
  };

  return (
    <>
      <article
        onClick={handleCardClick}
        dir="rtl"
        className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-row items-center p-3 sm:p-3.5 gap-3 sm:gap-4 select-none cursor-pointer ${
          !isAvailable
            ? 'border-danger/20 bg-gray-50/60 opacity-75 cursor-not-allowed'
            : !isStoreOpen
            ? 'border-warning/20 bg-stone-50/50 cursor-pointer'
            : 'border-border hover:border-primary-200 shadow-card hover:shadow-card-hover'
        }`}
      >
        {/* 1. RIGHT SIDE in RTL: Fixed-size Image with Badges */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-light-gray shrink-0 select-none">
          <img
            src={displayImage}
            alt={productName}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/hero_burger_clean_cutout.png';
            }}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              !isAvailable
                ? 'grayscale opacity-60'
                : isAvailable && isStoreOpen
                ? 'group-hover:scale-105'
                : 'opacity-90'
            }`}
          />

          {/* Badges Overlay on Image */}
          <div className="absolute top-1.5 start-1.5 flex flex-col gap-1 z-10 pointer-events-none">
            {!isCategoryActive ? (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-danger text-white">
                مش متاح
              </span>
            ) : !isProductBaseAvailable ? (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-danger text-white">
                خلص مننا مؤقتًا
              </span>
            ) : !isStoreOpen ? (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-warning text-dark">
                قافلين
              </span>
            ) : product.isBestSeller ? (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-yellow text-dark">
                الأكثر طلباً
              </span>
            ) : product.isNew ? (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-primary text-white">
                جديد
              </span>
            ) : null}
          </div>
        </div>

        {/* 2. CENTER in RTL: Product Info (Name, Description, Price) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5 text-start">
          <div>
            <h3
              className={`font-black text-sm sm:text-base leading-snug line-clamp-1 transition-colors ${
                !isAvailable
                  ? 'text-medium-gray line-through decoration-danger/40'
                  : isAvailable && isStoreOpen
                  ? 'text-dark group-hover:text-primary'
                  : 'text-dark'
              }`}
            >
              {productName}
            </h3>
            <p className="text-xs text-medium-gray line-clamp-2 leading-relaxed mt-1">
              {productDesc}
            </p>
          </div>

          {/* Price */}
          <div className="mt-2 flex items-baseline gap-1">
            <CurrencyDisplay
              amount={product.price}
              className={`font-black text-sm sm:text-base ${
                isOrderable ? 'text-primary' : 'text-medium-gray'
              }`}
            />
          </div>
        </div>

        {/* 3. LEFT SIDE in RTL: Dedicated Shopping Cart Button */}
        <div className="shrink-0 flex items-center justify-center self-end sm:self-center mb-0.5 sm:mb-0">
          <button
            type="button"
            onClick={handleCartButtonClick}
            disabled={!isOrderable}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${
              isOrderable
                ? 'bg-yellow hover:bg-yellow-dark text-dark hover:scale-105 shadow-xs'
                : 'bg-light-gray text-medium-gray cursor-not-allowed'
            }`}
            aria-label={`ضيف ${productName} للسلة`}
            title={`ضيف ${productName} للسلة`}
          >
            <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
          </button>
        </div>
      </article>

      {/* Customization Modal */}
      <CustomizationModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
