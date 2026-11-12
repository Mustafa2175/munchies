/**
 * @module components/home/HeroSection
 * @description Munchie's high-impact brand hero section.
 * Clean, bold typography, authentic food photography, and clear primary/secondary CTAs.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#451773] via-[#37115E] to-[#25083F] text-white pt-10 sm:pt-14 pb-12 sm:pb-20 select-none w-full">
      {/* Clean geometric brand accent in top corner (contained, zero overflow) */}
      <div
        className="absolute top-0 right-0 w-48 h-48 sm:w-80 sm:h-80 pointer-events-none select-none opacity-30 overflow-hidden"
        aria-hidden="true"
      >
        <div className="w-full h-full bg-gradient-to-br from-[#FFDA35] to-transparent rounded-bl-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center w-full" dir="ltr">
          {/* Column 1 (Left on Desktop, Right in RTL): Headline, CTAs, Info */}
          <div
            className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-start space-y-5 sm:space-y-6 w-full min-w-0"
            dir="rtl"
          >
            {/* Headline Block */}
            <div className="space-y-2 mt-2 sm:mt-0">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                مش أي برجر...
              </h1>

              <div className="inline-block">
                <span className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl bg-[#FFDA35] text-[#260840] text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight shadow-md">
                  ده مانشيز!
                </span>
              </div>
            </div>

            {/* Supporting Copy */}
            <p className="text-white/90 text-sm sm:text-lg font-medium max-w-lg leading-relaxed">
              لحوم بلدية طازجة، صوصات خاصة، وألذ إضافات محضرة يومياً في أسوان.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 w-full max-w-md"
              dir="ltr"
            >
              {/* Primary CTA (Left): "اطلب دلوقتي" */}
              <Link
                to={ROUTES.MENU}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-[#FFDA35] hover:bg-[#FFE35A] text-[#260840] font-black text-sm sm:text-base shadow-lg shadow-[#FFDA35]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1 stroke-[2.5]" />
                <span>اطلب دلوقتي</span>
              </Link>

              {/* Secondary CTA (Right): "تصفح المنيو" */}
              <Link
                to={ROUTES.MENU}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                <span>تصفح المنيو</span>
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFDA35]" />
              </Link>
            </div>

            {/* Bottom Info Row: Branch location & fulfillment */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-6 pt-4 border-t border-white/10 text-white/90 text-xs sm:text-sm w-full max-w-lg"
              dir="rtl"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FFDA35]/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#FFDA35]" />
                </div>
                <span className="font-medium">أسوان - كورنيش النيل - حديقة الورد</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FFDA35]/20 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#FFDA35]" />
                </div>
                <span className="font-medium">توصيل واستلام من المطعم</span>
              </div>
            </div>
          </div>

          {/* Column 2 (Right on Desktop): Real Burger Photography */}
          <div
            className="hidden lg:flex lg:col-span-5 relative items-center justify-center lg:justify-end w-full min-w-0"
            dir="ltr"
          >
            <div className="relative w-full max-w-lg">
              <img
                src="/hero_burger_clean_cutout.png"
                alt="برجر مانشيز الطازج بالجبنة الذائبة"
                className="w-full h-auto object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] select-none pointer-events-none"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
