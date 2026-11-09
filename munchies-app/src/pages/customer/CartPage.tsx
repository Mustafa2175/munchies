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
  // Subscribe to category changes
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

  const handleProceedToCheckout = () => {
    if (!isStoreOpen) {
      toast.error('المطعم مغلق حالياً ولا يستقبل طلبات جديدة في الوقت الحالي', {
        id: 'cart-closed-toast',
      });
      return;
    }

    if (hasDisabledCategoryItems) {
      toast.error(`أصناف من قسم "${disabledCategoryName}" غير متاحة حالياً. يرجى إزالتها لإتمام الطلب.`);
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
      toast.error(`الصنف "${name}" غير متوفر حالياً. يرجى إزالته من السلة للمتابعة.`);
      return;
    }

    navigate(ROUTES.CHECKOUT);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
        <EmptyState
          icon={ShoppingBag}
          title="سلة المشتريات فارغة"
          description="لم تقم بإضافة أي أصناف إلى سلتك بعد. تفضل بزيارة المنيو واختر ما تحب!"
          actionLabel="استكشف قائمة الطعام"
          onAction={() => navigate(ROUTES.MENU)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Restaurant Closed Warning Alert */}
      {!isStoreOpen && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-red-700">
            <h4 className="font-black text-red-800 text-sm">
              المطعم مغلق حالياً ولا يستقبل طلبات جديدة
            </h4>
            <p className="mt-0.5 leading-relaxed">
              {isManualClosed ? (
                closureMessage || 'استلام الطلبات متوقف مؤقتاً وسنعاود استقبال الطلبات قريباً.'
              ) : (
                <>
                  أوقات العمل المقررة اليوم: <span className="font-bold">{todayHours || 'مغلق'}</span>. يمكنك تصفح السلة وسيتاح تأكيد الطلب فور بدء موعد العمل.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Inactive Category Warning Alert */}
      {hasDisabledCategoryItems && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900">
            <h4 className="font-black text-amber-900 text-sm">
              ⚠️ تنبيه: أصناف غير متاحة للطلب حالياً
            </h4>
            <p className="mt-0.5 leading-relaxed text-amber-800">
              يوجد في السلة أصناف تتبع قسم <span className="font-bold">"{disabledCategoryName}"</span> وهو غير متاح للطلب حالياً. يرجى حذفها لإتمام الطلب.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#26212B]">
            سلة المشتريات
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            لديك {itemCount} أصناف في السلة
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-[#E84D45] font-bold hover:underline cursor-pointer"
        >
          تفريغ السلة
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items list */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-2">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6 sticky top-28">
          <h3 className="font-bold text-base text-[#26212B]">
            ملخص الحساب
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
                  ? 'bg-red-50 text-red-600 border border-red-200 cursor-not-allowed font-black text-sm opacity-90 hover:bg-red-50 hover:text-red-600'
                  : hasDisabledCategoryItems
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed font-black text-sm opacity-90 hover:bg-amber-50 hover:text-amber-700'
                  : 'font-black'
              }
            >
              {!isStoreOpen
                ? 'المطعم مغلق حالياً'
                : hasDisabledCategoryItems
                ? 'القسم غير متاح حالياً'
                : 'متابعة إلى إتمام الطلب'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
