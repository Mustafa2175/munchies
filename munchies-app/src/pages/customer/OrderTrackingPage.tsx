/**
 * @module pages/customer/OrderTrackingPage
 * @description Real-time order progress timeline and lookup by Order Number + Phone Number. Strictly Arabic.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Sparkles,
  Search,
  PackageSearch,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Printer,
  Truck,
  Navigation,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Order } from '@/types';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getLocalizedText } from '@/lib/i18n';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { callCancelOrder } from '@/lib/functions';
import { subscribeToDoc } from '@/lib/firestore';
import { formatDateTime } from '@/lib/date';
import { ROUTES } from '@/config/routes';

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Search form fields
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Active loaded order
  const [order, setOrder] = useState<Order | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Helper: Normalize phone & order numbers
  const normalizeOrderNumber = (num: string) => String(num || '').trim().replace(/^#/, '');
  const normalizePhone = (p: string) => String(p || '').replace(/\D/g, '');

  // Helper to search in Firestore and local storage
  const findOrder = async (targetOrderNum: string, targetPhone?: string): Promise<Order | null> => {
    const cleanNum = normalizeOrderNumber(targetOrderNum);
    const cleanDigits = targetPhone ? normalizePhone(targetPhone) : '';
    const numVariant = parseInt(cleanNum, 10);

    // 1. Query Firestore by orderNumber (string, #string, and numeric)
    try {
      const ordersCol = collection(db, 'orders');
      const variants: any[] = [cleanNum, `#${cleanNum}`];
      if (!isNaN(numVariant)) {
        variants.push(numVariant);
      }

      const q = query(
        ordersCol,
        where('orderNumber', 'in', variants)
      );
      const snap = await getDocs(q);

      let matched: Order | null = null;
      snap.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as Order;
        if (cleanDigits) {
          const docDigits = normalizePhone(data.customerPhone || '');
          if (
            docDigits === cleanDigits ||
            (cleanDigits.length >= 8 && docDigits.endsWith(cleanDigits.slice(-8))) ||
            (docDigits.length >= 8 && cleanDigits.endsWith(docDigits.slice(-8)))
          ) {
            matched = data;
          }
        } else {
          matched = data;
        }
      });

      // Also try querying by orderNumberNum if not matched
      if (!matched && !isNaN(numVariant)) {
        const qNum = query(ordersCol, where('orderNumberNum', '==', numVariant));
        const snapNum = await getDocs(qNum);
        snapNum.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() } as Order;
          if (cleanDigits) {
            const docDigits = normalizePhone(data.customerPhone || '');
            if (
              docDigits === cleanDigits ||
              (cleanDigits.length >= 8 && docDigits.endsWith(cleanDigits.slice(-8))) ||
              (docDigits.length >= 8 && cleanDigits.endsWith(docDigits.slice(-8)))
            ) {
              matched = data;
            }
          } else {
            matched = data;
          }
        });
      }

      if (matched) return matched;
    } catch (err) {
      console.warn('Firestore order lookup error:', err);
    }

    // 2. Check local storage fallback (for offline or local testing)
    try {
      const localOrders: Order[] = JSON.parse(
        localStorage.getItem('munchies_orders') || '[]'
      );
      const localFound = localOrders.find((o) => {
        const oNum = normalizeOrderNumber(o.orderNumber || '');
        if (cleanDigits) {
          const oPhone = normalizePhone(o.customerPhone || '');
          return oNum === cleanNum && (oPhone === cleanDigits || oPhone.endsWith(cleanDigits.slice(-8)));
        }
        return oNum === cleanNum;
      });
      if (localFound) return localFound;
    } catch {
      // Ignore local storage parse error
    }

    return null;
  };

  // 1. Handle initial load from navigation state, query params, or URL id
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      // A. Check navigation state first (e.g. from Digital Receipt Modal)
      const state = location.state as { order?: Order; orderNumber?: string; phone?: string } | null;
      if (state?.order?.id) {
        setActiveOrderId(state.order.id);
        setOrder(state.order);
        setOrderNumberInput(normalizeOrderNumber(state.order.orderNumber));
        setPhoneInput(state.order.customerPhone || '');
        return;
      }

      // B. Check URL Search Params (?orderNumber=1001&phone=010...)
      const paramOrderNum = searchParams.get('orderNumber');
      const paramPhone = searchParams.get('phone');

      if (paramOrderNum) {
        setOrderNumberInput(paramOrderNum);
        if (paramPhone) setPhoneInput(paramPhone);

        setIsSearching(true);
        const found = await findOrder(paramOrderNum, paramPhone || undefined);
        if (isMounted) {
          setIsSearching(false);
          if (found) {
            setActiveOrderId(found.id);
            setOrder(found);
            setSearchError(null);
          } else {
            setSearchError(
              'لم يتم العثور على طلب مطابق للبيانات في الرابط. يرجى التأكد من رقم الطلب ورقم الهاتف.'
            );
          }
        }
        return;
      }

      // C. Check URL Route Param (:id)
      if (id) {
        setActiveOrderId(id);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [id, searchParams, location.state]);

  // 2. Real-time subscription to Firestore whenever activeOrderId is set (zero refresh needed)
  useEffect(() => {
    if (!activeOrderId) return;

    const unsub = subscribeToDoc<Order>('orders', activeOrderId, (remoteOrder) => {
      if (remoteOrder) {
        setOrder(remoteOrder);
        setOrderNumberInput(normalizeOrderNumber(remoteOrder.orderNumber));
        setPhoneInput(remoteOrder.customerPhone || '');
      } else {
        // Fallback to local storage if doc doesn't exist remotely yet
        try {
          const localOrders: Order[] = JSON.parse(
            localStorage.getItem('munchies_orders') || '[]'
          );
          const foundLocal = localOrders.find((o) => o.id === activeOrderId);
          if (foundLocal) {
            setOrder(foundLocal);
          }
        } catch {
          // ignore
        }
      }
    });

    return () => unsub();
  }, [activeOrderId]);

  // 3. Manual Search Form Submission
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNum = normalizeOrderNumber(orderNumberInput);
    const cleanPhone = normalizePhone(phoneInput);

    if (!cleanNum) {
      toast.error('يرجى إدخال رقم الطلب');
      return;
    }

    if (!cleanPhone) {
      toast.error('يرجى إدخال رقم الموبايل المسجل بالطلب');
      return;
    }

    // Egyptian phone validation (at least 10-11 digits)
    if (cleanPhone.length < 10) {
      toast.error('يرجى إدخال رقم موبايل مصري صحيح (مثال: 01025707026)');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const found = await findOrder(cleanNum, cleanPhone);
      if (found) {
        setActiveOrderId(found.id);
        setOrder(found);
        setSearchParams({ orderNumber: cleanNum, phone: phoneInput.trim() });
        toast.success(`تم العثور على طلبك #${cleanNum}!`);
      } else {
        setSearchError(
          'لم نتمكن من العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين. يرجى التأكد من البيانات والمحاولة مرة أخرى.'
        );
      }
    } catch (err: any) {
      setSearchError('حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSearching(false);
    }
  };

  // Reset to search another order
  const handleResetSearch = () => {
    setActiveOrderId(null);
    setOrder(null);
    setSearchError(null);
    setSearchParams({});
    navigate(ROUTES.TRACK_ORDER);
  };

  // Cancellation handling
  const canCancel =
    order && (order.status === 'pending' || order.status === 'confirmed');

  const handleConfirmCancel = async () => {
    if (!order) return;
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8" dir="rtl">
      {/* ── Lookup Form (Shown when no order is actively displayed or user wants to search) ── */}
      {!order && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#512080]/10 text-[#512080] border border-[#512080]/20 shadow-xs mb-2">
              <PackageSearch className="w-8 h-8 text-[#512080]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#26212B]">
              تتبع حالة طلبك
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              أدخل رقم الطلب المسجل بالفاتورة (مثال: <span className="font-mono text-[#512080] font-bold">1001</span>) ورقم الموبايل لمتابعة حالة تحضير طلبك مباشرة لحظة بلحظة.
            </p>
          </div>

          <Card className="p-6 sm:p-8 shadow-xl border-gray-100">
            <form onSubmit={handleSearchSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-[#26212B] mb-1.5">
                  رقم الطلب (Order Number)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={orderNumberInput}
                    onChange={(e) => {
                      setOrderNumberInput(e.target.value);
                      if (searchError) setSearchError(null);
                    }}
                    placeholder="1001 أو #1001"
                    className="font-mono font-bold text-sm"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  الرقم التسلسلي المميز المدون على الفاتورة الرقمية
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-[#26212B] mb-1.5">
                  رقم الموبايل المسجل بالطلب
                </label>
                <Input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    if (searchError) setSearchError(null);
                  }}
                  placeholder="01025707026"
                  className="number-ltr font-bold text-sm"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  رقم الهاتف المصري الذي قمت بإدخاله عند إتمام الطلب
                </p>
              </div>

              {searchError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{searchError}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="yellow"
                size="lg"
                fullWidth
                isLoading={isSearching}
                className="font-black shadow-lg shadow-[#FFDA35]/30 hover:scale-[1.01]"
              >
                <Search className="w-4 h-4 ms-2" />
                <span>متابعة حالة الطلب</span>
              </Button>
            </form>
          </Card>

          <div className="text-center pt-2">
            <Link
              to={ROUTES.MENU}
              className="text-xs font-bold text-[#512080] hover:underline inline-flex items-center gap-1"
            >
              <span>العودة لقائمة الطعام واطلب الآن</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Active Order View (Timeline, Details, Live Updates) ── */}
      {order && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFDA35]" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  متابعة حالة الطلب المباشرة
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#512080] mt-1 font-mono">
                #{String(order.orderNumber || '').replace(/^#/, '')}
              </h1>
              <span className="text-xs text-gray-400">
                تاريخ الطلب: {formatDateTime(order.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <StatusBadge status={order.status} locale="ar" />
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="البحث عن طلب آخر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">طلب آخر</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Timeline Column */}
            <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#26212B]">
                  مراحل تحضير الطلب
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>تحديث فوري</span>
                </span>
              </div>

              <OrderTimeline
                currentStatus={order.status}
                statusHistory={order.statusHistory}
                locale="ar"
              />

              {/* Cancellation section */}
              {canCancel && (
                <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    يمكنك إلغاء الطلب قبل بدء تجهيز الطعام في المطبخ.
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="text-[#E84D45] hover:bg-red-50 hover:text-red-700 shrink-0"
                  >
                    إلغاء الطلب
                  </Button>
                </div>
              )}
            </div>

            {/* Order Details & Branch / Delivery Info */}
            <div className="md:col-span-5 space-y-6">
              {/* Delivery or Branch pickup card */}
              {(order.type === 'delivery' || (order as any).deliveryType === 'delivery') ? (
                <Card className="p-6 space-y-4 bg-purple-50/60 border-purple-200">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <h3 className="text-sm font-black text-[#512080] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#512080]" />
                      <span>توصيل ديليفري لباب البيت</span>
                    </h3>
                    <span className="text-[11px] font-bold text-[#512080] bg-white px-2 py-0.5 rounded-full border border-purple-200">
                      طلب ديليفري
                    </span>
                  </div>

                  {order.deliveryAddress ? (
                    <div className="space-y-1.5 text-xs text-gray-700">
                      <div className="font-extrabold text-[#26212B] text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#512080]" />
                        <span>{getLocalizedText(order.deliveryAddress.area, 'أسوان')} – أسوان</span>
                      </div>
                      <p className="font-semibold text-gray-800">
                        الشارع: {getLocalizedText(order.deliveryAddress.addressLine1 || order.deliveryAddress.street, '')}
                      </p>
                      {(order.deliveryAddress.addressLine2 || order.deliveryAddress.building) && (
                        <p className="text-gray-600">
                          العقار / الشقة: {getLocalizedText(order.deliveryAddress.addressLine2 || order.deliveryAddress.building, '')}
                        </p>
                      )}
                      {order.deliveryAddress.deliveryInstructions && (
                        <p className="text-[11px] text-amber-800 italic bg-amber-50 p-2 rounded-lg border border-amber-100">
                          علامة مميزة: {getLocalizedText(order.deliveryAddress.deliveryInstructions, '')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">تم تسجيل طلب التوصيل</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-purple-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#512080]" />
                      <span className="text-gray-500">للتواصل مع المطعم:</span>
                    </div>
                    <a
                      href="tel:01025707026"
                      className="font-bold text-[#512080] number-ltr hover:underline"
                    >
                      01025707026
                    </a>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 space-y-4 bg-[#F5F3F7]/60 border-gray-200">
                  <h3 className="text-sm font-black text-[#26212B] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#512080]" />
                    <span>عنوان ومقر الاستلام</span>
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                    حديقة الورد أمام الراية – فرع الكورنيش، أسوان
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#512080]" />
                      <span className="text-gray-500">للتواصل مع الفرع:</span>
                    </div>
                    <a
                      href="tel:01025707026"
                      className="font-bold text-[#512080] number-ltr hover:underline"
                    >
                      01025707026
                    </a>
                  </div>
                </Card>
              )}

              {/* Items summary */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#26212B]">
                    تفاصيل الفاتورة
                  </h3>
                  <button
                    onClick={() => window.print()}
                    className="text-xs font-bold text-[#512080] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة</span>
                  </button>
                </div>

                <div className="text-xs text-gray-500 pb-2 border-b border-gray-100 flex justify-between">
                  <span>العميل: <strong>{getLocalizedText(order.customerName, '')}</strong></span>
                  <span className="number-ltr">{order.customerPhone}</span>
                </div>

                <div className="divide-y divide-gray-100 text-xs space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0">
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>
                          {item.quantity}x {getLocalizedText(item.name, 'صنف')}
                        </span>
                        <CurrencyDisplay amount={item.totalPrice} />
                      </div>
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="mt-0.5 ps-3 text-[11px] text-gray-500 space-y-0.5">
                          {item.customizations.map((c: any, cIdx: number) => {
                            const groupTitle = getLocalizedText(c.groupName || c.groupId, '');
                            const optionsList = Array.isArray(c.selectedOptions)
                              ? c.selectedOptions
                                  .map((o: any) => getLocalizedText(o?.name || o, ''))
                                  .filter(Boolean)
                                  .join('، ')
                              : getLocalizedText(c.optionName || c.name || c, '');
                            return (
                              <div key={cIdx}>
                                • {groupTitle ? `${groupTitle}: ` : ''}{optionsList}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <CurrencyDisplay amount={order.subtotal} />
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>الخصم:</span>
                      <span>-{order.discount} ج.م</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-sm font-black text-[#26212B]">
                    <span>المطلوب كاش عند الاستلام:</span>
                    <CurrencyDisplay amount={order.total} className="text-base text-[#512080]" />
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Link to={ROUTES.MENU} className="block text-center">
                  <Button variant="secondary" fullWidth size="md">
                    طلب أصناف أخرى من المنيو
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="w-full py-2.5 text-center text-xs font-bold text-gray-500 hover:text-[#512080] transition-colors cursor-pointer"
                >
                  البحث عن طلب آخر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal Confirmation */}
      <ConfirmDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="تأكيد إلغاء الطلب"
        message="هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ لن تتمكن من التراجع عن هذه الخطوة بمجرد بدء التحضير."
        confirmText="نعم، قم بالإلغاء"
        confirmVariant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
};
