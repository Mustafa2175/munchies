/**
 * @module components/home/HeroSection
 * @description Spacious, balanced Munchie's Hero section designed beneath a floating glass navbar.
 * Highlights the brand headline, supporting description, ordering CTAs, and prominent burger showcase.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export const HeroSection: React.FC = () => {
  return (
    <section
      id="hero-section"
      className="relative overflow-hidden bg-gradient-to-br from-[#512080] via-[#3A1262] to-[#21073B] text-white pt-24 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 lg:pb-28 lg:min-h-[700px] xl:min-h-[750px] flex items-center select-none w-full"
    >
      {/* Subtle seamless ambient depth across the Hero canvas */}
      <div
        className="absolute inset-0 pointer-events-none select-none bg-[radial-gradient(ellipse_at_top_center,rgba(123,58,196,0.28),transparent_65%)]"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full">
          {/* Column 1 (Start side: Right in RTL, Left in LTR): Headline, description & CTAs */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-start space-y-6 sm:space-y-7 w-full min-w-0">
            {/* Headline Block */}
            <div className="space-y-3.5 sm:space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                مش أي برجر...
              </h1>

              <div>
                <span className="inline-block px-5 sm:px-7 py-2 sm:py-2.5 rounded-2xl bg-[#FFDA35] text-[#260840] text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight shadow-lg shadow-black/20">
                  ده مانشيز!
                </span>
              </div>
            </div>

            {/* Supporting Copy */}
            <p className="text-white/90 text-[15px] sm:text-lg lg:text-xl font-medium max-w-lg leading-relaxed">
              لحوم بلدية طازجة، صوصات خاصة، وألذ إضافات محضرة يومياً في أسوان.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1 sm:pt-2 w-full max-w-md lg:max-w-none">
              <Link
                to={ROUTES.MENU}
                className="flex-1 sm:flex-initial min-w-[140px] inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-[#FFDA35] hover:bg-[#FFE35A] text-[#260840] font-black text-sm sm:text-base shadow-lg shadow-[#FFDA35]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group cursor-pointer whitespace-nowrap"
              >
                <span>اطلب دلوقتي</span>
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1 ltr:rotate-180 ltr:group-hover:translate-x-1 stroke-[2.5]" />
              </Link>

              <Link
                to={ROUTES.MENU}
                className="flex-1 sm:flex-initial min-w-[140px] inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base border border-white/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFDA35]" />
                <span>تصفح المنيو</span>
              </Link>
            </div>
          </div>

          {/* Column 2 (End side: Left in RTL, Right in LTR): Prominent Burger Showcase */}
          <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end w-full min-w-0">
            <div className="relative w-full max-w-[290px] sm:max-w-[380px] lg:max-w-[540px] xl:max-w-[580px] mx-auto lg:mx-0">
              {/* Soft integrated warm glow behind the burger */}
              <div
                className="absolute inset-0 -m-6 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(255,218,53,0.16)_0%,rgba(123,58,196,0.18)_45%,transparent_72%)]"
                aria-hidden="true"
              />
              <img
                src="/hero_burger_clean_cutout.png"
                alt="برجر مانشيز الطازج بالجبنة الذائبة"
                className="relative z-10 w-full h-auto object-contain filter drop-shadow-[0_24px_38px_rgba(0,0,0,0.5)] select-none pointer-events-none"
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
