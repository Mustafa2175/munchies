/**
 * @module components/home/FullMenuCTA
 * @description Call-to-action block navigating to the full menu page.
 * Clean, inviting, and brand-aligned without decorative fluff.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export const FullMenuCTA: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 text-center">
      <div className="bg-white border border-border rounded-2xl p-6 sm:p-10 shadow-card flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
          <UtensilsCrossed className="w-6 h-6 stroke-[2.2]" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <h3 className="text-xl sm:text-2xl font-black text-dark">
            جعان؟ إحنا جاهزين!
          </h3>
          <p className="text-xs sm:text-sm text-medium-gray font-medium">
            اختار اللي على مزاجك من البرجر، الساندوتشات، الفرايز، والمشروبات الطازة
          </p>
        </div>

        <div className="pt-2">
          <Link
            to={ROUTES.MENU}
            className="inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold text-sm sm:text-base shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group cursor-pointer"
          >
            <span>شوف المنيو</span>
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </section>
  );
};
