/**
 * @module components/layout/AnnouncementBar
 * @description Top announcement bar for operational notices or offers with zero mobile horizontal overflow.
 */

import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-yellow text-dark px-3 sm:px-4 py-2 text-xs font-bold transition-all relative z-40 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 mx-auto min-w-0 overflow-hidden">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate block text-[11px] sm:text-xs min-w-0">
            فرع الكورنيش – حديقة الورد أمام الراية، أسوان • برجر وسندوتشات فريش يومياً
          </span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 rounded hover:bg-black/10 transition-colors shrink-0 cursor-pointer"
          aria-label="إغلاق الإشعار"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
