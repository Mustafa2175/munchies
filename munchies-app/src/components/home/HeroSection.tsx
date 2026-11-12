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
      className="relative overflow-hidden bg-[#2B084E] text-white min-h-[480px] sm:min-h-[540px] lg:min-h-[760px] xl:min-h-[810px] 2xl:min-h-[850px] pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20 lg:pb-32 flex items-center select-none w-full"
    >
      {/* Isolated background stack: actual storefront photograph + monochrome purple & smooth gradient blending */}
      <div
        className="absolute inset-0 overflow-hidden isolate pointer-events-none select-none"
        aria-hidden="true"
      >
        {/* Layer 1: Original restaurant storefront photo (softly blurred, grayscale, slightly shifted left on desktop so full MUNCHIES sign frames clear of RTL copy) */}
        <img
          src="/hero-restaurant-bg.jpg"
          alt="واجهة مطعم مانشيز ولافتة المحل المضيئة"
          className="w-full h-full object-cover object-[48%_center] lg:object-[center_36%] scale-[1.06] lg:scale-[1.12] lg:-translate-x-[5%] grayscale contrast-[1.16] brightness-[0.84] lg:brightness-[0.95] blur-[3px] sm:blur-[3.5px] lg:blur-[4px] select-none pointer-events-none"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />

        {/* Layer 2: Purple monochrome colorize layer harmonizing storefront highlights into brand purple */}
        <div className="absolute inset-0 bg-[#7A2ECA] mix-blend-color" />

        {/* Layer 3: Deep Munchie's purple multiply wash for tonal cohesion */}
        <div className="absolute inset-0 bg-[#401270]/55 lg:bg-[#46167B]/45 mix-blend-multiply" />

        {/* Layer 4a (Mobile/Tablet): Vertical + centered radial scrim so blurred sign peeks through cleanly behind readable white copy */}
        <div
          className="lg:hidden absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(32, 6, 62, 0.68) 0%, rgba(43, 8, 78, 0.30) 26%, rgba(43, 8, 78, 0.42) 58%, rgba(36, 6, 68, 0.72) 100%), radial-gradient(ellipse 88% 64% at 50% 52%, rgba(38, 7, 70, 0.56) 0%, rgba(43, 8, 78, 0.28) 65%, transparent 100%)',
          }}
        />

        {/* Layer 4b (Desktop): Smooth horizontal fade keeping illuminated left/center storefront visible while keeping right-side text area deep & clean */}
        <div
          className="hidden lg:block absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(38, 7, 70, 0.20) 0%, rgba(42, 8, 78, 0.26) 30%, rgba(45, 9, 82, 0.56) 50%, rgba(44, 8, 80, 0.85) 66%, rgba(40, 7, 74, 0.96) 80%, #2B084E 95%), linear-gradient(to bottom, rgba(28, 5, 56, 0.54) 0%, transparent 22%, transparent 78%, rgba(34, 6, 64, 0.58) 100%)',
          }}
        />

        {/* Layer 5: Desktop subtle radial ambient lift behind text column without reducing contrast */}
        <div className="hidden lg:block absolute inset-0 bg-[radial-gradient(ellipse_at_78%_48%,rgba(116,46,192,0.28),transparent_62%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full">
          {/* Column 1 (Centered on mobile; Right side in RTL desktop): Headline, slogan/description & CTAs */}
          <div className="lg:col-span-6 lg:ps-4 xl:ps-8 flex flex-col items-center lg:items-start text-center lg:text-start space-y-4 sm:space-y-5 lg:space-y-7 w-full min-w-0">
            {/* Headline Block */}
            <div className="space-y-3 sm:space-y-3.5 lg:space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                مش اي برجر ...
              </h1>

              <div>
                <span className="inline-block px-5 sm:px-7 py-2 sm:py-2.5 rounded-2xl bg-[#FFDA35] text-[#260840] text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight shadow-md shadow-black/15 lg:shadow-lg lg:shadow-black/20">
                  ده مانشيز!
                </span>
              </div>
            </div>

            {/* Mobile brand slogan */}
            <p className="lg:hidden text-white/95 text-lg sm:text-xl font-bold tracking-tight leading-snug pt-0.5">
              لو كبير عليك، اضغطه
            </p>

            {/* Desktop supporting copy */}
            <p className="hidden lg:block text-white/90 text-xl font-medium max-w-lg leading-relaxed">
              لحوم بلدية طازة، صوصات خاصة، وألذ إضافات بتتحضر كل يوم في أسوان.
            </p>

            {/* CTA Buttons (Single primary button on mobile; Primary + Secondary on desktop) */}
            <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1 sm:pt-2 w-full lg:w-auto">
              <Link
                to={ROUTES.MENU}
                className="inline-flex items-center justify-center gap-2.5 w-full max-w-[240px] lg:w-auto lg:max-w-none lg:min-w-[140px] lg:gap-2 px-7 lg:px-8 py-3.5 lg:py-4 rounded-2xl bg-[#FFDA35] hover:bg-[#FFE35A] text-[#260840] font-black text-base shadow-md shadow-black/15 lg:shadow-lg lg:shadow-[#FFDA35]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group cursor-pointer whitespace-nowrap"
              >
                <span>اطلب دلوقتي</span>
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1 ltr:rotate-180 ltr:group-hover:translate-x-1 stroke-[2.5]" />
              </Link>

              <Link
                to={ROUTES.MENU}
                className="hidden lg:inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-base border border-white/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                <UtensilsCrossed className="w-5 h-5 text-[#FFDA35]" />
                <span>شوف المنيو</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
