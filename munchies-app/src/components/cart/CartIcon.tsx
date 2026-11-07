/**
 * @module components/cart/CartIcon
 * @description Shopping bag icon with dynamic badge count and bounce animation.
 */

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';

export const CartIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
  const itemCount = useCartStore((state) => state.getItemCount());
  const openCartDrawer = useUIStore((state) => state.openCartDrawer);

  return (
    <button
      onClick={openCartDrawer}
      className={`relative p-2.5 rounded-full text-gray-700 hover:text-[#512080] hover:bg-gray-100 transition-all cursor-pointer select-none active:scale-95 ${className}`}
      aria-label="Shopping Cart"
    >
      <ShoppingBag className="w-5 h-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -end-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[#FFDA35] text-[#26212B] text-[11px] font-black shadow-xs ring-2 ring-white animate-scale-in number-ltr">
          {itemCount}
        </span>
      )}
    </button>
  );
};

