/**
 * @module components/order/OrderTimeline
 * @description Vertical visual status timeline with timestamps and icons. Strictly Arabic.
 */

import React from 'react';
import { Check, Clock, ChefHat, PackageCheck, CheckCircle2, XCircle, Truck } from 'lucide-react';
import type { OrderStatus } from '@/types';
import { formatTime } from '@/lib/date';

export interface OrderTimelineProps {
  currentStatus: OrderStatus;
  statusHistory?: { status: OrderStatus; timestamp: string; note?: string }[];
  orderType?: 'pickup' | 'delivery';
  locale?: string;
}

const PICKUP_STEPS: { status: OrderStatus; labelAr: string; icon: any }[] = [
  { status: 'pending', labelAr: 'متقلقش، طلبك وصلنا!', icon: Clock },
  { status: 'confirmed', labelAr: 'المطعم وافق على طلبك', icon: Check },
  { status: 'preparing', labelAr: 'طلبك بيتجهز دلوقتي 🔥', icon: ChefHat },
  { status: 'ready', labelAr: 'طلبك جاهز للاستلام! 🍔', icon: PackageCheck },
  { status: 'picked_up', labelAr: 'بالهنا والشفا ❤️', icon: CheckCircle2 },
];

const DELIVERY_STEPS: { status: OrderStatus; labelAr: string; icon: any }[] = [
  { status: 'pending', labelAr: 'متقلقش، طلبك وصلنا!', icon: Clock },
  { status: 'confirmed', labelAr: 'المطعم وافق على طلبك', icon: Check },
  { status: 'preparing', labelAr: 'طلبك بيتجهز دلوقتي 🔥', icon: ChefHat },
  { status: 'ready', labelAr: 'طلبك جاهز وهيطلع ليك 🍔', icon: PackageCheck },
  { status: 'out_for_delivery', labelAr: 'طلبك في الطريق ليك 🛵', icon: Truck },
  { status: 'delivered', labelAr: 'بالهنا والشفا ❤️', icon: CheckCircle2 },
];

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  currentStatus,
  statusHistory = [],
  orderType = 'pickup',
}) => {
  if (currentStatus === 'cancelled') {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800">
        <XCircle className="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <h4 className="font-bold text-sm">
            الطلب اتلغى
          </h4>
          <p className="text-xs text-red-600 mt-0.5">
            تم إلغاء الطلب قبل ما يبدأ التحضير في المطبخ.
          </p>
        </div>
      </div>
    );
  }

  const steps = orderType === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIndex = steps.findIndex((s) => s.status === currentStatus);
  const activeIdx = currentIndex > -1 ? currentIndex : 0;

  return (
    <div className="relative ps-6 space-y-6 before:absolute before:inset-y-2 before:start-2.5 before:w-0.5 before:bg-gray-200">
      {steps.map((step, idx) => {
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
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-success text-white'
                  : 'bg-white border-2 border-gray-300 text-gray-400'
              }`}
            >
              <Icon className="w-3 h-3" />
            </div>

            {/* Content */}
            <div className="min-w-0">
              <h5
                className={`text-sm font-bold leading-none ${
                  isCurrent ? 'text-primary' : isDone ? 'text-dark' : 'text-gray-400'
                }`}
              >
                {step.labelAr}
              </h5>
              {event?.timestamp && (
                <span className="text-[11px] text-gray-400 mt-1 block tabular-nums">
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
