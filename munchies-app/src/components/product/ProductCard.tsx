/**
 * @module components/product/ProductCard
 * @description Product card with badge overlay, quick-add or customization trigger. Strictly Arabic.
 * Evaluates both individual product availability and global restaurant open/closed status.
 */

import React, { useState } from 'react';
import { Plus, Ban, Clock } from 'lucide-react';
import type { Product } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { CustomizationModal } from './CustomizationModal';
import { useCartStore } from '@/stores/cartStore';
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
  const hasCustomizations =
    product.customizationGroups && product.customizationGroups.length > 0;

  const handleCardClick = () => {
    if (!isStoreOpen) {
      toast.error('المطعم مغلق حالياً ولا يستقبل طلبات جديدة', {
        id: 'store-closed-toast',
      });
      return;
    }
    if (!isCategoryActive) {
      toast.error('عذراً، هذا القسم غير متاح للطلب حالياً', {
        id: `category-disabled-${product.categoryId}`,
      });
      return;
    }
    if (!isProductBaseAvailable) {
      toast.error('هذا الصنف غير متوفر حالياً', {
        id: `unavailable-card-${product.id}`,
      });
      return;
    }
    setIsModalOpen(true);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isStoreOpen) {
      toast.error('المطعم مغلق حالياً ولا يستقبل طلبات جديدة', {
        id: 'store-closed-toast',
      });
      return;
    }
    if (!isCategoryActive) {
      toast.error('عذراً، هذا القسم غير متاح للطلب حالياً', {
        id: `category-disabled-${product.categoryId}`,
      });
      return;
    }
    if (!isProductBaseAvailable) {
      toast.error('عذراً، هذا الصنف غير متوفر للطلب حالياً', {
        id: `unavailable-action-${product.id}`,
      });
      return;
    }

    if (hasCustomizations) {
      setIsModalOpen(true);
    } else {
      addItem({
        productId: product.id,
        name: product.name,
        image: product.image,
        basePrice: product.price,
        quantity: 1,
        customizations: [],
      });
      toast.success(`تمت إضافة "${productName}" إلى السلة`);
    }
  };

  // Determine button label and styling
  let buttonLabel = 'إضافة';
  if (!isCategoryActive) {
    buttonLabel = 'غير متاح حالياً';
  } else if (!isProductBaseAvailable) {
    buttonLabel = 'غير متوفر';
  } else if (!isStoreOpen) {
    buttonLabel = 'المطعم مغلق حالياً';
  } else if (hasCustomizations) {
    buttonLabel = 'تخصيص';
  }

  return (
    <>
      <Card
        hoverable={isOrderable}
        className={`flex flex-col h-full group transition-all duration-300 border ${
          !isAvailable
            ? 'cursor-not-allowed border-red-100/70 bg-gray-50/40 opacity-90'
            : !isStoreOpen
            ? 'cursor-pointer border-amber-100/70 bg-stone-50/40'
            : 'cursor-pointer border-gray-100 hover:border-[#512080]/30'
        }`}
        onClick={handleCardClick}
      >
        {/* Image Container with Badges */}
        <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
          <img
            src={product.image}
            alt={productName}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-500 ${
              !isAvailable
                ? 'grayscale opacity-60 contrast-75'
                : isAvailable && isStoreOpen
                ? 'group-hover:scale-105'
                : 'opacity-90'
            }`}
          />
          <div className="absolute top-2.5 start-2.5 flex flex-col gap-1 z-10">
            {!isCategoryActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-600 text-white shadow-md">
                <Ban className="w-3 h-3" />
                <span>القسم غير متاح حالياً</span>
              </span>
            ) : !isProductBaseAvailable ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-600 text-white shadow-md">
                <Ban className="w-3 h-3" />
                <span>غير متوفر حالياً</span>
              </span>
            ) : !isStoreOpen ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-600 text-white shadow-md">
                <Clock className="w-3 h-3" />
                <span>المطعم مغلق</span>
              </span>
            ) : (
              <>
                {product.isBestSeller && (
                  <Badge variant="best-seller">الأكثر طلباً</Badge>
                )}
                {product.isNew && <Badge variant="new">جديد</Badge>}
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`font-extrabold text-base transition-colors line-clamp-1 ${
                  !isAvailable
                    ? 'text-gray-500 line-through decoration-red-400/60'
                    : isAvailable && isStoreOpen
                    ? 'text-[#26212B] group-hover:text-[#512080]'
                    : 'text-[#26212B]'
                }`}
              >
                {productName}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {productDesc}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 gap-2">
            <CurrencyDisplay
              amount={product.price}
              className={`text-base shrink-0 ${
                isOrderable ? 'text-[#512080]' : 'text-gray-400'
              }`}
            />

            <Button
              size="sm"
              variant={
                !isOrderable
                  ? 'ghost'
                  : hasCustomizations
                  ? 'secondary'
                  : 'yellow'
              }
              disabled={!isOrderable}
              onClick={handleActionClick}
              leftIcon={
                !isOrderable ? undefined : hasCustomizations ? undefined : Plus
              }
              className={
                !isAvailable
                  ? 'bg-red-50 text-red-600 border border-red-200 cursor-not-allowed opacity-90 font-bold hover:bg-red-50 hover:text-red-600'
                  : !isStoreOpen
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed opacity-90 font-bold hover:bg-amber-50 hover:text-amber-700 text-[11px]'
                  : 'shadow-2xs'
              }
            >
              {buttonLabel}
            </Button>
          </div>
        </div>
      </Card>

      <CustomizationModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
