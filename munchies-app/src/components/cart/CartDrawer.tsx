/**
 * @module components/cart/CartDrawer
 * @description Slide-in cart panel from the screen side strictly in Arabic.
 * Evaluates item availability and restaurant operational status before allowing checkout.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useProductStore, isProductAvailable } from '@/stores/productStore';
import { useIsStoreOpen, useRestaurantStore } from '@/stores/restaurantStore';
import { useCategoryStore, isCategoryActive, getCategoryName } from '@/stores/categoryStore';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/config/routes';
import toast from 'react-hot-toast';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();

  const { isCartDrawerOpen, closeCartDrawer } = useUIStore();
  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.getItemCount());
  const products = useProductStore((state) => state.products);
  const isStoreOpen = useIsStoreOpen();
  const closureMessage = useRestaurantStore((state) => state.closureMessage);
  // Re-render when categories update
  useCategoryStore((state) => state.categories);

  // Check if any cart item belongs to a disabled category
  const disabledCategoryItem = items.find((item) => {
    const prod = products.find((p) => p.id === item.productId);
    if (!prod) return false;
    return !isCategoryActive(prod.categoryId);
  });

  const disabledCategoryName = disabledCategoryItem
    ? (() => {
        const prod = products.find((p) => p.id === disabledCategoryItem.productId);
        return prod ? getCategoryName(prod.categoryId) : '';
      })()
    : '';

  const hasDisabledCategoryItems = Boolean(disabledCategoryItem);

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
    if (!isStoreOpen) {
      toast.error('المطعم مغلق حالياً ولا يستقبل طلبات جديدة في الوقت الحالي', {
        id: 'drawer-closed-toast',
      });
      return;
    }

    // Check if category is disabled
    if (hasDisabledCategoryItems) {
      toast.error(`أصناف من قسم "${disabledCategoryName}" غير متاحة حالياً. يرجى إزالتها لإتمام الطلب.`);
      return;
    }

    // Validate availability before checkout
    const unavailable = items.find((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return prod && !isProductAvailable(prod);
    });

    if (unavailable) {
      const name =
        typeof unavailable.name === 'object' && unavailable.name?.ar
          ? unavailable.name.ar
          : 'أحد الأصناف';
      toast.error(`الصنف "${name}" غير متوفر حالياً. يرجى إزالته من السلة للمتابعة.`);
      return;
    }

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

          {/* Restaurant Closed Notice in Drawer */}
          {!isStoreOpen && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-start gap-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black block">المطعم مغلق حالياً:</span>
                <span>{closureMessage || 'لا يمكن إتمام الطلب في الوقت الحالي نظراً لغلق المطعم.'}</span>
              </div>
            </div>
          )}

          {/* Inactive Category Notice in Drawer */}
          {hasDisabledCategoryItems && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black block">أصناف غير متاحة للطلب:</span>
                <span>
                  يوجد بالسلة أصناف تتبع قسم "{disabledCategoryName}" وهو غير متاح حالياً. يرجى حذفها لإتمام الطلب.
                </span>
              </div>
            </div>
          )}

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
                  variant={!isStoreOpen || hasDisabledCategoryItems ? 'ghost' : 'yellow'}
                  disabled={!isStoreOpen || hasDisabledCategoryItems}
                  onClick={handleCheckout}
                  size="md"
                  rightIcon={isStoreOpen && !hasDisabledCategoryItems ? ArrowLeft : undefined}
                  className={
                    !isStoreOpen
                      ? 'bg-red-50 text-red-600 border border-red-200 cursor-not-allowed font-bold opacity-90 hover:bg-red-50 hover:text-red-600 text-xs'
                      : hasDisabledCategoryItems
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed font-bold opacity-90 hover:bg-amber-50 hover:text-amber-700 text-xs'
                      : 'font-black'
                  }
                >
                  {!isStoreOpen
                    ? 'المطعم مغلق'
                    : hasDisabledCategoryItems
                    ? 'القسم غير متاح'
                    : 'إتمام الطلب'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
