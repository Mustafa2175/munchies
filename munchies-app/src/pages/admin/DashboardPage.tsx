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
  CheckCircle2,
  AlertCircle,
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
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('munchies_orders') || '[]');
    setOrders(stored);
  }, []);

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    const updated = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
            statusHistory: [
              ...(o.statusHistory || []),
              {
                status: nextStatus,
                timestamp: new Date().toISOString(),
                note: `تم تغيير الحالة إلى ${nextStatus}`,
              },
            ],
          }
        : o
    );
    setOrders(updated);
    localStorage.setItem('munchies_orders', JSON.stringify(updated));
    toast.success('تم تحديث حالة الطلب بنجاح');
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
        <h1 className="text-2xl font-black text-[#26212B]">ملخص العمليات والتشغيل</h1>
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
            <span className="text-2xl font-black text-[#26212B] mt-1 block number-ltr text-start">
              {totalOrders}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F3EDFA] text-[#512080] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">
              بانتظار الموافقة
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block number-ltr text-start">
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
            <span className="text-2xl font-black text-[#512080] mt-1 block number-ltr text-start">
              {preparingOrders}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#512080] flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">
              إجمالي الإيرادات
            </span>
            <span className="text-xl font-black text-[#27834B] mt-1 block">
              <CurrencyDisplay amount={totalRevenue} />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#27834B] flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-[#26212B]">الطلبات الواردة حديثاً</h2>
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
              <thead className="bg-[#F5F3F7] text-gray-500 uppercase font-bold">
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
                    <td className="px-5 py-3.5 font-bold text-[#512080]">
                      <div>{order.orderNumber}</div>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {formatTime(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-800">{order.customerName}</div>
                      <div className="text-gray-400 text-[10px] number-ltr">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate">
                      {order.items.map((i) => `${i.quantity}x ${i.name?.ar || (typeof i.name === 'string' ? i.name : '')}`).join('، ')}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-[#26212B]">
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
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>قبول</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-bold hover:bg-red-100 flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>رفض</span>
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 text-[#512080] font-bold text-[11px] hover:bg-purple-100"
                          >
                            بدء التحضير
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100"
                          >
                            تحديد كجاهز
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'picked_up')}
                            className="px-2.5 py-1 rounded-lg bg-[#512080] text-white font-bold text-[11px] hover:bg-[#461C6E]"
                          >
                            تم تسليم الطلب
                          </button>
                        )}
                        <Link to={ROUTES.ORDER_TRACKING.replace(':id', order.id)} target="_blank">
                          <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" title="معاينة">
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
