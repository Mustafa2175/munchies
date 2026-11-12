/**
 * @module components/cart/FixedCartBar
 * @description Fixed interactive cart summary bar at the bottom of the screen.
 * Displays live cart item count, current subtotal, and an action to open the cart drawer.
 * Hidden when the cart is empty.
 */

import React from 'react';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';

export const FixedCartBar: React.FC = () => {
  const itemCount = useCartStore((state) => state.getItemCount());
  const subtotal = useCartStore((state) => state.getSubtotal());
  const openCartDrawer = useUIStore((state) => state.openCartDrawer);

  if (itemCount === 0) {
    return null;
  }

  return (
    <aside
      aria-label="شريط السلة المثبت"
      className="fixed bottom-3 inset-x-3 sm:bottom-5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl z-30 animate-slide-up"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <button
        type="button"
        onClick={openCartDrawer}
        className="w-full bg-[#3E1467] hover:bg-primary-600 active:scale-[0.99] text-white rounded-2xl px-4 py-3 sm:px-6 sm:py-3.5 shadow-2xl border border-white/15 flex items-center justify-between gap-3 cursor-pointer select-none transition-all group"
        aria-label={`سلتك فيها ${itemCount} أصناف بإجمالي ${subtotal} جنيه. اضغط عشان تشوف السلة`}
      >
        {/* Right side in RTL: Cart Icon & Item Count */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-yellow text-dark flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.3]" />
          </div>
          <span className="font-black text-xs sm:text-sm text-white tracking-tight">
            سلتك ({itemCount})
          </span>
        </div>

        {/* Center in RTL: Subtotal */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-100 truncate">
          <span className="text-gray-300">المجموع:</span>
          <CurrencyDisplay
            amount={subtotal}
            className="text-xs sm:text-base font-black text-yellow tracking-tight"
          />
        </div>

        {/* Left side in RTL: Action Button "شوف السلة" with Arrow */}
        <div className="flex items-center gap-1 text-xs sm:text-sm font-black text-yellow group-hover:text-yellow-light transition-colors shrink-0">
          <span>شوف السلة</span>
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] transition-transform group-hover:-translate-x-1" />
        </div>
      </button>
    </aside>
  );
};
