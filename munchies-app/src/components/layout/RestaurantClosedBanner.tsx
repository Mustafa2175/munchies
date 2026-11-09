/**
 * @module components/layout/RestaurantClosedBanner
 * @description Prominent real-time notification banner displayed at the top of customer pages
 * whenever the restaurant is closed (manual emergency close or outside working hours).
 * Strictly Arabic.
 */

import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import {
  useIsStoreOpen,
  useRestaurantStore,
  getTodayWorkingHoursText,
} from '@/stores/restaurantStore';

export const RestaurantClosedBanner: React.FC = () => {
  const isOpen = useIsStoreOpen();
  const isManualClosed = useRestaurantStore((state) => state.isManualClosed);
  const closureMessage = useRestaurantStore((state) => state.closureMessage);

  if (isOpen) return null;

  const todayHours = getTodayWorkingHoursText();

  return (
    <div className="bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md relative z-40 w-full animate-fadeIn select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-center text-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 shrink-0 bg-white/20 px-2 py-0.5 rounded-full text-white">
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFDA35] animate-pulse" />
          <span className="text-[11px] sm:text-xs font-black">المطعم مغلق</span>
        </div>

        <p className="leading-snug">
          {isManualClosed ? (
            <span>
              🔴 {closureMessage || 'المطعم مغلق حالياً ولا يستقبل طلبات في الوقت الحالي.'}
            </span>
          ) : (
            <span>
              🔴 المطعم مغلق حالياً ولا يستقبل طلبات في الوقت الحالي
              {todayHours ? (
                <> — مواعيد العمل اليوم: <span className="underline decoration-white/40 font-extrabold">{todayHours}</span></>
              ) : (
                ' — اليوم عطلة أسبوعية'
              )}
            </span>
          )}
        </p>

        {todayHours && !isManualClosed && (
          <div className="hidden md:inline-flex items-center gap-1 text-[11px] bg-black/20 px-2 py-0.5 rounded-full font-normal">
            <Clock className="w-3 h-3 text-[#FFDA35]" />
            <span>توقيت القاهرة</span>
          </div>
        )}
      </div>
    </div>
  );
};

