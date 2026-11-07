/**
 * @module components/layout/AuthLayout
 * @description Centered authentication layout card.
 */

import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F3F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-6 end-6">
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2.5 group">
          <div className="w-12 h-12 rounded-2xl bg-[#512080] flex items-center justify-center text-[#FFDA35] shadow-lg group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-3xl font-black text-[#512080] tracking-tight">
            مانشيز MUNCHIE'S
          </span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-gray-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

