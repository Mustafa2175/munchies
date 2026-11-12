/**
 * @module components/auth/GoogleAuthButton
 * @description Reusable Google OAuth button with official brand icon and localized labels.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface GoogleAuthButtonProps {
  mode: 'login' | 'register';
  isEn: boolean;
  isLoading: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  mode,
  isEn,
  isLoading,
  disabled = false,
  onClick,
}) => {
  const label =
    mode === 'register'
      ? isEn
        ? isLoading
          ? 'Creating account with Google...'
          : 'Create new account with Google'
        : isLoading
        ? 'جاري إنشاء الحساب بجوجل...'
        : 'إنشاء حساب جديد باستخدام جوجل'
      : isEn
      ? isLoading
        ? 'Signing in with Google...'
        : 'Sign in with Google'
      : isLoading
      ? 'جاري تسجيل الدخول بجوجل...'
      : 'تسجيل الدخول باستخدام جوجل';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full h-11 px-4 rounded-xl bg-white border border-border hover:bg-gray-50 active:bg-gray-100 text-dark font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-[#512080] shrink-0" />
      ) : (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-8.97Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
          />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
};

