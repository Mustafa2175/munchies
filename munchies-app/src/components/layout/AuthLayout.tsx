/**
 * @module components/layout/AuthLayout
 * @description Branded Munchie's authentication layout card supporting Arabic RTL and English LTR.
 */

import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';

export const AuthLayout: React.FC = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  return (
    <div className="min-h-screen bg-[#F5F3F7] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Bar: Back to store */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-6">
        <Link
          to={ROUTES.MENU}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark transition-colors"
        >
          <ArrowRight className={`w-4 h-4 ${isEn ? 'rotate-180' : ''}`} />
          <span>{isEn ? 'Back to Menu' : 'العودة للمنيو'}</span>
        </Link>
      </div>

      {/* Brand Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center justify-center gap-3 px-5 py-2.5 rounded-2xl bg-[#512080] shadow-md hover:bg-[#3D1860] transition-colors"
          aria-label="Munchie's"
        >
          <img
            src="/munchies-logo.png"
            alt="Munchie's"
            className="h-10 w-auto object-contain select-none"
          />
        </Link>
      </div>

      {/* Auth Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-9 shadow-card rounded-2xl border border-border">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
