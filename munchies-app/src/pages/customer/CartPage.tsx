/**
 * @module pages/customer/CartPage
 * @description Dedicated full cart page for reviewing items and launching checkout. Strictly Arabic.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/config/routes';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();

  const { items, clearCart } = useCartStore();
  const itemCount = useCartStore((state) => state.getItemCount());

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
          <Link to={ROUTES.CHECKOUT} className="block pt-2">
            <Button
              variant="yellow"
              size="lg"
              fullWidth
              rightIcon={ArrowLeft}
              className="font-black"
            >
              متابعة إلى إتمام الطلب
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
