/**
 * @module pages/customer/AccountPage
 * @description Customer profile, contact details, and past order history. Strictly Arabic.
 */

import React from 'react';
import { Phone, Mail, ShoppingBag, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { OrderCard } from '@/components/order/OrderCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/config/routes';
import type { Order } from '@/types';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuthStore();

  const orders: Order[] = JSON.parse(
    localStorage.getItem('munchies_orders') || '[]'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Profile Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary text-yellow flex items-center justify-center font-black text-xl shadow-xs">
            {user?.fullName?.charAt(0) || 'م'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-dark">
              {user?.fullName || 'عميل Munchie\'s'}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-medium-gray mt-1">
              {user?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  {user.email}
                </span>
              )}
              <span className="flex items-center gap-1 number-ltr">
                <Phone className="w-3.5 h-3.5 text-primary" />
                {user?.phone || '01025707026'}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          className="text-danger hover:bg-danger-light self-start sm:self-center"
          leftIcon={LogOut}
        >
          تسجيل الخروج
        </Button>
      </div>

      {/* Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-dark">
            طلباتي
          </h2>
          <span className="text-xs text-medium-gray">
            عدد الطلبات: {orders.length}
          </span>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="لسه مفيش طلبات سابقة!"
            description="المطبخ جاهز... اختار اللي على مزاجك من المنيو واطلب دلوقتي."
            actionLabel="شوف المنيو"
            onAction={() => (window.location.href = ROUTES.MENU)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
