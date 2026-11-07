/**
 * @module pages/customer/OrderTrackingPage
 * @description Real-time order progress timeline with cancellation rules and branch info. Strictly Arabic.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order } from '@/types';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { callCancelOrder } from '@/lib/functions';
import { formatDate } from '@/lib/date';
import { ROUTES } from '@/config/routes';

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch or listen to order
  useEffect(() => {
    if (!id) return;

    // Load from local orders storage first
    const localOrders: Order[] = JSON.parse(
      localStorage.getItem('munchies_orders') || '[]'
    );
    const found = localOrders.find((o) => o.id === id);
    if (found) {
      setOrder(found);
    } else {
      // Mock fallback order for testing
      setOrder({
        id: id,
        orderNumber: `ORD-${id.slice(-4) || '1024'}`,
        userId: 'guest',
        customerName: 'عميل مانشيز',
        customerPhone: '01025707026',
        customerEmail: 'customer@example.com',
        type: 'pickup',
        status: 'pending',
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        items: [
          {
            id: '1',
            productId: 'munchies-beef',
            name: { ar: 'مانشيز بيف', en: 'Munchies Beef' },
            image:
              'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
            unitPrice: 140,
            quantity: 1,
            totalPrice: 140,
          },
        ],
        subtotal: 140,
        discount: 0,
        deliveryFee: 0,
        total: 140,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [
          {
            status: 'pending',
            timestamp: new Date().toISOString(),
            note: 'تم استلام الطلب',
          },
        ],
      });
    }
  }, [id]);

  if (!order) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#512080] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Can cancel only before 'preparing' starts
  const canCancel =
    order.status === 'pending' || order.status === 'confirmed';

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await callCancelOrder(order.id, 'طلب العميل إلغاء الأوردر');
      setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      toast.success('تم إلغاء الطلب بنجاح');
      setIsCancelModalOpen(false);
    } catch {
      toast.error('تعذر إلغاء الطلب');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFDA35]" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              متابعة الطلب الحالية
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#26212B] mt-1">
            {order.orderNumber}
          </h1>
          <span className="text-xs text-gray-400">
            {formatDate(order.createdAt)}
          </span>
        </div>
        <StatusBadge status={order.status} locale="ar" className="self-start sm:self-center" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Timeline column */}
        <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-6">
          <h2 className="text-base font-extrabold text-[#26212B]">
            مراحل تحضير الطلب
          </h2>
          <OrderTimeline
            currentStatus={order.status}
            statusHistory={order.statusHistory}
            locale="ar"
          />

          {/* Cancellation section */}
          {canCancel && (
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                يمكنك إلغاء الطلب قبل بدء التجهيز في المطبخ.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-[#E84D45] hover:bg-red-50 hover:text-red-700"
              >
                إلغاء الطلب
              </Button>
            </div>
          )}
        </div>

        {/* Order Details & Branch Info */}
        <div className="md:col-span-5 space-y-6">
          {/* Branch pickup card */}
          <Card className="p-6 space-y-4 bg-[#F5F3F7]/50 border-gray-200">
            <h3 className="text-sm font-bold text-[#26212B] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#512080]" />
              <span>عنوان الاستلام</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              حديقة الورد أمام الراية – فرع الكورنيش، أسوان
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 text-xs">
              <Phone className="w-4 h-4 text-[#512080]" />
              <a href="tel:01025707026" className="font-bold text-[#512080] number-ltr">
                01025707026
              </a>
            </div>
          </Card>

          {/* Items summary */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#26212B]">
              تفاصيل الأصناف
            </h3>
            <div className="divide-y divide-gray-100 text-xs space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex justify-between">
                  <span>
                    {item.quantity}x {item.name.ar}
                  </span>
                  <CurrencyDisplay amount={item.totalPrice} />
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm font-extrabold text-[#26212B]">
              <span>الإجمالي المطلوب كاش:</span>
              <CurrencyDisplay amount={order.total} className="text-base text-[#512080]" />
            </div>
          </Card>

          <Link to={ROUTES.MENU} className="block text-center">
            <Button variant="secondary" fullWidth size="md">
              طلب أصناف أخرى
            </Button>
          </Link>
        </div>
      </div>

      {/* Cancel Modal Confirmation */}
      <ConfirmDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="تأكيد إلغاء الطلب"
        message="هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ لن تتمكن من التراجع عن هذه الخطوة."
        confirmText="نعم، قم بالإلغاء"
        confirmVariant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
};
