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
      type="button"
      onClick={openCartDrawer}
      className={`relative w-10 h-10 flex items-center justify-center rounded-xl text-white hover:text-[#FFDA35] hover:bg-white/10 transition-colors cursor-pointer select-none active:scale-95 ${className}`}
      aria-label="السلة"
    >
      <ShoppingBag className="w-5 h-5" />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFDA35] text-[#26212B] text-[10px] font-black shadow-sm border border-[#260840]/30 animate-scale-in number-ltr">
          {itemCount}
        </span>
      )}
    </button>
  );
};

