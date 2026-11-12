/**
 * @module components/home/BestSellersSection
 * @description Best Sellers section showcasing top-ordered items.
 * Clean card layout with authentic food imagery, clear pricing, and direct customization/add-to-cart.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Flame } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useProductStore, isProductAvailable } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import { useIsStoreOpen } from '@/stores/restaurantStore';
import { isCategoryActive } from '@/stores/categoryStore';
import { CustomizationModal } from '@/components/product/CustomizationModal';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

export const BestSellersSection: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const products = useProductStore((s) => s.products);
  const addItem = useCartStore((s) => s.addItem);
  const isStoreOpen = useIsStoreOpen();

  // Filter for available best sellers
  const availableProducts = products.filter(isProductAvailable);
  const bestSellers = availableProducts.filter((p) => p.isBestSeller);

  // Take top 4 or fallback to available products if none flagged
  const displayProducts = (bestSellers.length > 0 ? bestSellers : availableProducts).slice(0, 4);

  const handleProductClick = (product: Product, isCatActive: boolean) => {
    if (!isStoreOpen) {
      toast.error('معلش، إحنا قافلين دلوقتي. راجعنا قريب!', { id: 'store-closed' });
      return;
    }
    if (!isCatActive) {
      toast.error('القسم ده مش متاح للطلب دلوقتي', { id: `category-disabled-${product.categoryId}` });
      return;
    }
    setSelectedProduct(product);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product, isCatActive: boolean) => {
    e.stopPropagation();

    if (!isStoreOpen) {
      toast.error('معلش، إحنا قافلين دلوقتي. راجعنا قريب!', { id: 'store-closed' });
      return;
    }
    if (!isCatActive) {
      toast.error('القسم ده مش متاح للطلب دلوقتي', { id: `category-disabled-${product.categoryId}` });
      return;
    }

    const hasCustomizations = product.customizationGroups && product.customizationGroups.length > 0;
    if (hasCustomizations) {
      setSelectedProduct(product);
    } else {
      const resolvedImg =
        product.image && !product.image.includes('unsplash.com')
          ? product.image
          : '/hero_burger_clean_cutout.png';

      addItem({
        productId: product.id,
        name: product.name,
        image: resolvedImg,
        basePrice: product.price,
        quantity: 1,
        customizations: [],
      });
      toast.success(`ضيفنا "${product.name.ar}" للسلة!`);
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center text-primary">
            <Flame className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-dark tracking-tight">
            أكتر حاجات الناس بتحبها
          </h2>
        </div>

        <Link
          to={ROUTES.MENU}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-light transition-colors group cursor-pointer"
        >
          <span>شوف المنيو</span>
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        </Link>
      </div>

      {/* Product Grid: 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {displayProducts.map((product, idx) => {
          const isCatActive = isCategoryActive(product.categoryId);
          const isOrderable = isStoreOpen && isCatActive;

          const localCuts = [
            '/hero_burger_clean_cutout.png',
            '/hero_burger_perfect.png',
            '/hero_food_blended.png',
            '/hero_burger.png',
          ];
          const displayImage = product.image && !product.image.includes('unsplash.com')
            ? product.image
            : localCuts[idx % localCuts.length] || product.image;

          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product, isCatActive)}
              className="group bg-white rounded-2xl p-3 sm:p-3.5 shadow-card hover:shadow-card-hover border border-border transition-all duration-200 flex flex-col justify-between cursor-pointer relative"
            >
              {/* Image Box */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-light-gray flex items-center justify-center p-3 select-none">
                {/* Best Seller Badge */}
                <div className="absolute top-2 end-2 z-10">
                  <span className="px-2 py-0.5 rounded-md bg-yellow text-dark text-[10px] sm:text-xs font-black">
                    الأكثر طلباً
                  </span>
                </div>

                {/* Unavailable / Store Closed Overlay if applicable */}
                {!isOrderable && (
                  <div className="absolute inset-0 bg-dark/40 backdrop-blur-2xs z-20 flex items-center justify-center p-2 text-center">
                    <span className="px-2.5 py-1 rounded-lg bg-dark/80 text-white text-[10px] sm:text-xs font-bold">
                      {!isStoreOpen ? 'قافلين دلوقتي' : 'خلص مننا مؤقتًا'}
                    </span>
                  </div>
                )}

                {/* Product Food Image */}
                <img
                  src={displayImage}
                  alt={product.name.ar}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/hero_burger_clean_cutout.png';
                  }}
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-300 relative z-0"
                />
              </div>

              {/* Bottom Info: Title, Price, Quick Add Button */}
              <div className="pt-2.5 sm:pt-3 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-xs sm:text-sm text-dark line-clamp-1 group-hover:text-primary transition-colors">
                    {product.name.ar}
                  </h3>
                  <div className="mt-0.5">
                    <CurrencyDisplay
                      amount={product.price}
                      className="font-black text-xs sm:text-sm text-primary"
                    />
                  </div>
                </div>

                {/* Circular Yellow Add-to-Cart Button */}
                <button
                  type="button"
                  onClick={(e) => handleQuickAdd(e, product, isCatActive)}
                  disabled={!isOrderable}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
                    isOrderable
                      ? 'bg-yellow hover:bg-yellow-dark text-dark active:scale-95 shadow-xs'
                      : 'bg-light-gray text-medium-gray cursor-not-allowed'
                  }`}
                  aria-label={`ضيف ${product.name.ar} للسلة`}
                  title={`ضيف ${product.name.ar} للسلة`}
                >
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customization Modal */}
      {selectedProduct && (
        <CustomizationModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
};
