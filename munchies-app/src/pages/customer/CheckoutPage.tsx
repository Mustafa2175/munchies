/**
 * @module pages/customer/CheckoutPage
 * @description Secure checkout flow honoring MVP business rules (Pickup only, Cash on Pickup, ASAP). Strictly Arabic.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Truck,
  Banknote,
  Clock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { callCreateOrder } from '@/lib/functions';
import { ROUTES } from '@/config/routes';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If cart is empty, redirect
  React.useEffect(() => {
    if (items.length === 0) {
      navigate(ROUTES.MENU);
    }
  }, [items, navigate]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      toast.error('يرجى استكمال جميع بيانات العميل (الاسم، الموبايل، البريد)');
      return;
    }

    // Phone validation
    const phoneRegex = /^(010|011|012|015)[0-9]{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      toast.error('يرجى إدخال رقم موبايل مصري صحيح (مثال: 01025707026)');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await callCreateOrder({
        items,
        orderType: 'pickup',
        customerSnapshot: {
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        },
        paymentMethod: 'cash',
        specialInstructions: notes.trim() || undefined,
      });

      clearCart();
      toast.success('تم إرسال طلبك بنجاح للمطعم!');
      navigate(ROUTES.ORDER_TRACKING.replace(':id', result.orderId));
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-[#26212B]">
          إتمام الطلب
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          خطوة واحدة بسيطة لتأكيد طلبك والاستلام من فرع أسوان
        </p>
      </div>

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Elements */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Fulfillment Type */}
            <Card className="p-6">
              <h2 className="text-base font-extrabold text-[#26212B] mb-4">
                ١. طريقة الاستلام
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pickup Option (Active) */}
                <div className="p-4 rounded-2xl border-2 border-[#512080] bg-[#F3EDFA]/40 flex items-start gap-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-[#512080] text-white flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#512080]">
                      استلام من المطعم (Pickup)
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      حديقة الورد أمام الراية – فرع الكورنيش
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-[#27834B] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      متاح ومجاني
                    </span>
                  </div>
                </div>

                {/* Delivery Option (Disabled in MVP) */}
                <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/70 flex items-start gap-3 opacity-70 cursor-not-allowed relative">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-400 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-600">
                      توصيل ديليفري
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      خدمة التوصيل غير مفعلة حالياً ومتاحة قريباً في أسوان
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      قريباً في أسوان
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 2: Pickup Timing & Location */}
            <Card className="p-6">
              <h2 className="text-base font-extrabold text-[#26212B] mb-4">
                ٢. تفاصيل الاستلام
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <MapPin className="w-5 h-5 text-[#512080] shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-[#26212B] block">
                      عنوان الفرع
                    </span>
                    <span className="text-gray-500">حديقة الورد أمام الراية – الكورنيش، أسوان</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <Clock className="w-5 h-5 text-[#512080] shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-[#26212B] block">
                      موعد الاستلام
                    </span>
                    <span className="text-gray-500">
                      أقرب وقت متاح (ASAP)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 3: Customer Details */}
            <Card className="p-6 space-y-4">
              <h2 className="text-base font-extrabold text-[#26212B]">
                ٣. بيانات التواصل
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="الاسم الكامل"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="أحمد محمد"
                  required
                />
                <Input
                  label="رقم الموبايل"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01025707026"
                  required
                  className="number-ltr"
                />
              </div>

              <Input
                label="البريد الإلكتروني"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />

              <div>
                <label className="block text-xs font-semibold text-[#26212B] mb-1.5">
                  ملاحظات إضافية للمطبخ
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="أي تعليمات إضافية بخصوص التحضير أو التغليف..."
                  className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:border-[#512080] focus:ring-2 focus:ring-[#512080]/10"
                />
              </div>
            </Card>

            {/* Step 4: Payment Method */}
            <Card className="p-6">
              <h2 className="text-base font-extrabold text-[#26212B] mb-4">
                ٤. طريقة الدفع
              </h2>

              <div className="p-4 rounded-2xl border-2 border-[#512080] bg-[#F3EDFA]/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#512080] text-[#FFDA35] flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#26212B]">
                      الدفع نقداً عند الاستلام
                    </h4>
                    <p className="text-xs text-gray-500">
                      الدفع كاش عند استلام طلبك من الفرع
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#512080] bg-white px-2.5 py-1 rounded-full border border-[#512080]/20">
                  كاش نقداً
                </span>
              </div>
            </Card>
          </div>

          {/* Sticky Summary & Place Order */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            <Card className="p-6 space-y-6">
              <h3 className="font-bold text-base text-[#26212B]">
                ملخص الحساب
              </h3>

              {/* Items recap */}
              <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 text-xs">
                {items.map((item) => (
                  <div key={item.id} className="py-2 flex justify-between">
                    <span className="truncate max-w-[180px]">
                      {item.quantity}x {item.name.ar}
                    </span>
                    <span className="font-bold text-gray-700 number-ltr">
                      {item.lineTotal} ج.م
                    </span>
                  </div>
                ))}
              </div>

              <CartSummary orderType="pickup" />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="yellow"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  className="font-black shadow-lg shadow-[#FFDA35]/30 hover:scale-[1.01]"
                >
                  تأكيد وإرسال الطلب
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#27834B]" />
                <span>
                  طلب آمن ومضمون من مطعم مانشيز
                </span>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};
