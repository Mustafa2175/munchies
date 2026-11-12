/**
 * @module components/admin/SoundTogglePill
 * @description Floating bottom-left pill indicator showing whether the admin
 * notification chime is enabled or muted. Clicking it toggles the preference
 * (persisted in localStorage) and plays a test chime when toggled ON.
 */

import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
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
        rounded-full text-xs font-bold
        shadow-lg border transition-all duration-300
        cursor-pointer select-none
        hover:scale-105 active:scale-95
        ${
          enabled
            ? 'bg-primary text-white border-primary-light/40 shadow-primary/25'
            : 'bg-dark text-gray-300 border-gray-700 shadow-dark/30'
        }
      `}
      title={enabled ? 'اضغط لكتم صوت التنبيه' : 'اضغط لتفعيل صوت التنبيه'}
    >
      {enabled ? (
        <Volume2 className="w-4 h-4 text-yellow shrink-0" />
      ) : (
        <VolumeX className="w-4 h-4 text-gray-400 shrink-0" />
      )}
      <span>{enabled ? 'الصوت مفعّل' : 'الصوت مكتوم'}</span>
    </button>
  );
};

