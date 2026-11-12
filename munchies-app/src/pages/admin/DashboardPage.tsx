/**
 * @module pages/admin/DashboardPage
 * @description Admin operational overview with stats and kitchen queue strictly in Arabic.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Eye,
  Check,
  X,
  ChefHat,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ROUTES } from '@/config/routes';
import { formatTime } from '@/lib/date';
import { subscribeToCollection, updateOrderStatusInFirestore } from '@/lib/firestore';
import { getLocalizedText } from '@/lib/i18n';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  // Subscribe to real-time Firestore orders (single source of truth)
  useEffect(() => {
    const unsub = subscribeToCollection<Order>('orders', (remoteOrders) => {
      const sorted = (remoteOrders || []).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setOrders(sorted);
    });

    return () => unsub();
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatusInFirestore(orderId, nextStatus);
      toast.success('تم تحديث حالة الطلب بنجاح');
    } catch (err) {
      console.error('Failed to update order status in Firestore:', err);
      toast.error('فشل تحديث حالة الطلب – تأكد من تسجيل دخولك كمدير');
    }
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const preparingOrders = orders.filter((o) => o.status === 'preparing').length;
  const completedOrders = orders.filter(
    (o) => o.status === 'picked_up' || o.status === 'delivered'
  ).length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-dark">ملخص العمليات والتشغيل</h1>
        <p className="text-xs text-gray-500 mt-1">
          متابعة فورية لطلبات اليوم في مطعم مانشيز وأداء المطبخ
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">
              إجمالي طلبات اليوم
            </span>
            <span className="text-2xl font-black text-dark mt-1 block number-ltr text-start tabular-nums">
              {totalOrders}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">
              بانتظار الموافقة
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block number-ltr text-start tabular-nums">
              {pendingOrders}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">
              قيد التحضير في المطبخ
            </span>
            <span className="text-2xl font-black text-primary mt-1 block number-ltr text-start tabular-nums">
              {preparingOrders}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-primary flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">
              إجمالي الإيرادات
            </span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">
              <CurrencyDisplay amount={totalRevenue} />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-dark">الطلبات الواردة حديثاً</h2>
            <span className="text-xs text-gray-400">مراجعة الطلبات، قبولها وتوجيهها للمطبخ</span>
          </div>
          <Link to={ROUTES.ADMIN_ORDERS}>
            <Button size="sm" variant="secondary">
              عرض جميع الطلبات
            </Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            لا توجد طلبات واردة في الوقت الحالي. ستظهر أي طلبات جديدة هنا تلقائياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-light-gray text-gray-500 uppercase font-bold">
                <tr>
                  <th className="px-5 py-3 text-start">رقم الطلب</th>
                  <th className="px-5 py-3 text-start">العميل</th>
                  <th className="px-5 py-3 text-start">الأصناف المطلوبة</th>
                  <th className="px-5 py-3 text-start">الإجمالي</th>
                  <th className="px-5 py-3 text-start">الحالة</th>
                  <th className="px-5 py-3 text-start">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-primary">
                      <div className="font-mono font-black tabular-nums">#{String(order.orderNumber || '').replace(/^#/, '')}</div>
                      <span className="text-[10px] text-gray-400 font-normal tabular-nums">
                        {formatTime(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-800">{getLocalizedText(order.customerName, '')}</div>
                      <div className="text-gray-400 text-[10px] number-ltr tabular-nums">
                        {order.customerPhone}
                      </div>
                      {(order.type === 'delivery' || (order as any).deliveryType === 'delivery') && (
                        <div className="mt-0.5">
                          <span className="inline-block text-[10px] font-bold text-primary bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100">
                            ديليفري {order.deliveryAddress?.area ? `(${getLocalizedText(order.deliveryAddress.area)})` : ''}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate">
                      {order.items.map((i) => `${i.quantity}x ${getLocalizedText(i.name, 'صنف')}`).join('، ')}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-dark">
                      <CurrencyDisplay amount={order.total} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>قبول</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-bold hover:bg-red-100 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>رفض</span>
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary font-bold text-[11px] hover:bg-primary-100 cursor-pointer transition-colors"
                          >
                            بدء التحضير
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100 cursor-pointer transition-colors"
                          >
                            تحديد كجاهز
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'picked_up')}
                            className="px-2.5 py-1 rounded-lg bg-primary text-white font-bold text-[11px] hover:bg-primary-dark cursor-pointer transition-colors"
                          >
                            تم تسليم الطلب
                          </button>
                        )}
                        <Link to={ROUTES.ORDER_TRACKING.replace(':id', order.id)} target="_blank">
                          <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer" title="معاينة">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
