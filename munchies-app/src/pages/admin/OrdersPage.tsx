/**
 * @module pages/admin/OrdersPage
 * @description Admin orders management with filters and dedicated kitchen ticket modal strictly in Arabic.
 */

import React, { useState, useEffect } from 'react';
import { Search, Printer, Eye, X, UtensilsCrossed, Phone, Clock, MapPin } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateTime } from '@/lib/date';
import toast from 'react-hot-toast';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<Order | null>(null);

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
          }
        : o
    );
    setOrders(updated);
    localStorage.setItem('munchies_orders', JSON.stringify(updated));
    toast.success('تم تحديث حالة الطلب');
  };

  const filtered = orders.filter((o) => {
    const matchesFilter = filterStatus === 'all' || o.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      o.orderNumber.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      o.customerPhone.includes(query);
    return matchesFilter && matchesSearch;
  });

  const statuses = [
    { id: 'all', label: 'كل الطلبات' },
    { id: 'pending', label: 'قيد الانتظار' },
    { id: 'confirmed', label: 'تم التأكيد' },
    { id: 'preparing', label: 'قيد التجهيز' },
    { id: 'ready', label: 'جاهز للاستلام' },
    { id: 'picked_up', label: 'مكتمل' },
    { id: 'cancelled', label: 'ملغي' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#26212B]">إدارة الطلبات الواردة</h1>
          <p className="text-xs text-gray-500 mt-1">
            متابعة فورية ومباشرة لكافة الطلبات المقدمة من عملاء المطعم
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {statuses.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-[#512080] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الطلب، اسم العميل، الهاتف..."
            className="w-full text-xs rounded-xl border border-gray-200 bg-white py-2 ps-3 pe-8 focus:outline-none focus:border-[#512080]"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            لا توجد طلبات تطابق معايير البحث المحددة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#F5F3F7] text-gray-500 font-bold">
                <tr>
                  <th className="px-5 py-3 text-start">رقم الطلب</th>
                  <th className="px-5 py-3 text-start">التاريخ والوقت</th>
                  <th className="px-5 py-3 text-start">بيانات العميل</th>
                  <th className="px-5 py-3 text-start">الأصناف</th>
                  <th className="px-5 py-3 text-start">المبلغ الإجمالي</th>
                  <th className="px-5 py-3 text-start">حالة الطلب</th>
                  <th className="px-5 py-3 text-start">إجراءات المطبخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-bold text-[#512080]">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {formatDateTime(order.createdAt)}
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
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 cursor-pointer text-[11px]"
                          >
                            قبول الطلب
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 text-[#512080] font-bold hover:bg-purple-100 cursor-pointer text-[11px]"
                          >
                            بدء التحضير
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 cursor-pointer text-[11px]"
                          >
                            جاهز
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'picked_up')}
                            className="px-2.5 py-1 rounded-lg bg-[#512080] text-white font-bold hover:bg-[#461C6E] cursor-pointer text-[11px]"
                          >
                            تسليم
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedTicketOrder(order)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#512080] hover:bg-purple-50 cursor-pointer"
                          title="عرض بون المطبخ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicketOrder(order);
                            setTimeout(() => window.print(), 300);
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                          title="طباعة بون فوري"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Kitchen Receipt Modal */}
      {selectedTicketOrder && (
        <Modal
          isOpen={!!selectedTicketOrder}
          onClose={() => setSelectedTicketOrder(null)}
          size="md"
        >
          <div className="space-y-4 printable-ticket">
            {/* Ticket Header */}
            <div className="text-center pb-4 border-b-2 border-dashed border-gray-300">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#512080] text-[#FFDA35] flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <h3 className="font-black text-xl text-[#26212B]">مانشيز MUNCHIE'S</h3>
              </div>
              <p className="text-xs text-gray-500">فرع الكورنيش - حديقة الورد أمام الراية، أسوان</p>
              <p className="text-xs text-gray-500 font-bold number-ltr">01025707026</p>
              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-[#512080] text-white text-xs font-black">
                بون استلام من الفرع (PICKUP)
              </div>
            </div>

            {/* Order meta */}
            <div className="text-xs space-y-1 py-2 border-b border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-500">رقم الأوردر:</span>
                <span className="font-black text-[#512080] text-sm">{selectedTicketOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">التاريخ والوقت:</span>
                <span className="font-bold">{formatDateTime(selectedTicketOrder.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">اسم العميل:</span>
                <span className="font-bold">{selectedTicketOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">رقم الموبايل:</span>
                <span className="font-bold number-ltr">{selectedTicketOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">طريقة الدفع:</span>
                <span className="font-bold text-emerald-700">كاش عند الاستلام</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-2 border-b-2 border-dashed border-gray-300">
              <h4 className="font-black text-xs text-[#26212B] mb-2">أصناف الطلب:</h4>
              <div className="space-y-2.5">
                {selectedTicketOrder.items.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between font-bold text-[#26212B]">
                      <span>{item.quantity}x {item.name?.ar || (typeof item.name === 'string' ? item.name : '')}</span>
                      <CurrencyDisplay amount={item.totalPrice} />
                    </div>
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="ps-4 text-[11px] text-gray-500 space-y-0.5 mt-0.5">
                        {item.customizations.map((c: any, cIdx: number) => (
                          <div key={cIdx}>
                            • {c.groupName?.ar || c.groupId}: {c.selectedOptions?.map((o: any) => o.name?.ar || o.name).join('، ')}
                          </div>
                        ))}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div className="ps-4 text-[10px] text-amber-700 italic">
                        * ملاحظة: {item.specialInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-2 flex justify-between items-center text-base font-black">
              <span>الإجمالي المطلوب نقداً:</span>
              <CurrencyDisplay amount={selectedTicketOrder.total} className="text-lg text-[#512080]" />
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-2 no-print">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedTicketOrder(null)}
              >
                إغلاق
              </Button>
              <Button
                variant="yellow"
                size="sm"
                leftIcon={Printer}
                onClick={() => window.print()}
                className="font-black"
              >
                طباعة البون
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
