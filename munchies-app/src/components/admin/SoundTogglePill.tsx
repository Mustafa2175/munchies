/**
 * @module components/admin/SoundTogglePill
 * @description Floating bottom-left pill indicator showing whether the admin
 * notification chime is enabled or muted. Clicking it toggles the preference
 * (persisted in localStorage) and plays a test chime when toggled ON.
 */

import React, { useState } from 'react';
import {
  isSoundEnabled,
  toggleSoundEnabled,
  playNewOrderChime,
  unlockAudioContext,
} from '@/utils/soundNotification';

export const SoundTogglePill: React.FC = () => {
  const [enabled, setEnabled] = useState(isSoundEnabled);

  const handleToggle = async () => {
    // Unlock audio on interaction
    await unlockAudioContext();
    const newVal = toggleSoundEnabled();
    setEnabled(newVal);
    // If toggled ON, play a test chime so admin knows it works
    if (newVal) {
      playNewOrderChime();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        fixed bottom-5 start-5 z-50
        flex items-center gap-2 px-4 py-2.5
        rounded-full text-xs font-extrabold
        shadow-lg border transition-all duration-300
        cursor-pointer select-none
        hover:scale-105 active:scale-95
        ${
          enabled
            ? 'bg-[#512080] text-white border-purple-400/40 shadow-purple-500/25'
            : 'bg-gray-700 text-gray-300 border-gray-600 shadow-gray-800/30'
        }
      `}
      title={enabled ? 'اضغط لكتم صوت التنبيه' : 'اضغط لتفعيل صوت التنبيه'}
    >
      <span className="text-base leading-none">{enabled ? '🔊' : '🔇'}</span>
      <span>{enabled ? 'الصوت مفعّل - نغمة التنبيه' : 'الصوت مكتوم'}</span>
    </button>
  );
};

