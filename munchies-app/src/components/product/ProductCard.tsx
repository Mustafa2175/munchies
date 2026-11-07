/**
 * @module components/product/ProductCard
 * @description Product card with badge overlay, quick-add or customization trigger. Strictly Arabic.
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { CustomizationModal } from './CustomizationModal';
import { useCartStore } from '@/stores/cartStore';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const productName = product.name.ar;
  const productDesc = product.description.ar;
  const hasCustomizations =
    product.customizationGroups && product.customizationGroups.length > 0;

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    }
  };

  return (
    <>
      <Card
        hoverable
        className="flex flex-col h-full group cursor-pointer border border-gray-100 hover:border-[#512080]/30 transition-all duration-300"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Image Container with Badges */}
        <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
          <img
            src={product.image}
            alt={productName}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-2.5 start-2.5 flex flex-col gap-1 z-10">
            {product.isBestSeller && (
              <Badge variant="best-seller">
                الأكثر طلباً
              </Badge>
            )}
            {product.isNew && (
              <Badge variant="new">
                جديد
              </Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="font-extrabold text-base text-[#26212B] group-hover:text-[#512080] transition-colors line-clamp-1">
              {productName}
            </h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {productDesc}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
            <CurrencyDisplay
              amount={product.price}
              className="text-base text-[#512080]"
            />

            <Button
              size="sm"
              variant={hasCustomizations ? 'secondary' : 'yellow'}
              onClick={handleActionClick}
              leftIcon={hasCustomizations ? undefined : Plus}
              className="shadow-2xs"
            >
              {hasCustomizations ? 'تخصيص' : 'إضافة'}
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
