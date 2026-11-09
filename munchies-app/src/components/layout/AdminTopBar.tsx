/**
 * @module components/layout/AdminTopBar
 * @description Top header bar for the admin dashboard strictly in Arabic.
 * Includes a notification bell with unread-order badge, pulse animation,
 * and a sound-test button for the POS chime.
 */

import React, { useState } from 'react';
import { Bell, ExternalLink, Volume2 } from 'lucide-react';
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
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  unreadCount = 0,
  onClearUnread,
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
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-extrabold text-[#26212B]">
          لوحة تحكم وإدارة طلبات مانشيز
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to={ROUTES.HOME}
          target="_blank"
          className="flex items-center gap-1.5 text-xs font-bold text-[#512080] hover:underline"
        >
          <span>عرض موقع الزبائن</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Test sound button */}
        <button
          onClick={handleTestSound}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[#512080] bg-[#F3EDFA] hover:bg-purple-100 transition-colors cursor-pointer"
          title="تجربة الصوت"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>تجربة الصوت</span>
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
              unreadCount > 0 ? 'text-[#512080]' : ''
            }`}
          />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -end-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#E84D45] text-white text-[10px] font-black px-1 shadow-sm animate-bounce">
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
