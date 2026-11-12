/**
 * @module pages/customer/CheckoutPage
 * @description Guided 3-step mobile checkout UX for Munchie's.
 * Step 1: Fulfillment Method | Step 2: Customer & Address Details | Step 3: Review & Confirm.
 * Fully responsive, strictly Arabic, with real-time price synchronization and backend security.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Truck,
  Banknote,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
  ShoppingBag,
} from 'lucide-react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getLocalizedText } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useProductStore, isProductAvailable } from '@/stores/productStore';
import { normalizeEgyptianPhone, isValidEgyptianPhone } from '@/lib/validators';
import {
  useIsStoreOpen,
  useRestaurantStore,
  isStoreCurrentlyOpen,
  getTodayWorkingHoursText,
} from '@/stores/restaurantStore';
import { useCategoryStore, isCategoryActive, getCategoryName } from '@/stores/categoryStore';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { DigitalReceiptModal } from '@/components/order/DigitalReceiptModal';
import { callCreateOrder } from '@/lib/functions';
import { ROUTES } from '@/config/routes';
import type { Order } from '@/types';

// Zod Schema for Delivery Address
const deliveryAddressSchema = z
  .string()
  .trim()
  .min(5, 'من فضلك اكتب عنوان التوصيل بالتفصيل');

const CHECKOUT_STEPS = [
  { number: 1, title: 'الاستلام' },
  { number: 2, title: 'البيانات' },
  { number: 3, title: 'المراجعة' },
] as const;

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart, revalidatePrices } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const customerProfile = useAuthStore((state) => state.customerProfile);
  const activeProfile = customerProfile || user;

  const isStoreOpen = useIsStoreOpen();
  const isManualClosed = useRestaurantStore((s) => s.isManualClosed);
  const closureMessage = useRestaurantStore((s) => s.closureMessage);
  const todayHours = getTodayWorkingHoursText();
  useCategoryStore((s) => s.categories);
  const currentProducts = useProductStore((s) => s.products);

  // Check for inactive categories
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

  // Restaurant operational & delivery settings
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(25);
  const [branchAddress, setBranchAddress] = useState('حديقة الورد أمام الراية – فرع الكورنيش، أسوان');

  // Checkout 3-step navigation state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Fulfillment State
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');

  // Step 2: Customer info
  const [fullNameInput, setFullNameInput] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const fullName = fullNameInput ?? activeProfile?.fullName ?? '';
  const phone = phoneInput ?? activeProfile?.phone ?? '';
  const email = emailInput ?? activeProfile?.email ?? '';

  // Step 2: Delivery Address info
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Live order calculation
  const subtotal = useCartStore((s) => s.getSubtotal());
  const discountAmount = useCartStore((s) => s.discountAmount);
  const effectiveDeliveryFee = orderType === 'delivery' ? deliveryFee : 0;
  const total = Math.max(0, subtotal + effectiveDeliveryFee - discountAmount);

  // Revalidate cart prices against Firestore on checkout entry
  useEffect(() => {
    let active = true;
    const syncLatestCatalog = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        if (!active || snap.empty) return;
        const latestProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        const updatedNames = revalidatePrices(latestProducts);
        if (updatedNames.length > 0) {
          toast('تم تحديث أسعار بعض الأصناف في السلة لأحدث أسعار المنيو', {
            id: 'checkout-price-sync',
          });
        }
      } catch {
        const updatedNames = revalidatePrices(useProductStore.getState().products);
        if (updatedNames.length > 0) {
          toast('تم تحديث أسعار بعض الأصناف في السلة لأحدث أسعار المنيو', {
            id: 'checkout-price-sync',
          });
        }
      }
    };
    syncLatestCatalog();
    return () => {
      active = false;
    };
  }, [revalidatePrices]);

  // Real-time listener for restaurant delivery settings
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

  // Redirect to menu if cart is empty
  useEffect(() => {
    if (items.length === 0 && !submittedOrder) {
      navigate(ROUTES.MENU);
    }
  }, [items, navigate, submittedOrder]);

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    if (orderType === 'delivery' && !deliveryEnabled) {
      toast.error('الديليفري غير متاح حاليًا في أسوان، يرجى اختيار الاستلام من الفرع');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    if (!fullName.trim()) {
      toast.error('من فضلك اكتب اسمك بالكامل');
      return false;
    }

    if (!phone.trim()) {
      toast.error('من فضلك اكتب رقم الموبايل للتواصل');
      return false;
    }

    const normalizedPhone = normalizeEgyptianPhone(phone);
    if (!isValidEgyptianPhone(normalizedPhone)) {
      toast.error('من فضلك اكتب رقم موبايل مصري صحيح مكون من 11 رقم (مثال: 01025707026)');
      return false;
    }

    if (orderType === 'delivery') {
      const addressValidation = deliveryAddressSchema.safeParse(deliveryAddress);

      if (!addressValidation.success) {
        toast.error(addressValidation.error.issues[0].message);
        return false;
      }
    }

    return true;
  };

  // Step Navigation handlers
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToStep = (targetStep: 1 | 2 | 3) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (targetStep === 2 && validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetStep === 3 && validateStep1() && validateStep2()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final Order Submission
  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isSubmitting) return;

    if (!isStoreCurrentlyOpen()) {
      toast.error('معلش، المطعم قافل دلوقتي ومش بيستقبل طلبات جديدة');
      return;
    }

    if (hasDisabledCategoryItems) {
      const itemName = disabledCategoryItem
        ? (typeof disabledCategoryItem.name === 'object' && disabledCategoryItem.name?.ar
            ? disabledCategoryItem.name.ar
            : 'أحد الأصناف')
        : 'أحد الأصناف';
      toast.error(`"${itemName}" تبع قسم مش متاح دلوقتي (${disabledCategoryName}). يرجى حذفه من السلة لإكمال الطلب`);
      return;
    }

    const currentProds = useProductStore.getState().products;
    const unavailable = items.find((item) => {
      const prod = currentProds.find((p) => p.id === item.productId);
      return prod && !isProductAvailable(prod);
    });

    if (unavailable) {
      const name =
        typeof unavailable.name === 'object' && unavailable.name?.ar
          ? unavailable.name.ar
          : 'أحد الأصناف';
      toast.error(`"${name}" غير متاح حاليًا. يرجى حذفه من السلة لإكمال الطلب`);
      return;
    }

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    const normalizedPhone = normalizeEgyptianPhone(phone);

    // Revalidate cart prices right before final dispatch
    revalidatePrices(useProductStore.getState().products);

    let constructedAddress: any = null;
    if (orderType === 'delivery') {
      const cleanAddress = deliveryAddress.trim();
      constructedAddress = {
        id: `addr_${Date.now()}`,
        label: 'عنوان التوصيل',
        area: '',
        street: cleanAddress,
        addressLine1: cleanAddress,
        addressLine2: '',
        building: '',
        deliveryInstructions: '',
        notes: '',
        city: 'أسوان',
        isDefault: true,
      };
    }

    setIsSubmitting(true);
    try {
      const customerEmail = email.trim() || activeProfile?.email || '';
      const latestItems = useCartStore.getState().items;

      const result = await callCreateOrder({
        items: latestItems,
        orderType,
        deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
        deliveryAddress: constructedAddress,
        customerSnapshot: {
          name: fullName.trim(),
          phone: normalizedPhone,
          email: customerEmail,
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full min-w-0" dir="rtl">
      {/* Restaurant Closed Warning Alert */}
      {!isStoreOpen && (
        <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-xl bg-danger-light border border-danger/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-danger">
            <h4 className="font-black text-danger">
              معلش، قافلين دلوقتي ومش بنستقبل طلبات
            </h4>
            <p className="mt-0.5 leading-relaxed text-xs">
              {isManualClosed ? (
                closureMessage || 'استلام الطلبات متوقف مؤقتًا، وهنرجع نستقبل طلباتك قريب!'
              ) : (
                <>
                  مواعيد شغلنا النهارده: <span className="font-bold">{todayHours || 'قافلين'}</span>.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Inactive Category Warning Alert */}
      {hasDisabledCategoryItems && (
        <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900">
            <h4 className="font-black text-amber-900">
              في أصناف مش متاحة للطلب دلوقتي
            </h4>
            <p className="mt-0.5 leading-relaxed text-xs text-amber-800">
              طلبك فيه أصناف من قسم <span className="font-bold">"{disabledCategoryName}"</span> وهو مش متاح حاليًا. يرجى حذفها لإتمام الطلب.
            </p>
          </div>
        </div>
      )}

      {/* Header & 3-Step Progress Indicator */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-black text-dark">
            إتمام الطلب
          </h1>
          <span className="text-xs text-medium-gray font-bold">
            خطوة {currentStep} من 3
          </span>
        </div>

        {/* Compact Progress Indicator */}
        <div className="bg-white rounded-xl border border-border p-3 sm:p-4">
          <div className="flex items-center justify-between">
            {CHECKOUT_STEPS.map((step, idx) => {
              const isCompleted = step.number < currentStep;
              const isCurrent = step.number === currentStep;
              const isClickable = step.number <= currentStep;

              return (
                <React.Fragment key={step.number}>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep(step.number as 1 | 2 | 3)}
                    disabled={!isClickable}
                    className={`flex items-center gap-2 group transition-all ${
                      isClickable ? 'cursor-pointer' : 'cursor-default opacity-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-primary text-white'
                          : isCurrent
                          ? 'bg-primary text-white ring-2 ring-primary/20 ring-offset-2'
                          : 'border border-gray-300 bg-white text-gray-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.number}
                    </div>
                    <span
                      className={`text-xs font-bold transition-colors ${
                        isCurrent
                          ? 'text-dark font-extrabold'
                          : isCompleted
                          ? 'text-primary'
                          : 'text-medium-gray'
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>

                  {idx < CHECKOUT_STEPS.length - 1 && (
                    <div className="flex-1 mx-2 sm:mx-4 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: step.number < currentStep ? '100%' : '0%',
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Steps on Right, Sticky Summary on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">
        {/* Step Form Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* ─────────────────────────────────────────────────────────────
              STEP 1: FULFILLMENT METHOD
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <Card className="p-4 sm:p-6 space-y-5 animate-fade-slide-in">
              <div className="border-b border-border pb-3">
                <h2 className="text-base sm:text-lg font-black text-dark">
                  1. هتستلم إزاي؟
                </h2>
                <p className="text-xs text-medium-gray mt-0.5">
                  اختار الطريقة المناسبة ليك للاستلام في أسوان
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Pickup Selection */}
                <div
                  onClick={() => setOrderType('pickup')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                    orderType === 'pickup'
                      ? 'border-primary bg-primary-50/60 shadow-xs ring-1 ring-primary/20'
                      : 'border-border bg-white hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          orderType === 'pickup'
                            ? 'bg-primary text-white'
                            : 'bg-light-gray text-medium-gray'
                        }`}
                      >
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-dark">
                          استلام من الفرع
                        </h3>
                        <span className="text-[10px] text-medium-gray">Pickup</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-success bg-success-light px-2 py-0.5 rounded-full border border-success/20">
                      مجاني
                    </span>
                  </div>

                  <p className="text-xs text-medium-gray mt-2.5 leading-relaxed">
                    حديقة الورد أمام الراية – فرع الكورنيش، أسوان
                  </p>
                </div>

                {/* Delivery Selection */}
                <div
                  onClick={() => {
                    if (deliveryEnabled) {
                      setOrderType('delivery');
                    } else {
                      toast.error('الديليفري غير متاح حاليًا في أسوان، يرجى اختيار الاستلام من الفرع');
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    !deliveryEnabled
                      ? 'border-border bg-gray-50 opacity-60 cursor-not-allowed'
                      : orderType === 'delivery'
                      ? 'border-primary bg-primary-50/60 shadow-xs ring-1 ring-primary/20 cursor-pointer'
                      : 'border-border bg-white hover:border-primary/30 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          !deliveryEnabled
                            ? 'bg-gray-200 text-medium-gray'
                            : orderType === 'delivery'
                            ? 'bg-primary text-yellow'
                            : 'bg-light-gray text-medium-gray'
                        }`}
                      >
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-dark">
                          توصيل ديليفري
                        </h3>
                        <span className="text-[10px] text-medium-gray">Delivery</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        deliveryEnabled
                          ? 'text-primary bg-primary-50 border-primary/20'
                          : 'text-warning-800 bg-warning-light border-warning/20'
                      }`}
                    >
                      {deliveryEnabled ? `${deliveryFee} ج.م` : 'قريبًا'}
                    </span>
                  </div>

                  <p className="text-xs text-medium-gray mt-2.5 leading-relaxed">
                    {deliveryEnabled
                      ? `توصيل سريع لباب بيتك بأسوان (رسوم: ${deliveryFee} ج.م)`
                      : 'خدمة التوصيل متوقفة مؤقتًا في أسوان'}
                  </p>
                </div>
              </div>

              {/* Branch Details Callout (Only displayed when Pickup is selected) */}
              {orderType === 'pickup' && (
                <div className="p-3.5 rounded-xl bg-light-gray border border-border flex items-start gap-3 text-xs animate-fade-slide-in">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-dark block">
                      مكان استلام طلبك:
                    </span>
                    <span className="text-medium-gray block">
                      {getLocalizedText(branchAddress)}
                    </span>
                    <span className="text-[11px] text-primary font-medium block pt-1">
                      سيكون طلبك جاهزًا للاستلام Fresh وسخن في أسرع وقت.
                    </span>
                  </div>
                </div>
              )}

              {/* Desktop Inline Actions */}
              <div className="hidden sm:flex justify-end pt-3 border-t border-border">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNextStep}
                  leftIcon={ArrowLeft}
                  className="font-bold px-6"
                >
                  التالي: إدخال البيانات
                </Button>
              </div>
            </Card>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: CUSTOMER & ADDRESS DETAILS
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <Card className="p-4 sm:p-6 space-y-5 animate-fade-slide-in">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-dark">
                    2. البيانات {orderType === 'delivery' ? 'وعنوان التوصيل' : 'والتواصل'}
                  </h2>
                  <p className="text-xs text-medium-gray mt-0.5">
                    {orderType === 'delivery'
                      ? 'اكتب عنوانك بالتفصيل عشان الطيار يوصلّك بسرعة'
                      : 'اكتب بياناتك عشان نجهّز الطلب باسمك'}
                  </p>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-light-gray text-dark">
                  {orderType === 'delivery' ? 'توصيل ديليفري' : 'استلام من الفرع'}
                </span>
              </div>

              {/* Customer Contact Information (Always Shown) */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-black text-dark uppercase tracking-wider">
                  بيانات التواصل الأساسية
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="الاسم بالكامل *"
                    value={fullName}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="اكتب اسمك الثلاثي"
                    required
                  />

                  <Input
                    label="رقم الموبايل *"
                    value={phone}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="01025707026"
                    required
                    className="number-ltr text-right"
                  />
                </div>

                <Input
                  label="البريد الإلكتروني (اختياري)"
                  type="email"
                  value={email}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              {/* Delivery Address Field (Only Shown When Delivery is Selected) */}
              {orderType === 'delivery' ? (
                <div className="pt-4 border-t border-border space-y-2.5 animate-fade-slide-in">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="delivery-address-input"
                      className="block text-xs font-black text-dark"
                    >
                      عنوان التوصيل <span className="text-danger">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-primary">
                      رسوم التوصيل: {deliveryFee} ج.م
                    </span>
                  </div>

                  <textarea
                    id="delivery-address-input"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                    required
                    dir="rtl"
                    placeholder="اكتب عنوانك بالتفصيل، مثال: الكورنيش، شارع النفق، عمارة 12، الدور الثالث..."
                    className="w-full min-h-[96px] rounded-xl border border-border p-3 text-xs sm:text-sm text-dark text-right leading-relaxed placeholder:text-medium-gray/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-y"
                  />
                </div>
              ) : (
                /* Pickup Confirmation Note */
                <div className="p-3.5 rounded-xl bg-primary-50/50 border border-primary/20 text-xs text-primary space-y-1 animate-fade-slide-in">
                  <span className="font-bold block">
                    ✓ استلام من الفرع بدون عنوان توصيل
                  </span>
                  <span className="text-medium-gray block text-[11px]">
                    سيكون طلبك جاهزًا باسم <strong className="text-dark">{fullName || 'المستلم'}</strong> ورقم الهاتف المسجل.
                  </span>
                </div>
              )}

              {/* Order Notes (Always Shown) */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-dark mb-1.5">
                  ملاحظات إضافية للمطبخ أو الطيار (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="أي تعليمات خاصة بالطلب أو التوصيل..."
                  className="w-full rounded-xl border border-border p-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              {/* Desktop Inline Actions */}
              <div className="hidden sm:flex items-center justify-between pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handlePrevStep}
                  rightIcon={ArrowRight}
                  className="text-medium-gray text-xs sm:text-sm"
                >
                  السابق: طريقة الاستلام
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNextStep}
                  leftIcon={ArrowLeft}
                  className="font-bold px-6"
                >
                  التالي: مراجعة الطلب
                </Button>
              </div>
            </Card>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 3: REVIEW & CONFIRM
              ───────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <Card className="p-4 sm:p-6 space-y-5 animate-fade-slide-in">
              <div className="border-b border-border pb-3">
                <h2 className="text-base sm:text-lg font-black text-dark">
                  3. مراجعة وتأكيد الطلب
                </h2>
                <p className="text-xs text-medium-gray mt-0.5">
                  تأكد من اختياراتك وبيانات التواصل قبل تأكيد الإرسال
                </p>
              </div>

              {/* Fulfillment & Customer Recap */}
              <div className="bg-light-gray/60 rounded-xl p-4 border border-border space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-medium-gray">طريقة الاستلام:</span>
                  <span className="font-bold text-dark flex items-center gap-1.5">
                    {orderType === 'delivery' ? (
                      <>
                        <Truck className="w-3.5 h-3.5 text-primary" />
                        <span>توصيل ديليفري (+{deliveryFee} ج.م)</span>
                      </>
                    ) : (
                      <>
                        <Store className="w-3.5 h-3.5 text-primary" />
                        <span>استلام من الفرع (مجاني)</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-medium-gray">بيانات المستلم:</span>
                  <span className="font-bold text-dark">
                    {fullName} • <span className="tabular-nums number-ltr">{phone}</span>
                  </span>
                </div>

                {orderType === 'delivery' && (
                  <div className="flex items-start justify-between pb-2 border-b border-border/60 gap-3">
                    <span className="text-medium-gray shrink-0">عنوان التوصيل:</span>
                    <span className="font-medium text-dark text-right whitespace-pre-line break-words">
                      {deliveryAddress.trim()}
                    </span>
                  </div>
                )}

                {orderType === 'pickup' && (
                  <div className="flex items-start justify-between pb-2 border-b border-border/60">
                    <span className="text-medium-gray shrink-0 ml-2">الفرع:</span>
                    <span className="font-medium text-dark text-left">
                      {getLocalizedText(branchAddress)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-medium-gray">طريقة الدفع:</span>
                  <span className="font-bold text-dark flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>كاش عند الاستلام</span>
                  </span>
                </div>
              </div>

              {/* Items Recap */}
              <div className="space-y-2">
                <span className="text-xs font-black text-dark uppercase tracking-wider block">
                  الأصناف المطلوبة ({items.length})
                </span>

                <div className="bg-white rounded-xl border border-border divide-y divide-border/60">
                  {items.map((item) => (
                    <div key={item.id} className="p-3 flex items-start justify-between gap-3 text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-primary tabular-nums shrink-0">
                            {item.quantity}×
                          </span>
                          <span className="font-bold text-dark truncate">
                            {getLocalizedText(item.name, 'صنف')}
                          </span>
                        </div>

                        {/* Customization Details */}
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="mt-1 text-[11px] text-medium-gray space-y-0.5 pr-5">
                            {item.customizations.map((g) => {
                              const gName = getLocalizedText(g.groupName || g.groupId, '');
                              const opts = Array.isArray(g.selectedOptions)
                                ? g.selectedOptions.map((o) => getLocalizedText(o?.name || o, '')).join('، ')
                                : '';
                              return (
                                <p key={g.groupId} className="truncate">
                                  {gName && <span className="font-medium text-dark">{gName}: </span>}
                                  {opts}
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <span className="font-bold tabular-nums number-ltr text-dark shrink-0">
                        {formatPrice(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-white rounded-xl border border-border p-4 space-y-2 text-xs">
                <div className="flex justify-between text-medium-gray">
                  <span>المجموع</span>
                  <span className="font-bold tabular-nums number-ltr text-dark">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-medium-gray">
                  <span>رسوم التوصيل</span>
                  {orderType === 'pickup' ? (
                    <span className="text-success font-bold">مجاني (استلام من الفرع)</span>
                  ) : (
                    <span className="font-bold tabular-nums number-ltr text-dark">
                      {formatPrice(deliveryFee)}
                    </span>
                  )}
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>الخصم</span>
                    <span className="font-bold tabular-nums number-ltr">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="border-t border-border pt-2.5 flex justify-between items-center text-sm font-bold text-dark">
                  <span>الإجمالي النهائي</span>
                  <span className="font-black tabular-nums number-ltr text-lg text-primary">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Desktop Inline Confirmation Actions */}
              <div className="hidden sm:flex items-center justify-between pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handlePrevStep}
                  rightIcon={ArrowRight}
                  className="text-medium-gray text-xs sm:text-sm"
                >
                  السابق: تعديل البيانات
                </Button>

                <Button
                  variant="yellow"
                  size="lg"
                  onClick={() => handleSubmitOrder()}
                  disabled={!isStoreOpen || hasDisabledCategoryItems}
                  isLoading={isSubmitting}
                  leftIcon={ShoppingBag}
                  className="font-black px-8 shadow-yellow"
                >
                  أكّد الطلب — {formatPrice(total)}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Desktop Sticky Summary Panel (Left Column in RTL) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-28 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-dark">
                ملخص السلة
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-light-gray text-dark">
                {orderType === 'delivery' ? 'Delivery' : 'Pickup'}
              </span>
            </div>

            {/* Compact items list */}
            <div className="max-h-48 overflow-y-auto divide-y divide-border/60 text-xs">
              {items.map((item) => (
                <div key={item.id} className="py-2 flex justify-between items-center">
                  <span className="truncate max-w-[170px] text-dark font-medium">
                    {item.quantity}× {getLocalizedText(item.name, 'صنف')}
                  </span>
                  <span className="font-bold tabular-nums number-ltr text-dark">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <CartSummary orderType={orderType} deliveryFee={deliveryFee} />

            <div className="pt-1">
              {currentStep < 3 ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleNextStep}
                  leftIcon={ArrowLeft}
                  className="font-bold"
                >
                  {currentStep === 1 ? 'متابعة للبيانات' : 'متابعة للمراجعة'}
                </Button>
              ) : (
                <Button
                  variant={isStoreOpen && !hasDisabledCategoryItems ? 'yellow' : 'ghost'}
                  size="lg"
                  fullWidth
                  disabled={!isStoreOpen || hasDisabledCategoryItems}
                  isLoading={isSubmitting}
                  onClick={() => handleSubmitOrder()}
                  leftIcon={ShoppingBag}
                  className="font-black shadow-yellow"
                >
                  أكّد الطلب
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-medium-gray pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>طلبك في أمان مع Munchie's أسوان</span>
            </div>
          </Card>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE STICKY BOTTOM BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] safe-area-pb">
        <div className="flex items-center justify-between gap-3">
          {/* Price Tag */}
          <div className="shrink-0 text-right">
            <span className="text-[10px] text-medium-gray block">الإجمالي</span>
            <span className="text-base font-black tabular-nums number-ltr text-primary">
              {formatPrice(total)}
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="w-10 h-10 rounded-xl border border-border bg-white flex items-center justify-center text-medium-gray hover:text-dark transition-colors shrink-0 cursor-pointer"
                aria-label="الرجوع للخطوة السابقة"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep < 3 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNextStep}
                leftIcon={ArrowLeft}
                className="font-bold text-sm px-5"
              >
                {currentStep === 1 ? 'البيانات' : 'المراجعة'}
              </Button>
            ) : (
              <Button
                variant="yellow"
                size="md"
                disabled={!isStoreOpen || hasDisabledCategoryItems}
                isLoading={isSubmitting}
                onClick={() => handleSubmitOrder()}
                leftIcon={ShoppingBag}
                className="font-black text-sm px-6 shadow-yellow"
              >
                أكّد الطلب
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Spacer (Ensures content is never hidden behind sticky bottom bar) */}
      <div className="sm:hidden h-24" />

      {/* Post-Checkout Digital Receipt & Order Confirmation Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={submittedOrder}
      />
    </div>
  );
};

export default CheckoutPage;
