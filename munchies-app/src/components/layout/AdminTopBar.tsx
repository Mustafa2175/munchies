/**
 * @module components/layout/AdminTopBar
 * @description Top header bar for the admin dashboard strictly in Arabic.
 * Includes a notification bell with unread-order badge, pulse animation,
 * and a sound-test button for the POS chime.
 */

import React, { useState } from 'react';
import { Bell, ExternalLink, Volume2, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import {
  playNewOrderChime,
  unlockAudioContext,
  isSoundEnabled,
} from '@/utils/soundNotification';

interface AdminTopBarProps {
  /** Number of unread new orders since last acknowledged */
  unreadCount?: number;
  /** Clear the unread badge counter */
  onClearUnread?: () => void;
  /** Open mobile sidebar drawer */
  onMenuClick?: () => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  unreadCount = 0,
  onClearUnread,
  onMenuClick,
}) => {
  const [justClicked, setJustClicked] = useState(false);

  const handleBellClick = () => {
    // Clear the unread badge
    onClearUnread?.();
    // Briefly animate
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 600);
  };

  const handleTestSound = async () => {
    await unlockAudioContext();
    if (isSoundEnabled()) {
      playNewOrderChime();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-border px-4 lg:px-6 flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 -ms-2 rounded-xl text-dark hover:bg-gray-100 lg:hidden cursor-pointer shrink-0"
            aria-label="فتح القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xs sm:text-sm font-extrabold text-dark truncate">
          لوحة تحكم وإدارة طلبات مانشيز
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Link
          to={ROUTES.HOME}
          target="_blank"
          className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline px-2 py-1.5 rounded-lg hover:bg-primary-50/50 transition-colors"
          title="عرض موقع الزبائن"
        >
          <span className="hidden sm:inline">عرض موقع الزبائن</span>
          <ExternalLink className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </Link>

        {/* Test sound button */}
        <button
          onClick={handleTestSound}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold text-primary bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer"
          title="تجربة الصوت"
        >
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">تجربة الصوت</span>
        </button>

        {/* Notification bell with badge + pulse */}
        <button
          onClick={handleBellClick}
          className={`
            relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer
            ${unreadCount > 0 ? 'animate-[bellPulse_1.5s_ease-in-out_infinite]' : ''}
            ${justClicked ? 'scale-110' : ''}
          `}
          title={unreadCount > 0 ? `${unreadCount} طلبات جديدة غير مقروءة` : 'لا توجد طلبات جديدة'}
        >
          <Bell
            className={`w-5 h-5 transition-colors ${
              unreadCount > 0 ? 'text-primary' : ''
            }`}
          />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -end-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold px-1 shadow-xs tabular-nums animate-bounce">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : (
            <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-gray-300" />
          )}
        </button>
      </div>

      {/* Keyframe for bell pulse — injected once */}
      <style>{`
        @keyframes bellPulse {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-14deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-8deg); }
          50% { transform: rotate(4deg); }
          60% { transform: rotate(0deg); }
        }
      `}</style>
    </header>
  );
};
