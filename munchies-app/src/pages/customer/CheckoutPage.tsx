/**
 * @module pages/customer/CheckoutPage
 * @description Secure checkout flow dynamically syncing Fulfillment Type (Pickup & Delivery) with Admin Settings. Strictly Arabic.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Truck,
  Banknote,
  Clock,
  MapPin,
  ShieldCheck,
  Navigation,
  AlertTriangle,
} from 'lucide-react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getLocalizedText } from '@/lib/i18n';
import { useCartStore } from '@/stores/cartStore';
import { useProductStore, isProductAvailable } from '@/stores/productStore';
import { useIsStoreOpen, useRestaurantStore, isStoreCurrentlyOpen, getTodayWorkingHoursText } from '@/stores/restaurantStore';
import { useCategoryStore, isCategoryActive, getCategoryName } from '@/stores/categoryStore';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { DigitalReceiptModal } from '@/components/order/DigitalReceiptModal';
import { callCreateOrder } from '@/lib/functions';
import { ROUTES } from '@/config/routes';
import type { Order } from '@/types';

// Zod Schema for Aswan Delivery Address
const deliveryAddressSchema = z.object({
  area: z.string().trim().min(2, 'من فضلك اكتب اسم المنطقة في أسوان'),
  street: z.string().trim().min(2, 'من فضلك اكتب اسم الشارع بالتفصيل'),
  buildingApt: z.string().trim().min(1, 'من فضلك اكتب رقم العمارة والدور والشقة'),
  landmark: z.string().trim().optional(),
});

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();

  const isStoreOpen = useIsStoreOpen();
  const isManualClosed = useRestaurantStore((s) => s.isManualClosed);
  const closureMessage = useRestaurantStore((s) => s.closureMessage);
  const todayHours = getTodayWorkingHoursText();
  useCategoryStore((s) => s.categories);
  const currentProducts = useProductStore((s) => s.products);

  const disabledCategoryItem = items.find((item) => {
    const prod = currentProducts.find((p) => p.id === item.productId);
    if (!prod) return false;
    return !isCategoryActive(prod.categoryId);
  });

  const disabledCategoryName = disabledCategoryItem
    ? (() => {
        const prod = currentProducts.find((p) => p.id === disabledCategoryItem.productId);
        return prod ? getCategoryName(prod.categoryId) : '';
      })()
    : '';

  const hasDisabledCategoryItems = Boolean(disabledCategoryItem);

  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(25);
  const [branchAddress, setBranchAddress] = useState('حديقة الورد أمام الراية – فرع الكورنيش، أسوان');

  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  const [buildingApt, setBuildingApt] = useState('');
  const [landmark, setLandmark] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'restaurant'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const isEnabled = !!data.deliveryEnabled;
          setDeliveryEnabled(isEnabled);
          if (!isEnabled) {
            setOrderType('pickup');
          }
          if (typeof data.deliveryFee === 'number') {
            setDeliveryFee(data.deliveryFee);
          }
          if (data.address) {
            setBranchAddress(
              getLocalizedText(data.address, 'حديقة الورد أمام الراية – فرع الكورنيش، أسوان')
            );
          }
        }
      },
      (err) => {
        console.warn('Could not read settings/restaurant:', err);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    if (items.length === 0 && !submittedOrder) {
      navigate(ROUTES.MENU);
    }
  }, [items, navigate, submittedOrder]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isStoreCurrentlyOpen()) {
      toast.error('معلش، المطعم قافل دلوقتي ومش بيستقبل طلبات جديدة.');
      return;
    }

    if (hasDisabledCategoryItems) {
      const itemName = disabledCategoryItem
        ? (typeof disabledCategoryItem.name === 'object' && disabledCategoryItem.name?.ar
            ? disabledCategoryItem.name.ar
            : 'أحد الأصناف')
        : 'أحد الأصناف';
      toast.error(`"${itemName}" تبع قسم مش متاح دلوقتي (${disabledCategoryName}). من فضلك شيله من السلة عشان تكمل طلبك.`);
      return;
    }

    const currentProducts = useProductStore.getState().products;
    const unavailable = items.find((item) => {
      const prod = currentProducts.find((p) => p.id === item.productId);
      return prod && !isProductAvailable(prod);
    });

    if (unavailable) {
      const name =
        typeof unavailable.name === 'object' && unavailable.name?.ar
          ? unavailable.name.ar
          : 'أحد الأصناف';
      toast.error(`"${name}" غير متاح حاليًا. من فضلك شيله من السلة عشان تكمل طلبك.`);
      return;
    }

    if (!fullName.trim() || !phone.trim()) {
      toast.error('من فضلك اكتب اسمك ورقم موبايلك عشان نقدر نأكد الطلب.');
      return;
    }

    const phoneRegex = /^(010|011|012|015)[0-9]{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      toast.error('من فضلك اكتب رقم موبايل مصري صحيح مكوّن من 11 رقم (مثال: 01025707026).');
      return;
    }

    let constructedAddress: any = null;
    if (orderType === 'delivery') {
      const addressValidation = deliveryAddressSchema.safeParse({
        area,
        street,
        buildingApt,
        landmark,
      });

      if (!addressValidation.success) {
        toast.error(addressValidation.error.issues[0].message);
        return;
      }

      constructedAddress = {
        id: `addr_${Date.now()}`,
        label: 'عنوان التوصيل',
        area: area.trim(),
        street: street.trim(),
        addressLine1: street.trim(),
        addressLine2: buildingApt.trim(),
        building: buildingApt.trim(),
        deliveryInstructions: landmark.trim() || '',
        notes: landmark.trim() || '',
        city: 'أسوان',
        isDefault: true,
      };
    }

    setIsSubmitting(true);
    try {
      const guestEmail = email.trim() || `${phone.trim()}@guest.munchies.com`;
      const result = await callCreateOrder({
        items,
        orderType,
        deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
        deliveryAddress: constructedAddress,
        customerSnapshot: {
          name: fullName.trim(),
          phone: phone.trim(),
          email: guestEmail,
        },
        paymentMethod: 'cash',
        specialInstructions: notes.trim() || undefined,
      });

      clearCart();
      setSubmittedOrder(result.order);
      setIsReceiptModalOpen(true);
      toast.success(
        orderType === 'delivery'
          ? 'متقلقش، طلبك وصلنا وبدأنا نجهزه وهيوصلّك على طول!'
          : 'متقلقش، طلبك وصلنا وهنجهزهولك في أسرع وقت!'
      );
    } catch (err: any) {
      toast.error(err.message || 'حصلت مشكلة أثناء تأكيد الطلب، جرّب تاني');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-dark">
          يلا نكمّل طلبك!
        </h1>
        <p className="text-xs text-medium-gray mt-1">
          {orderType === 'delivery'
            ? 'خطوة واحدة ونبدأ نجهزلك طلبك ويوصلّك لحد باب البيت في أسوان'
            : 'خطوة واحدة ونجهزلك طلبك عشان تستلمه Fresh وسخن من فرع أسوان'}
        </p>
      </div>

      {/* Restaurant Closed Warning Alert */}
      {!isStoreOpen && (
        <div className="mb-6 p-4 rounded-2xl bg-danger-light border border-danger/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-danger">
            <h4 className="font-black text-danger text-sm">
              معلش، قافلين دلوقتي ومش بنستقبل طلبات
            </h4>
            <p className="mt-0.5 leading-relaxed">
              {isManualClosed ? (
                closureMessage || 'استلام الطلبات متوقف مؤقتًا، وهنرجع نستقبل طلباتك قريب!'
              ) : (
                <>
                  مواعيد شغلنا النهارده: <span className="font-bold">{todayHours || 'قافلين'}</span>. مش هنقدر نأكد الطلب دلوقتي.
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
              في أصناف مش متاحة للطلب دلوقتي
            </h4>
            <p className="mt-0.5 leading-relaxed text-amber-800">
              طلبك فيه أصناف من قسم <span className="font-bold">"{disabledCategoryName}"</span> وهو مش متاح دلوقتي. شيلها من السلة عشان تكمل طلبك.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Elements */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Fulfillment Type */}
            <Card className="p-6">
              <h2 className="text-base font-extrabold text-dark mb-4">
                1. هتستلم إزاي؟
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pickup Option */}
                <div
                  onClick={() => setOrderType('pickup')}
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    orderType === 'pickup'
                      ? 'border-primary bg-primary-50 shadow-xs ring-1 ring-primary/20'
                      : 'border-border bg-white hover:border-primary/40'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      orderType === 'pickup'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-light-gray text-medium-gray'
                    }`}
                  >
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-dark">
                      Pickup – استلام من الفرع
                    </h3>
                    <p className="text-xs text-medium-gray mt-0.5 leading-relaxed">
                      حديقة الورد أمام الراية – فرع الكورنيش
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-success bg-success-light px-2 py-0.5 rounded-full border border-success/20">
                      متاح ومجاني
                    </span>
                  </div>
                </div>

                {/* Delivery Option */}
                <div
                  onClick={() => {
                    if (deliveryEnabled) {
                      setOrderType('delivery');
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 transition-all ${
                    !deliveryEnabled
                      ? 'border-border bg-light-gray/60 opacity-75 cursor-not-allowed relative'
                      : orderType === 'delivery'
                      ? 'border-primary bg-primary-50 shadow-xs ring-1 ring-primary/20 cursor-pointer'
                      : 'border-border bg-white hover:border-primary/40 cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      !deliveryEnabled
                        ? 'bg-gray-200 text-medium-gray'
                        : orderType === 'delivery'
                        ? 'bg-primary text-yellow shadow-xs'
                        : 'bg-light-gray text-medium-gray'
                    }`}
                  >
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-dark">
                      Delivery – توصيل لحد عندك
                    </h3>
                    <p className="text-xs text-medium-gray mt-0.5 leading-relaxed">
                      {deliveryEnabled
                        ? `توصيل سريع لباب بيتك (رسوم التوصيل: ${deliveryFee} ج.م)`
                        : 'الديليفري مش متاح دلوقتي وهنفتحه قريب في أسوان'}
                    </p>
                    <span
                      className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        deliveryEnabled
                          ? 'text-success bg-success-light border-success/20'
                          : 'text-warning-800 bg-warning-light border-warning/20'
                      }`}
                    >
                      {deliveryEnabled ? 'متاح في أسوان' : 'قريبًا في أسوان'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 2: Dynamic Delivery Address or Pickup Details */}
            {orderType === 'delivery' ? (
              <Card className="p-6 space-y-4 border border-border bg-[#FAF7FC]/40">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary text-yellow flex items-center justify-center">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-extrabold text-dark">
                      2. هنوصلّك فين؟
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-primary bg-white px-2.5 py-1 rounded-full border border-primary/20">
                    رسوم التوصيل: {deliveryFee} ج.م
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-dark mb-1.5">
                      المنطقة في أسوان <span className="text-danger">*</span>
                    </label>
                    <Input
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="مثال: الكورنيش / أطلس / السيل / العقاد"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dark mb-1.5">
                      اسم الشارع <span className="text-danger">*</span>
                    </label>
                    <Input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="مثال: شارع أبطال التحرير متفرع من الكورنيش"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-dark mb-1.5">
                      رقم العمارة / الدور / الشقة <span className="text-danger">*</span>
                    </label>
                    <Input
                      value={buildingApt}
                      onChange={(e) => setBuildingApt(e.target.value)}
                      placeholder="مثال: عمارة 12، الدور الثالث، شقة 5"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dark mb-1.5">
                      علامة مميزة قريبة (اختياري)
                    </label>
                    <Input
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="مثال: جنب صيدلية أو مسجد..."
                    />
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <h2 className="text-base font-extrabold text-dark mb-4">
                  2. تفاصيل الاستلام من الفرع
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-light-gray border border-border">
                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-dark block">
                        عنوان الفرع
                      </span>
                      <span className="text-medium-gray">{getLocalizedText(branchAddress)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-light-gray border border-border">
                    <Clock className="w-5 h-5 text-primary shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-dark block">
                        هتستلم إمتى؟
                      </span>
                      <span className="text-medium-gray">
                        في أسرع وقت ممكن (أول ما يجهز)
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 3: Customer Details */}
            <Card className="p-6 space-y-4">
              <h2 className="text-base font-extrabold text-dark">
                3. بياناتك
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="اسمك إيه؟"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="اكتب اسمك هنا"
                  required
                />
                <Input
                  label="رقم موبايلك"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01025707026"
                  required
                  className="number-ltr"
                />
              </div>

              <Input
                label="الإيميل (اختياري)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com (اختياري)"
              />

              <div>
                <label className="block text-xs font-semibold text-dark mb-1.5">
                  عندك أي ملاحظات على الطلب؟
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="اكتب أي تعليمات للمطبخ أو المندوب..."
                  className="w-full rounded-xl border border-border p-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </Card>

            {/* Step 4: Payment Method */}
            <Card className="p-6">
              <h2 className="text-base font-extrabold text-dark mb-4">
                4. هتدفع إزاي؟
              </h2>

              <div className="p-4 rounded-2xl border-2 border-primary bg-primary-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-yellow flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-dark">
                      {orderType === 'delivery'
                        ? 'كاش عند الاستلام من المندوب'
                        : 'كاش عند الاستلام من الفرع'}
                    </h4>
                    <p className="text-xs text-medium-gray">
                      {orderType === 'delivery'
                        ? 'ادفع كاش للمندوب أول ما طلبك يوصلّك'
                        : 'ادفع كاش لما تستلم طلبك من الفرع'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary bg-white px-2.5 py-1 rounded-full border border-primary/20">
                  كاش
                </span>
              </div>
            </Card>
          </div>

          {/* Sticky Summary & Place Order */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-dark">
                  ملخص الطلب
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-light-gray text-dark">
                  {orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                </span>
              </div>

              {/* Items recap */}
              <div className="max-h-52 overflow-y-auto divide-y divide-border text-xs">
                {items.map((item) => (
                  <div key={item.id} className="py-2 flex justify-between">
                    <span className="truncate max-w-[180px]">
                      {item.quantity}x {getLocalizedText(item.name, 'صنف')}
                    </span>
                    <span className="font-bold text-dark tabular-nums number-ltr">
                      {item.lineTotal} ج.م
                    </span>
                  </div>
                ))}
              </div>

              <CartSummary orderType={orderType} deliveryFee={deliveryFee} />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant={isStoreOpen && !hasDisabledCategoryItems ? 'yellow' : 'ghost'}
                  size="lg"
                  fullWidth
                  disabled={!isStoreOpen || hasDisabledCategoryItems}
                  isLoading={isSubmitting}
                  className={
                    !isStoreOpen
                      ? 'bg-danger-light text-danger border border-danger/30 cursor-not-allowed font-black opacity-90'
                      : hasDisabledCategoryItems
                      ? 'bg-warning-light text-warning-800 border border-warning/30 cursor-not-allowed font-black opacity-90'
                      : 'font-black shadow-md'
                  }
                >
                  {!isStoreOpen
                    ? 'قافلين دلوقتي'
                    : hasDisabledCategoryItems
                    ? 'في أصناف مش متاحة'
                    : isSubmitting
                    ? 'بنأكد طلبك...'
                    : 'أكّد الطلب'}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-medium-gray">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                <span>
                  طلبك في أمان مع Munchie's – فرع أسوان
                </span>
              </div>
            </Card>
          </div>
        </div>
      </form>

      {/* Post-Checkout Digital Receipt & Order Confirmation Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={submittedOrder}
      />
    </div>
  );
};
