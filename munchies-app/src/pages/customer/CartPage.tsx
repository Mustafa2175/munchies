/**
 * @module pages/customer/CartPage
 * @description Dedicated full cart page for reviewing items and launching checkout. Strictly Arabic.
 * Evaluates both item availability and restaurant operational status.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useProductStore, isProductAvailable } from '@/stores/productStore';
import { useIsStoreOpen, useRestaurantStore, getTodayWorkingHoursText } from '@/stores/restaurantStore';
import { useCategoryStore, isCategoryActive, getCategoryName } from '@/stores/categoryStore';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/config/routes';
import toast from 'react-hot-toast';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();

  const { items, clearCart } = useCartStore();
  const itemCount = useCartStore((state) => state.getItemCount());
  const products = useProductStore((state) => state.products);
  const isStoreOpen = useIsStoreOpen();
  const closureMessage = useRestaurantStore((state) => state.closureMessage);
  const isManualClosed = useRestaurantStore((state) => state.isManualClosed);
  const todayHours = getTodayWorkingHoursText();
  useCategoryStore((state) => state.categories);

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

  const handleProceedToCheckout = () => {
    if (!isStoreOpen) {
      toast.error('معلش، إحنا قافلين دلوقتي ومش بنستقبل طلبات جديدة', {
        id: 'cart-closed-toast',
      });
      return;
    }

    if (hasDisabledCategoryItems) {
      toast.error(`قسم "${disabledCategoryName}" مش متاح دلوقتي. شيل الأصناف دي من السلة عشان تكمل طلبك.`);
      return;
    }

    const unavailable = items.find((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return prod && !isProductAvailable(prod);
    });

    if (unavailable) {
      const name =
        typeof unavailable.name === 'object' && unavailable.name?.ar
          ? unavailable.name.ar
          : 'أحد الأصناف';
      toast.error(`"${name}" خلص مننا مؤقتًا. شيله من السلة عشان تكمل طلبك.`);
      return;
    }

    navigate(ROUTES.CHECKOUT);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
        <EmptyState
          icon={ShoppingBag}
          title="السلة لسه فاضية!"
          description="لسه مستني إيه؟ اختار أكلك المفضل وابدأ طلبك."
          actionLabel="كمّل اختياراتك"
          onAction={() => navigate(ROUTES.MENU)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Restaurant Closed Warning Alert */}
      {!isStoreOpen && (
        <div className="mb-6 p-4 rounded-2xl bg-danger-light border border-danger/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-danger">
            <h4 className="font-black text-danger text-sm">
              قافلين دلوقتي ومش بنستقبل طلبات جديدة
            </h4>
            <p className="mt-0.5 leading-relaxed">
              {isManualClosed ? (
                closureMessage || 'استلام الطلبات متوقف مؤقتًا، وهنرجع نستقبل طلباتك قريب!'
              ) : (
                <>
                  مواعيد شغلنا النهارده: <span className="font-bold">{todayHours || 'قافلين'}</span>. تقدر تقلب في السلة وتكمل طلبك أول ما نفتح.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Inactive Category Warning Alert */}
      {hasDisabledCategoryItems && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900">
            <h4 className="font-black text-amber-900 text-sm">
              تنبيه: في أصناف مش متاحة للطلب دلوقتي
            </h4>
            <p className="mt-0.5 leading-relaxed text-amber-800">
              في السلة أصناف من قسم <span className="font-bold">"{disabledCategoryName}"</span> وهو مش متاح دلوقتي. شيلها من السلة عشان تكمل طلبك.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark">
            السلة
          </h1>
          <p className="text-xs text-medium-gray mt-1">
            معاك {itemCount} أصناف في السلة
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-danger font-bold hover:underline cursor-pointer"
        >
          فضّي السلة
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items list */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-border shadow-card space-y-2">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-border shadow-card space-y-6 sticky top-28">
          <h3 className="font-bold text-base text-dark">
            ملخص الطلب
          </h3>
          <CartSummary orderType="pickup" />
          <div className="pt-2">
            <Button
              variant={!isStoreOpen || hasDisabledCategoryItems ? 'ghost' : 'yellow'}
              size="lg"
              fullWidth
              disabled={!isStoreOpen || hasDisabledCategoryItems}
              rightIcon={isStoreOpen && !hasDisabledCategoryItems ? ArrowLeft : undefined}
              onClick={handleProceedToCheckout}
              className={
                !isStoreOpen
                  ? 'bg-danger-light text-danger border border-danger/30 cursor-not-allowed font-black text-sm opacity-90'
                  : hasDisabledCategoryItems
                  ? 'bg-warning-light text-warning-800 border border-warning/30 cursor-not-allowed font-black text-sm opacity-90'
                  : 'font-black'
              }
            >
              {!isStoreOpen
                ? 'قافلين دلوقتي'
                : hasDisabledCategoryItems
                ? 'القسم مش متاح دلوقتي'
                : 'كمّل طلبك'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
