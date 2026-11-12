/**
 * @module components/layout/RestaurantClosedBanner
 * @description Notification banner displayed at the top of customer pages
 * whenever the restaurant is closed (manual emergency close or outside working hours).
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
    <div className="bg-danger text-white px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm relative z-40 w-full animate-fadeIn select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-center text-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 shrink-0 bg-white/20 px-2 py-0.5 rounded-full text-white">
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow" />
          <span className="text-[11px] sm:text-xs font-black">قافلين دلوقتي</span>
        </div>

        <p className="leading-snug">
          {isManualClosed ? (
            <span>
              {closureMessage || 'معلش، إحنا قافلين دلوقتي. راجعنا قريب!'}
            </span>
          ) : (
            <span>
              معلش، إحنا قافلين دلوقتي. راجعنا قريب!
              {todayHours ? (
                <> — مواعيدنا النهاردة: <span className="underline decoration-white/40 font-black">{todayHours}</span></>
              ) : (
                ' — النهاردة إجازة'
              )}
            </span>
          )}
        </p>

        {todayHours && !isManualClosed && (
          <div className="hidden md:inline-flex items-center gap-1 text-[11px] bg-black/20 px-2.5 py-0.5 rounded-full font-medium">
            <Clock className="w-3 h-3 text-yellow" />
            <span>توقيت أسوان</span>
          </div>
        )}
      </div>
    </div>
  );
};
