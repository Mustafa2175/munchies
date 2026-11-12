/**
 * @module pages/customer/OrderTrackingPage
 * @description Real-time order progress timeline and lookup by Order Number + Phone Number. Strictly Arabic.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Search,
  PackageSearch,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Printer,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Order } from '@/types';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
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

  const normalizeOrderNumber = (num: string) => String(num || '').trim().replace(/^#/, '');
  const normalizePhone = (p: string) => String(p || '').replace(/\D/g, '');

  const findOrder = async (targetOrderNum: string, targetPhone?: string): Promise<Order | null> => {
    const cleanNum = normalizeOrderNumber(targetOrderNum);
    const cleanDigits = targetPhone ? normalizePhone(targetPhone) : '';
    const numVariant = parseInt(cleanNum, 10);

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

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const state = location.state as { order?: Order; orderNumber?: string; phone?: string } | null;
      if (state?.order?.id) {
        setActiveOrderId(state.order.id);
        setOrder(state.order);
        setOrderNumberInput(normalizeOrderNumber(state.order.orderNumber));
        setPhoneInput(state.order.customerPhone || '');
        return;
      }

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
              'ملقيناش طلب مطابق للبيانات اللي في اللينك. اتأكد من رقم الطلب ورقم الموبايل.'
            );
          }
        }
        return;
      }

      if (id) {
        setActiveOrderId(id);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [id, searchParams, location.state]);

  useEffect(() => {
    if (!activeOrderId) return;

    const unsub = subscribeToDoc<Order>('orders', activeOrderId, (remoteOrder) => {
      if (remoteOrder) {
        setOrder(remoteOrder);
        setSearchError(null);
        setOrderNumberInput(normalizeOrderNumber(remoteOrder.orderNumber));
        setPhoneInput(remoteOrder.customerPhone || '');
      } else {
        try {
          const localOrders: Order[] = JSON.parse(
            localStorage.getItem('munchies_orders') || '[]'
          );
          const foundLocal = localOrders.find((o) => o.id === activeOrderId);
          if (foundLocal) {
            setOrder(foundLocal);
            setSearchError(null);
          } else if (id === activeOrderId) {
            setActiveOrderId(null);
            setSearchError('ملقيناش طلب بالرقم ده. تقدر تدور برقم الطلب ورقم موبايلك تحت.');
          }
        } catch {
          // ignore
        }
      }
    });

    return () => unsub();
  }, [activeOrderId, id]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNum = normalizeOrderNumber(orderNumberInput);
    const cleanPhone = normalizePhone(phoneInput);

    if (!cleanNum) {
      toast.error('من فضلك اكتب رقم الطلب');
      return;
    }

    if (!cleanPhone) {
      toast.error('من فضلك اكتب رقم الموبايل المسجل بالطلب');
      return;
    }

    if (cleanPhone.length < 10) {
      toast.error('من فضلك اكتب رقم موبايل مصري صحيح (مثال: 01025707026)');
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
        toast.success(`لقينا طلبك #${cleanNum}!`);
      } else {
        setSearchError(
          'ملقيناش طلب مطابق لرقم الطلب ورقم الموبايل دول. اتأكد من البيانات وجرّب تاني.'
        );
      }
    } catch {
      setSearchError('حصلت مشكلة أثناء البحث، من فضلك جرّب تاني.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetSearch = () => {
    setActiveOrderId(null);
    setOrder(null);
    setSearchError(null);
    setSearchParams({});
    navigate(ROUTES.TRACK_ORDER);
  };

  const canCancel =
    order && (order.status === 'pending' || order.status === 'confirmed');

  const handleConfirmCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      await callCancelOrder(order.id, 'العميل لغى الطلب');
      setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      toast.success('اتلغى الطلب خلاص');
      setIsCancelModalOpen(false);
    } catch {
      toast.error('معرفناش نلغي الطلب، من فضلك كلم الفرع.');
    } finally {
      setIsCancelling(false);
    }
  };

  const showTrackingSkeleton =
    !order && (Boolean(activeOrderId) || (isSearching && Boolean(searchParams.get('orderNumber'))));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8" dir="rtl">
      {showTrackingSkeleton && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton variant="text" className="w-32 h-3" />
              <Skeleton variant="text" className="w-24 h-8" />
              <Skeleton variant="text" className="w-40 h-3" />
            </div>
            <Skeleton variant="rectangular" className="w-28 h-8 rounded-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7 p-6 space-y-4">
              <Skeleton variant="text" className="w-36 h-5" />
              <div className="space-y-5 pt-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center gap-3">
                    <Skeleton variant="circular" className="w-6 h-6 shrink-0" />
                    <Skeleton variant="text" className="w-48 h-4" />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="lg:col-span-5 p-6 space-y-4">
              <Skeleton variant="text" className="w-32 h-5" />
              <Skeleton variant="rectangular" className="w-full h-24" />
              <Skeleton variant="rectangular" className="w-full h-16" />
            </Card>
          </div>
        </div>
      )}

      {!order && !showTrackingSkeleton && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary border border-primary-100 shadow-xs mb-2">
              <PackageSearch className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-dark">
              طلبك وصل لفين؟
            </h1>
            <p className="text-xs sm:text-sm text-medium-gray max-w-md mx-auto">
              اكتب رقم الطلب اللي في الفاتورة ورقم موبايلك عشان تتابع طلبك لحظة بلحظة.
            </p>
          </div>

          <Card className="p-6 sm:p-8 shadow-card border-border">
            <form onSubmit={handleSearchSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-dark mb-1.5">
                  رقم الطلب
                </label>
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
                <p className="text-[11px] text-medium-gray mt-1">
                  الرقم اللي ظهرلك في تفاصيل طلبك
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-dark mb-1.5">
                  رقم موبايلك المسجل في الطلب
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
                <p className="text-[11px] text-medium-gray mt-1">
                  نفس رقم الموبايل اللي طلبت بيه
                </p>
              </div>

              {searchError && (
                <div className="p-3.5 bg-danger-light border border-danger/20 rounded-xl text-danger text-xs font-bold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{searchError}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="yellow"
                size="lg"
                fullWidth
                isLoading={isSearching}
                className="font-black shadow-md"
              >
                <Search className="w-4 h-4 ms-2" />
                <span>تابع طلبك</span>
              </Button>
            </form>
          </Card>

          <div className="text-center pt-2">
            <Link
              to={ROUTES.MENU}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>ارجع للمنيو واطلب دلوقتي</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>
      )}

      {order && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border shadow-card">
            <div>
              <span className="text-xs font-bold text-medium-gray uppercase tracking-wider block">
                طلبك وصل لفين؟
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-primary mt-1 font-mono">
                #{String(order.orderNumber || '').replace(/^#/, '')}
              </h1>
              <span className="text-xs text-medium-gray">
                تاريخ الطلب: {formatDateTime(order.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <StatusBadge status={order.status} locale="ar" audience="customer" />
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark hover:bg-light-gray flex items-center gap-1.5 transition-colors cursor-pointer"
                title="دور على طلب تاني"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">طلب تاني</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-border shadow-card space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-dark">
                  مراحل طلبك
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-success bg-success-light px-2.5 py-1 rounded-full border border-success/20">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>تحديث مباشر</span>
                </span>
              </div>

              <OrderTimeline
                currentStatus={order.status}
                statusHistory={order.statusHistory}
                orderType={(order.type === 'delivery' || (order as any).deliveryType === 'delivery') ? 'delivery' : 'pickup'}
                locale="ar"
              />

              {canCancel && (
                <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-medium-gray">
                    تقدر تلغي الطلب قبل ما المطبخ يبدأ يجهزه.
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="text-danger hover:bg-danger-light hover:text-danger shrink-0"
                  >
                    الغي الطلب
                  </Button>
                </div>
              )}
            </div>

            <div className="md:col-span-5 space-y-6">
              {(order.type === 'delivery' || (order as any).deliveryType === 'delivery') ? (
                <Card className="p-6 space-y-4 bg-primary-50/60 border-primary-200">
                  <div className="flex items-center justify-between pb-2 border-b border-primary-100">
                    <h3 className="text-sm font-black text-primary flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      <span>Delivery – توصيل لحد عندك</span>
                    </h3>
                    <span className="text-[11px] font-bold text-primary bg-white px-2 py-0.5 rounded-full border border-primary-200">
                      Delivery
                    </span>
                  </div>

                  {order.deliveryAddress ? (
                    <div className="space-y-1.5 text-xs text-dark">
                      <div className="font-extrabold text-dark text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{getLocalizedText(order.deliveryAddress.area, 'أسوان')} – أسوان</span>
                      </div>
                      <p className="font-semibold text-dark">
                        الشارع: {getLocalizedText(order.deliveryAddress.addressLine1 || order.deliveryAddress.street, '')}
                      </p>
                      {(order.deliveryAddress.addressLine2 || order.deliveryAddress.building) && (
                        <p className="text-medium-gray">
                          العمارة / الشقة: {getLocalizedText(order.deliveryAddress.addressLine2 || order.deliveryAddress.building, '')}
                        </p>
                      )}
                      {order.deliveryAddress.deliveryInstructions && (
                        <p className="text-[11px] text-warning-800 bg-warning-light p-2 rounded-lg border border-warning/20">
                          علامة مميزة: {getLocalizedText(order.deliveryAddress.deliveryInstructions, '')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-medium-gray">طلب Delivery متسجل</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-primary-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-medium-gray">لو احتجت تكلمنا:</span>
                    </div>
                    <a
                      href="tel:01025707026"
                      className="font-bold text-primary number-ltr hover:underline"
                    >
                      01025707026
                    </a>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 space-y-4 bg-light-gray/60 border-border">
                  <h3 className="text-sm font-black text-dark flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Pickup – استلام من الفرع</span>
                  </h3>
                  <p className="text-xs text-dark leading-relaxed font-semibold">
                    حديقة الورد أمام الراية – فرع الكورنيش، أسوان
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-medium-gray">لو احتجت تكلم الفرع:</span>
                    </div>
                    <a
                      href="tel:01025707026"
                      className="font-bold text-primary number-ltr hover:underline"
                    >
                      01025707026
                    </a>
                  </div>
                </Card>
              )}

              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-dark">
                    تفاصيل طلبك
                  </h3>
                  <button
                    onClick={() => window.print()}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>اطبع</span>
                  </button>
                </div>

                <div className="text-xs text-medium-gray pb-2 border-b border-border flex justify-between">
                  <span>الاسم: <strong className="text-dark">{getLocalizedText(order.customerName, '')}</strong></span>
                  <span className="number-ltr font-bold text-dark">{order.customerPhone}</span>
                </div>

                <div className="divide-y divide-border text-xs space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0">
                      <div className="flex justify-between font-bold text-dark">
                        <span>
                          {item.quantity}x {getLocalizedText(item.name, 'صنف')}
                        </span>
                        <CurrencyDisplay amount={item.totalPrice} />
                      </div>
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="mt-0.5 ps-3 text-[11px] text-medium-gray space-y-0.5">
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

                <div className="border-t border-border pt-3 space-y-1 text-xs text-medium-gray">
                  <div className="flex justify-between">
                    <span>المجموع:</span>
                    <CurrencyDisplay amount={order.subtotal} className="text-dark font-semibold" />
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>رسوم التوصيل:</span>
                      <CurrencyDisplay amount={order.deliveryFee} className="text-dark font-semibold" />
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>الخصم:</span>
                      <span>-{order.discount} ج.م</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-black text-dark">
                    <span>الإجمالي (كاش عند الاستلام):</span>
                    <CurrencyDisplay amount={order.total} className="text-base text-primary font-black" />
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Link to={ROUTES.MENU} className="block text-center">
                  <Button variant="secondary" fullWidth size="md">
                    شوف المنيو واطلب تاني
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="w-full py-2.5 text-center text-xs font-bold text-medium-gray hover:text-primary transition-colors cursor-pointer"
                >
                  دور على طلب تاني
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="تأكيد إلغاء الطلب"
        message="متأكد إنك عايز تلغي الطلب ده؟ مش هتقدر ترجع في الإلغاء بعد ما المطبخ يبدأ يجهزه."
        confirmText="أيوه، الغي الطلب"
        cancelText="لا، خلّيه"
        confirmVariant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
};
