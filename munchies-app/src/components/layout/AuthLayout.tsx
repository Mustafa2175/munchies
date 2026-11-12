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
    <div className="min-h-screen bg-light-gray flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-6 end-6">
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2.5 group">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-yellow shadow-md group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            مانشيز MUNCHIE'S
          </span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-2xl border border-border">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
