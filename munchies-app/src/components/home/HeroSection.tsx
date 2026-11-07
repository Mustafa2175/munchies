/**
 * @module components/home/HeroSection
 * @description Munchie's high-impact food advertising Hero section.
 * Rebuilt to match the visual reference:
 * - Rich deep purple gradient background (#451773 to #25083F)
 * - Corner yellow brush streaks framing the composition with zero overflow
 * - Hand-drawn yellow crown doodle positioned above "برجر..."
 * - Bold Arabic display headline: "مش أي برجر..."
 * - Expressive jagged yellow paint brush banner: "ده مانشيز!" with underline strokes
 * - Supporting text: "لقمة ورا لقمة، هتفهم إحنا ليه اختيارك."
 * - Left CTA: "اطلب دلوقتي" (yellow pill with left arrow)
 * - Right CTA: "اكتشف المنيو" (white border with burger icon)
 * - Bottom info row: branch location on left, separator, fulfillment on right
 * - Dominant burger cutout visual with melted cheddar drip, fries, and branded wrapper
 * - Seamless desktop and mobile responsiveness
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#451773] via-[#37115E] to-[#25083F] text-white pt-8 sm:pt-12 pb-14 sm:pb-20 select-none w-full">
      {/* ─── Top-Right Corner Yellow Paint Brush Sweep (Zero Overflow) ─── */}
      <div
        className="absolute top-0 right-0 w-48 h-48 sm:w-80 sm:h-80 pointer-events-none select-none opacity-90 overflow-hidden z-0"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full text-[#FFDA35] fill-current"
        >
          <path d="M 60,0 C 110,35 155,75 178,135 C 192,170 196,190 200,200 L 200,0 Z" />
          <circle cx="145" cy="165" r="4" />
          <circle cx="168" cy="180" r="3" />
          <circle cx="125" cy="120" r="4.5" />
          <circle cx="105" cy="85" r="3" />
        </svg>
      </div>

      {/* ─── Bottom-Right Corner Yellow Paint Splash (Zero Overflow) ─── */}
      <div
        className="absolute bottom-0 right-2 sm:right-12 w-40 sm:w-60 h-24 sm:h-32 pointer-events-none select-none opacity-85 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <svg viewBox="0 0 180 90" className="w-full h-full text-[#FFDA35] fill-current">
          <path d="M 10,90 C 45,82 85,62 135,72 C 155,76 168,84 180,90 Z" />
          <circle cx="75" cy="52" r="4" />
          <circle cx="102" cy="48" r="3.5" />
          <circle cx="128" cy="58" r="2.5" />
          <circle cx="48" cy="65" r="3" />
        </svg>
      </div>

      {/* ─── Bottom-Left Subtle Yellow Paint Fleck ─── */}
      <div
        className="absolute bottom-0 left-2 sm:left-6 w-24 h-16 pointer-events-none select-none opacity-70 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 60" className="w-full h-full text-[#FFDA35] fill-current">
          <path d="M 0,60 C 20,55 50,45 80,50 C 95,52 100,60 100,60 Z" />
          <circle cx="40" cy="35" r="3" />
          <circle cx="65" cy="38" r="2" />
        </svg>
      </div>

      {/* ─── Ambient Glow Behind Visual ─── */}
      <div
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96 bg-[#FFDA35]/10 rounded-full blur-3xl pointer-events-none overflow-hidden"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/*
          Outer grid uses dir="ltr" so Column 1 is visually on the LEFT
          and Column 2 (dominant burger visual) is visually on the RIGHT,
          matching the food-advertising campaign reference.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center w-full" dir="ltr">
          {/* ════════════ Column 1 (Left on Desktop): Text, Headline, CTAs, Info ════════════ */}
          <div
            className="lg:col-span-6 xl:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-start space-y-6 sm:space-y-7 w-full min-w-0"
            dir="rtl"
          >
            {/* Top Headline Block with Crown Doodle */}
            <div className="relative inline-block mt-2">
              {/* Crown Doodle: Tilted right above "برجر..." on the left side of the Arabic phrase */}
              <div
                className="absolute -top-11 sm:-top-13 left-2 sm:left-6 pointer-events-none z-10"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 90 70"
                  className="w-14 h-11 sm:w-16 sm:h-13 text-[#FFDA35] rotate-[22deg] transform-gpu drop-shadow-[0_2px_10px_rgba(255,218,53,0.45)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 12 55 L 18 20 L 36 36 L 50 12 L 66 36 L 82 22 L 86 55 Z" />
                  <circle cx="18" cy="15" r="3.5" fill="currentColor" stroke="none" />
                  <circle cx="50" cy="8" r="3.5" fill="currentColor" stroke="none" />
                  <circle cx="82" cy="17" r="3.5" fill="currentColor" stroke="none" />
                </svg>
              </div>

              {/* Line 1: "مش أي برجر..." */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-tight leading-[1.1] drop-shadow-md">
                مش أي برجر...
              </h1>
            </div>

            {/* Line 2: "ده مانشيز!" on Yellow Torn Paint Stroke Banner */}
            <div className="relative inline-block -rotate-2 transform-gpu my-1 sm:my-2 max-w-full">
              {/* Dynamic Yellow Paint Stroke SVG Background */}
              <svg
                viewBox="0 0 460 120"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full -z-10 scale-y-120 scale-x-105 filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] pointer-events-none"
                aria-hidden="true"
              >
                {/* Main jagged brush stroke body */}
                <path
                  d="M 28,16
                     C 75,10 180,6 295,8
                     C 370,10 415,14 445,22
                     C 452,24 448,34 452,48
                     C 455,62 447,75 450,90
                     C 446,98 434,102 415,104
                     C 335,110 205,108 95,106
                     C 48,105 26,101 12,90
                     C 8,86 16,76 10,65
                     C 6,54 13,42 16,30
                     C 20,22 24,18 28,16 Z"
                  fill="#FFDA35"
                />
                {/* Splatter & bristle dots on the edges */}
                <circle cx="5" cy="54" r="3.5" fill="#FFDA35" />
                <circle cx="9" cy="24" r="2.5" fill="#FFDA35" />
                <circle cx="7" cy="84" r="3" fill="#FFDA35" />
                <circle cx="2" cy="70" r="2" fill="#FFDA35" />
                <circle cx="454" cy="38" r="2.5" fill="#FFDA35" />
                <circle cx="450" cy="78" r="3" fill="#FFDA35" />
                <circle cx="455" cy="62" r="2" fill="#FFDA35" />
              </svg>

              {/* Hand-drawn double brush underlines below the right side of the banner */}
              <div
                className="absolute -bottom-4 right-4 w-36 sm:w-44 h-4 pointer-events-none select-none z-0"
                aria-hidden="true"
              >
                <svg viewBox="0 0 160 20" className="w-full h-full">
                  <path
                    d="M 10 6 Q 80 4 150 2"
                    stroke="#FFDA35"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 50 14 Q 100 13 145 11"
                    stroke="#FFDA35"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>

              {/* Banner Text: "ده مانشيز!" with exclamation mark kept on the left in Arabic */}
              <span className="relative z-10 px-6 sm:px-9 py-2 sm:py-2.5 text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-[#260840] tracking-tight block select-text">
                ده مانشيز&#x21;
              </span>
            </div>

            {/* Supporting Sentence */}
            <p className="text-white/95 text-sm sm:text-lg lg:text-xl font-bold tracking-wide max-w-xl leading-relaxed">
              لقمة ورا لقمة، هتفهم إحنا ليه اختيارك.
            </p>

            {/* CTA Buttons Row: Left is "اطلب دلوقتي", Right is "اكتشف المنيو" */}
            <div
              className="flex flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-4 pt-2 sm:pt-3 w-full max-w-md"
              dir="ltr"
            >
              {/* Primary CTA (Left): "اطلب دلوقتي" with left arrow */}
              <Link
                to={ROUTES.MENU}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-full bg-[#FFDA35] hover:bg-[#FFE35A] text-[#260840] font-black text-xs sm:text-base md:text-lg shadow-xl shadow-[#FFDA35]/30 hover:scale-105 active:scale-95 transition-all duration-200 group cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1 stroke-[2.5]" />
                <span className="tracking-wide">اطلب دلوقتي</span>
              </Link>

              {/* Secondary CTA (Right): "اكتشف المنيو" with burger icon */}
              <Link
                to={ROUTES.MENU}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2.5 px-3.5 sm:px-7 py-3 sm:py-4 rounded-full bg-transparent hover:bg-white/10 text-white font-black text-xs sm:text-base md:text-lg border-2 border-white shadow-md hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-xs whitespace-nowrap"
              >
                <span className="tracking-wide">اكتشف المنيو</span>
                {/* Yellow Burger Icon matching reference */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFDA35] fill-none stroke-current"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 10C3 5.5 7.5 2 12 2C16.5 2 21 5.5 21 10H3Z" />
                  <circle cx="9.5" cy="5.5" r="0.5" fill="currentColor" stroke="none" />
                  <circle cx="14.5" cy="6" r="0.5" fill="currentColor" stroke="none" />
                  <circle cx="12" cy="7.8" r="0.5" fill="currentColor" stroke="none" />
                  <path d="M3 13.5H21" />
                  <path d="M5 13.5L7 16H17L19 13.5" />
                  <path d="M4 18H20C20 20.2 16.5 22 12 22C7.5 22 4 20.2 4 18Z" />
                </svg>
              </Link>
            </div>

            {/* Bottom Info Row: Left is Location, Center is |, Right is Fulfillment */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-1.5 sm:gap-4 pt-4 sm:pt-6 border-t border-white/15 text-white font-bold text-[11px] sm:text-sm w-full max-w-lg"
              dir="ltr"
            >
              {/* Branch location on the left */}
              <div className="flex items-center gap-1.5 sm:gap-2" dir="rtl">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#FFDA35] flex items-center justify-center shrink-0 shadow-xs">
                  <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#260840] fill-current" />
                </div>
                <span className="text-white/95">أسوان - كورنيش النيل - حديقة الورد</span>
              </div>

              {/* Yellow separator bar */}
              <span className="text-[#FFDA35] font-black text-sm select-none hidden sm:inline" aria-hidden="true">
                |
              </span>

              {/* Restaurant fulfillment on the right */}
              <div className="flex items-center gap-1.5 sm:gap-2" dir="rtl">
                <span className="text-white/95">استلام من المطعم</span>
                {/* Munchie's Takeaway Bag Icon in Yellow */}
                <div className="w-4 h-4 sm:w-6 sm:h-6 text-[#FFDA35] shrink-0" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
                    <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
                    <path
                      d="M12 17c1.66 0 3-1.34 3-3h-2c0 .55-.45 1-1 1s-1-.45-1-1H9c0 1.66 1.34 3 3 3z"
                      fill="#260840"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ════════════ Column 2 (Right on Desktop): Dominant Burger Visual ════════════ */}
          <div
            className="lg:col-span-6 xl:col-span-5 relative flex items-center justify-center lg:justify-end mt-4 lg:mt-0 w-full min-w-0"
            dir="ltr"
          >
            {/* White Action Burst Doodle Lines to the upper-left of the burger */}
            <div
              className="absolute -top-4 sm:top-2 left-2 sm:left-6 z-20 pointer-events-none"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 55 50"
                className="w-10 h-9 sm:w-14 sm:h-12 text-white/95 fill-none stroke-current drop-shadow-sm"
                strokeWidth="4"
                strokeLinecap="round"
              >
                <path d="M 8 36 L 20 22" />
                <path d="M 26 40 L 33 14" />
                <path d="M 44 38 L 40 18" />
              </svg>
            </div>

            {/* Main Burger Cutout with Fries, Paper Wrapper, and Cheese Drip */}
            <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-none lg:scale-105 xl:scale-110 transform hover:scale-[1.08] transition-transform duration-500 ease-out origin-center lg:origin-right">
              <img
                src="/hero_burger_clean_cutout.png"
                alt="مانشيز دبل بيف برجر طازج مع الجبنة الذائبة، الفرايز المقرمشة، وتفاصيل النكهة الأصلية"
                className="w-full h-auto object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.65)] select-none pointer-events-none"
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
