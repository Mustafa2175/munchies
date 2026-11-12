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
    <div className="space-y-10 sm:space-y-14 pb-12 w-full overflow-x-clip">
      {/* ─── 1. Hero Section ─── */}
      <HeroSection />

      {/* ─── 2. Categories Section (Navigation Shortcuts) ─── */}
      <CategoryShortcuts />

      {/* ─── 3. Best Sellers Section ("الأكثر مبيعاً") ─── */}
      <BestSellersSection />

      {/* ─── 4. Offers Section ("العروض") ─── */}
      <OffersSection />

      {/* ─── 5. Full Menu CTA ("شوف المنيو كامل") ─── */}
      <FullMenuCTA />
    </div>
  );
};
