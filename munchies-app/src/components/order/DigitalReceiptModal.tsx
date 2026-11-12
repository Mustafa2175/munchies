/**
 * @module components/order/DigitalReceiptModal
 * @description Post-checkout Digital Receipt & Order Confirmation modal styled in Munchie's brand identity.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
  Receipt,
  ArrowLeft,
  X,
  Phone,
  Clock,
  User,
  ShoppingBag,
  Truck,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order } from '@/types';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { formatDateTime } from '@/lib/date';
import { ROUTES } from '@/config/routes';
import { getLocalizedText } from '@/lib/i18n';

export interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const navigate = useNavigate();

  if (!isOpen || !order) return null;

  const rawNumber = String(order.orderNumber || '').replace(/^#/, '');
  const displayOrderNumber = rawNumber ? `#${rawNumber}` : `#${order.id.slice(0, 6)}`;

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(displayOrderNumber);
      setCopied(true);
      toast.success('تم نسخ رقم الطلب بنجاح');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('تعذر نسخ الرقم تلقائياً');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNavigateToTracking = () => {
    onClose();
    navigate(ROUTES.ORDER_TRACKING.replace(':id', order.id));
  };

  const handleCloseAndGoMenu = () => {
    onClose();
    navigate(ROUTES.MENU);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Printable Receipt CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-receipt, .printable-receipt * {
            visibility: visible;
          }
          .printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 16px;
            color: #000 !important;
            background: #fff !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-primary text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-yellow" />
            <h3 className="font-extrabold text-sm sm:text-base">إيصال تأكيد الطلب</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer print:hidden"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 print:p-0">
          {/* Printable Receipt Container */}
          <div className="printable-receipt space-y-5">
            {/* Success Icon & Title Banner */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-4 border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-dark">
                تم استلام طلبك بنجاح
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-semibold">
                شكراً لطلبك من مانشيز Munchie's – فرع أسوان
              </p>
            </div>

            {/* Highlighted Dashed Box: Order Number & Crucial Warning */}
            <div className="bg-primary-50/50 border-2 border-dashed border-primary/30 rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-gray-500 block mb-0.5">
                    رقم طلبك المميز للمتابعة
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-primary tracking-wider font-mono tabular-nums">
                    {displayOrderNumber}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-yellow hover:bg-yellow-dark text-dark'
                  } print:hidden`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ الرقم</span>
                    </>
                  )}
                </button>
              </div>

              {/* Warning Banner */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 text-xs sm:text-[13px] leading-relaxed font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>هام جداً:</strong> احتفظ برقم الطلب هذا (<span className="font-mono text-primary font-black tabular-nums">{displayOrderNumber}</span>) أو خذ لقطة شاشة (Screenshot) لأنك ستحتاجه لمتابعة حالة طلبك.
                </span>
              </div>
            </div>

            {/* Digital Receipt Section */}
            <div className="border border-border rounded-2xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="w-full px-4 py-3 bg-light-gray flex items-center justify-between text-xs sm:text-sm font-black text-dark hover:bg-gray-100 transition-colors cursor-pointer print:pointer-events-none"
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <span>تفاصيل الفاتورة الرقمية</span>
                </div>
                <div className="print:hidden">
                  {isDetailsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </button>

              {(isDetailsExpanded || typeof window !== 'undefined') && (
                <div className="p-4 space-y-4 text-xs divide-y divide-gray-100">
                  {/* Order Meta Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>التاريخ والوقت:</span>
                      <strong className="text-gray-800">{formatDateTime(order.createdAt)}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>اسم العميل:</span>
                      <strong className="text-gray-800">{order.customerName}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>رقم الهاتف:</span>
                      <strong className="text-gray-800 number-ltr tabular-nums">{order.customerPhone}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(order.type === 'delivery' || (order as any).deliveryType === 'delivery') ? (
                        <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
                      ) : (
                        <ShoppingBag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <span>طريقة الاستلام:</span>
                      <strong className="text-primary">
                        {(order.type === 'delivery' || (order as any).deliveryType === 'delivery')
                          ? 'توصيل ديليفري (كاش)'
                          : 'استلام من الفرع (كاش)'}
                      </strong>
                    </div>
                  </div>

                  {/* Delivery Address Section if Delivery Order */}
                  {(order.type === 'delivery' || (order as any).deliveryType === 'delivery') && order.deliveryAddress && (
                    <div className="pt-2">
                      <div className="p-3 rounded-xl bg-primary-50/50 border border-primary-100 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs">
                          <span className="font-extrabold text-primary block">عنوان التوصيل في أسوان:</span>
                          <span className="text-gray-800 font-bold block">
                            {[
                              getLocalizedText(order.deliveryAddress.area),
                              getLocalizedText(order.deliveryAddress.addressLine1 || order.deliveryAddress.street),
                              getLocalizedText(order.deliveryAddress.addressLine2 || order.deliveryAddress.building),
                            ]
                              .filter(Boolean)
                              .join(' – ')}
                          </span>
                          {order.deliveryAddress.deliveryInstructions && (
                            <span className="text-[11px] text-gray-500 block">
                              علامة مميزة: {getLocalizedText(order.deliveryAddress.deliveryInstructions)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Itemized List */}
                  <div className="pt-3 space-y-2.5">
                    <span className="font-extrabold text-gray-700 block">الأصناف المطلوبة:</span>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => {
                        const itemName = getLocalizedText(item.name, 'صنف');
                        return (
                          <div key={idx} className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between font-bold text-gray-800">
                              <span>
                                <span className="tabular-nums font-mono">{item.quantity}</span>x {itemName}
                              </span>
                              <CurrencyDisplay amount={item.totalPrice} className="font-black text-primary" />
                            </div>

                            {/* Customizations */}
                            {item.customizations && item.customizations.length > 0 && (
                              <div className="mt-1 ps-3 text-[11px] text-gray-500 space-y-0.5 border-s-2 border-primary/20">
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

                            {/* Special notes */}
                            {item.specialInstructions && (
                              <div className="mt-1 text-[11px] text-amber-700">
                                ملاحظة: {item.specialInstructions}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-3 space-y-1.5 text-gray-600">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <CurrencyDisplay amount={order.subtotal} />
                    </div>
                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span>رسوم التوصيل:</span>
                        <CurrencyDisplay amount={order.deliveryFee} />
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>الخصم:</span>
                        <span className="tabular-nums">-{order.discount} ج.م</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-black text-dark">
                      <span>المبلغ الإجمالي كاش عند الاستلام:</span>
                      <CurrencyDisplay
                        amount={order.total}
                        className="text-lg font-black text-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Branch address footer in receipt */}
            <div className="text-center text-[11px] text-gray-400 border-t border-gray-100 pt-3">
              مانشيز – حديقة الورد أمام الراية – الكورنيش، أسوان | هاتف: <span className="tabular-nums">01025707026</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 sm:p-6 bg-light-gray border-t border-border space-y-3 shrink-0 print:hidden">
          {/* Primary CTA Button: Full Width */}
          <button
            type="button"
            onClick={handleNavigateToTracking}
            className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-dark active:scale-[0.99] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all cursor-pointer"
          >
            <span>متابعة حالة الطلب الآن</span>
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </button>

          {/* Two Secondary Bottom Buttons Side-by-Side */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl border border-border bg-white hover:bg-gray-100 active:scale-[0.99] font-bold text-xs text-dark flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>طباعة الفاتورة</span>
            </button>

            <button
              type="button"
              onClick={handleCloseAndGoMenu}
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 border border-border active:scale-[0.99] font-bold text-xs text-dark flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>إغلاق والعودة للمنيو</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};