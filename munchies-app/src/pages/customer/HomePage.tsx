/**
 * @module pages/customer/HomePage
 * @description Munchie's main landing page based on the mobile UI reference.
 * Structure in exact order:
 * 1. HeroSection (Header is in CustomerLayout)
 * 2. CategoryShortcuts
 * 3. BestSellersSection ("الأكثر مبيعاً")
 * 4. OffersSection ("العروض")
 * 5. FullMenuCTA ("شوف المنيو كامل")
 */

import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryShortcuts } from '@/components/home/CategoryShortcuts';
import { BestSellersSection } from '@/components/home/BestSellersSection';
import { OffersSection } from '@/components/home/OffersSection';
import { FullMenuCTA } from '@/components/home/FullMenuCTA';

export const HomePage: React.FC = () => {
  return (
    <div className="w-full overflow-x-clip">
      {/* ─── 1. Hero Section ─── */}
      <HeroSection />

      {/* ─── Curved White Content Surface Emerging Over Hero ─── */}
      <div className="curved-top-surface relative z-20 -mt-4 sm:-mt-7 lg:-mt-14 bg-[#FDFCFE] pt-6 sm:pt-8 lg:pt-10 pb-12 space-y-9 sm:space-y-12 lg:space-y-14 shadow-[0_-8px_24px_rgba(18,3,38,0.12)]">
        {/* ─── 2. Categories Section (Navigation Shortcuts) ─── */}
        <CategoryShortcuts />

        {/* ─── 3. Best Sellers Section ("الأكثر مبيعاً") ─── */}
        <BestSellersSection />

        {/* ─── 4. Offers Section ("العروض") ─── */}
        <OffersSection />

        {/* ─── 5. Full Menu CTA ("شوف المنيو كامل") ─── */}
        <FullMenuCTA />
      </div>
    </div>
  );
};
