/**
 * @module components/cart/CartDrawer
 * @description Slide-in cart panel from the screen side strictly in Arabic.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/config/routes';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();

  const { isCartDrawerOpen, closeCartDrawer } = useUIStore();
  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.getItemCount());

  useEffect(() => {
    if (isCartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartDrawerOpen]);

  if (!isCartDrawerOpen) return null;

  const handleCheckout = () => {
    closeCartDrawer();
    navigate(ROUTES.CHECKOUT);
  };

  const handleViewCart = () => {
    closeCartDrawer();
    navigate(ROUTES.CART);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCartDrawer}
      />

      <div className="fixed inset-y-0 start-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F5F3F7]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#512080]" />
              <h2 className="text-base font-bold text-[#26212B]">
                سلة المشتريات ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeCartDrawer}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={ShoppingBag}
                  title="سلة المشتريات فارغة"
                  description="أضف أشهى الساندوتشات والبرجر والبطاطس لتبدأ طلبك الآن!"
                  actionLabel="استكشف قائمة الطعام"
                  onAction={() => {
                    closeCartDrawer();
                    navigate(ROUTES.MENU);
                  }}
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Footer / Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-white shadow-lg space-y-4">
              <CartSummary orderType="pickup" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="secondary" onClick={handleViewCart} size="md">
                  عرض السلة
                </Button>
                <Button
                  variant="yellow"
                  onClick={handleCheckout}
                  size="md"
                  rightIcon={ArrowLeft}
                  className="font-black"
                >
                  إتمام الطلب
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
