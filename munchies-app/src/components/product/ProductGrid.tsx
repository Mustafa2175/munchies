/**
 * @module components/product/ProductGrid
 * @description Responsive grid for horizontal product cards with matching skeleton loading states.
 */

import React from 'react';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border p-3 sm:p-3.5 flex flex-row items-center gap-3 sm:gap-4 animate-pulse"
          >
            {/* Image Placeholder on Right */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-gray-200 shrink-0" />

            {/* Info Placeholder in Center */}
            <div className="flex-1 min-w-0 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded-md w-3/4" />
              <div className="h-3 bg-gray-100 rounded-md w-full" />
              <div className="h-3 bg-gray-100 rounded-md w-1/2" />
              <div className="h-4 bg-gray-200 rounded-md w-1/3 pt-1" />
            </div>

            {/* Button Placeholder on Left */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 animate-fade-in">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
