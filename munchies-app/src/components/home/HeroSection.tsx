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
      className="relative overflow-hidden bg-[#2B084E] text-white min-h-[395px] sm:min-h-[455px] lg:min-h-[760px] xl:min-h-[810px] 2xl:min-h-[850px] pt-[88px] sm:pt-28 lg:pt-36 pb-14 sm:pb-16 lg:pb-32 flex items-center select-none w-full"
    >
      {/* Isolated background stack: actual storefront photograph + monochrome purple & smooth gradient blending */}
      <div
        className="absolute inset-0 overflow-hidden isolate pointer-events-none select-none"
        aria-hidden="true"
      >
        {/* Layer 1: Original restaurant storefront photo (softer mobile blur/dimming to reduce signage distraction; desktop unchanged) */}
        <img
          src="/hero-restaurant-bg.jpg"
          alt="واجهة مطعم مانشيز ولافتة المحل المضيئة"
          className="w-full h-full object-cover object-[48%_center] lg:object-[center_36%] scale-[1.10] lg:scale-[1.12] lg:-translate-x-[5%] grayscale contrast-[1.04] lg:contrast-[1.16] brightness-[0.68] sm:brightness-[0.72] lg:brightness-[0.95] blur-[8px] sm:blur-[9px] lg:blur-[4px] select-none pointer-events-none"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />

        {/* Layer 2: Purple monochrome colorize layer harmonizing storefront highlights into brand purple */}
        <div className="absolute inset-0 bg-[#7A2ECA] mix-blend-color" />

        {/* Layer 3: Deep Munchie's purple multiply wash for tonal cohesion */}
        <div className="absolute inset-0 bg-[#360B64]/70 lg:bg-[#46167B]/45 mix-blend-multiply" />

        {/* Layer 4a (Mobile/Tablet): Smooth deep-purple gradient scrim softening signage glare behind crisp foreground copy */}
        <div
          className="lg:hidden absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(34, 6, 64, 0.78) 0%, rgba(42, 8, 78, 0.54) 28%, rgba(45, 9, 82, 0.50) 56%, rgba(38, 7, 70, 0.74) 84%, #2B084E 100%), radial-gradient(ellipse 92% 72% at 50% 48%, rgba(36, 6, 68, 0.64) 0%, rgba(43, 8, 78, 0.38) 62%, transparent 100%)',
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
          <div className="lg:col-span-6 lg:ps-4 xl:ps-8 flex flex-col items-center lg:items-start text-center lg:text-start space-y-3 sm:space-y-4 lg:space-y-7 w-full min-w-0">
            {/* Headline Block */}
            <div className="flex flex-col items-center lg:items-start space-y-2 sm:space-y-3 lg:space-y-4 max-w-full">
              <h1 className="text-[22px] sm:text-3xl lg:text-6xl font-extrabold lg:font-black text-white/95 lg:text-white tracking-tight leading-snug lg:leading-[1.15]">
                مش أي برجر...
              </h1>

              {/* Mobile & Tablet centerpiece: bold brand statement over hand-painted organic yellow brush stroke */}
              <div className="lg:hidden relative inline-flex items-center justify-center max-w-full px-8 min-[390px]:px-9 sm:px-11 py-3 sm:py-3.5 -rotate-[1.5deg] transform-gpu">
                <svg
                  viewBox="0 0 420 112"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none select-none drop-shadow-[0_10px_22px_rgba(14,2,28,0.45)]"
                  aria-hidden="true"
                >
                  <path
                    d="M 28,20 C 92,11 186,8 282,11 C 344,13 382,15 404,22 L 415,32 L 398,42 L 418,54 L 401,67 L 412,79 L 395,90 C 352,98 272,102 178,100 C 108,99 54,102 22,93 L 7,82 L 22,70 L 4,58 L 19,45 L 8,33 Z"
                    fill="#FFDA35"
                  />
                  <path
                    d="M 76,105 C 148,109 248,108 328,102 C 302,107 210,111 124,109 C 98,108 84,107 76,105 Z"
                    fill="#FFDA35"
                    opacity="0.88"
                  />
                </svg>
                <span className="relative z-10 text-[#260840] text-[clamp(2.45rem,11vw,3.35rem)] sm:text-[54px] font-black tracking-tight leading-[1.05] whitespace-nowrap">
                  ده مانشيز!
                </span>
              </div>

              {/* Desktop badge (preserved unchanged) */}
              <div className="hidden lg:block">
                <span className="inline-block px-5 sm:px-7 py-2 sm:py-2.5 rounded-2xl bg-[#FFDA35] text-[#260840] text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight shadow-md shadow-black/15 lg:shadow-lg lg:shadow-black/20">
                  ده مانشيز!
                </span>
              </div>
            </div>

            {/* Mobile brand slogan */}
            <p className="lg:hidden text-white/95 text-[17px] sm:text-xl font-bold tracking-tight leading-snug pt-0.5">
              لو كبير عليك، اضغطه
            </p>

            {/* Desktop supporting copy */}
            <p className="hidden lg:block text-white/90 text-xl font-medium max-w-lg leading-relaxed">
              أول لقمة كفاية تعرفك الفرق!
            </p>

            {/* CTA Buttons (Single purple primary button on mobile; Primary yellow + Secondary on desktop) */}
            <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 sm:pt-2.5 lg:pt-2 w-full lg:w-auto">
              <Link
                to={ROUTES.MENU}
                className="inline-flex items-center justify-center gap-2.5 w-full max-w-[235px] min-h-[48px] lg:min-h-0 lg:w-auto lg:max-w-none lg:min-w-[140px] lg:gap-2 px-7 lg:px-8 py-3.5 lg:py-4 rounded-2xl bg-[#6727AA] hover:bg-[#7732C0] active:bg-[#571E93] text-white border border-white/25 lg:border-0 lg:bg-[#FFDA35] lg:hover:bg-[#FFE35A] lg:active:bg-[#FFDA35] lg:text-[#260840] font-black text-base shadow-[0_10px_24px_rgba(14,2,28,0.5)] lg:shadow-lg lg:shadow-[#FFDA35]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group cursor-pointer whitespace-nowrap"
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
