/**
 * @module components/order/OrderTimeline
 * @description Vertical visual status timeline with timestamps and icons. Strictly Arabic.
 */

import React from 'react';
import { Check, Clock, ChefHat, PackageCheck, CheckCircle2, XCircle } from 'lucide-react';
import type { OrderStatus } from '@/types';
import { formatTime } from '@/lib/date';

export interface OrderTimelineProps {
  currentStatus: OrderStatus;
  statusHistory?: { status: OrderStatus; timestamp: string; note?: string }[];
  locale?: string;
}

const STEPS: { status: OrderStatus; labelAr: string; icon: any }[] = [
  { status: 'pending', labelAr: 'تم إرسال الطلب', icon: Clock },
  { status: 'confirmed', labelAr: 'تم قبول الطلب من المطعم', icon: Check },
  { status: 'preparing', labelAr: 'جاري التحضير في المطبخ', icon: ChefHat },
  { status: 'ready', labelAr: 'الطلب جاهز للاستلام', icon: PackageCheck },
  { status: 'picked_up', labelAr: 'تم استلام الطلب بنجاح', icon: CheckCircle2 },
];

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  currentStatus,
  statusHistory = [],
}) => {
  if (currentStatus === 'cancelled') {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800">
        <XCircle className="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <h4 className="font-bold text-sm">
            تم إلغاء هذا الطلب
          </h4>
          <p className="text-xs text-red-600 mt-0.5">
            تم إلغاء الطلب طبقاً لسياسة الإلغاء قبل بدء التحضير في المطبخ.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.status === currentStatus);
  const activeIdx = currentIndex > -1 ? currentIndex : 0;

  return (
    <div className="relative ps-6 space-y-6 before:absolute before:inset-y-2 before:start-2.5 before:w-0.5 before:bg-gray-200">
      {STEPS.map((step, idx) => {
        const isDone = idx <= activeIdx;
        const isCurrent = idx === activeIdx;
        const Icon = step.icon;
        const event = statusHistory.find((h) => h.status === step.status);

        return (
          <div key={step.status} className="relative flex items-start gap-3">
            {/* Dot / Icon */}
            <div
              className={`absolute -start-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                isDone
                  ? isCurrent
                    ? 'bg-[#512080] text-white ring-4 ring-[#512080]/20'
                    : 'bg-[#27834B] text-white'
                  : 'bg-white border-2 border-gray-300 text-gray-400'
              }`}
            >
              <Icon className="w-3 h-3" />
            </div>

            {/* Content */}
            <div className="min-w-0">
              <h5
                className={`text-sm font-bold leading-none ${
                  isCurrent ? 'text-[#512080]' : isDone ? 'text-[#26212B]' : 'text-gray-400'
                }`}
              >
                {step.labelAr}
              </h5>
              {event?.timestamp && (
                <span className="text-[11px] text-gray-400 mt-1 block">
                  {formatTime(event.timestamp)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
