/**
 * @module pages/customer/AccountOrdersPage
 * @description Authenticated customer's order history fetched from Firestore filtered strictly by customerId.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/stores/authStore';
import { parseDate } from '@/lib/date';
import { OrderCard } from '@/components/order/OrderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ROUTES } from '@/config/routes';
import type { Order } from '@/types';

export const AccountOrdersPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const customerProfile = useAuthStore((state) => state.customerProfile);
  const uid = customerProfile?.uid || user?.uid;

  const [ordersSnapshot, setOrdersSnapshot] = useState<{ uid: string; items: Order[] } | null>(null);
  const orders = uid && ordersSnapshot?.uid === uid ? ordersSnapshot.items : [];
  const isLoading = Boolean(uid) && ordersSnapshot?.uid !== uid;

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, 'orders'), where('customerId', '==', uid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Order))
          .sort((a, b) => {
            const ta = parseDate(a.createdAt)?.getTime() || 0;
            const tb = parseDate(b.createdAt)?.getTime() || 0;
            return tb - ta;
          });
        setOrdersSnapshot({ uid, items: list });
      },
      (err) => {
        console.warn('Could not load customer orders:', err);
        setOrdersSnapshot({ uid, items: [] });
      }
    );

    return () => unsub();
  }, [uid]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to={ROUTES.ACCOUNT}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#512080] hover:underline"
          >
            <ArrowRight className={`w-3.5 h-3.5 ${isEn ? 'rotate-180' : ''}`} />
            <span>{isEn ? 'Back to Account' : 'العودة لحسابي'}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-dark">
            {isEn ? 'My Orders' : 'طلباتي'}
          </h1>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#512080]/10 text-[#512080]">
          {isEn ? `Total: ${orders.length}` : `عدد الطلبات: ${orders.length}`}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-border space-y-3">
              <Skeleton variant="text" className="w-24 h-4" />
              <Skeleton variant="rectangular" className="w-full h-16" />
              <Skeleton variant="text" className="w-32 h-4" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={isEn ? 'No orders yet!' : 'لسه مفيش طلبات سابقة!'}
          description={
            isEn
              ? 'Our kitchen is ready — choose your favorites from the menu and order now.'
              : 'المطبخ جاهز... اختار اللي على مزاجك من المنيو واطلب دلوقتي.'
          }
          actionLabel={isEn ? 'Browse Menu' : 'شوف المنيو'}
          onAction={() => navigate(ROUTES.MENU)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};
