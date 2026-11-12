/**
 * @module components/home/OffersSection
 * @description Promotional Offers banner section.
 * Clean, bold purple card with real food photography and straightforward pricing.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useOfferStore, type PromotionOffer } from '@/stores/offerStore';
import { formatPrice } from '@/lib/currency';

export const OffersSection: React.FC = () => {
  const navigate = useNavigate();
  const getActiveOffers = useOfferStore((s) => s.getActiveOffers);
  const activeOffers = getActiveOffers();

  const [activeIndex, setActiveIndex] = useState(0);

  if (activeOffers.length === 0) {
    return null;
  }

  const currentOffer: PromotionOffer = activeOffers[activeIndex] || activeOffers[0];

  const titleText =
    typeof currentOffer.title === 'object' && currentOffer.title?.ar
      ? currentOffer.title.ar
      : (currentOffer.title as string) || "عرض Munchie's المميز";

  const badgeText =
    typeof currentOffer.badge === 'object' && (currentOffer.badge as any)?.ar
      ? (currentOffer.badge as any).ar
      : typeof currentOffer.badge === 'string'
      ? currentOffer.badge.replace(/[🔥👑✨]/gu, '').trim()
      : 'عرض خاص';

  const offerImage =
    currentOffer.imageUrl ||
    currentOffer.image ||
    '/hero_food_blended.png';

  const handleBannerClick = () => {
    navigate(ROUTES.OFFERS);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center text-primary">
            <Tag className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-dark tracking-tight">
            اختيارات تستاهل تجربها
          </h2>
        </div>

        <Link
          to={ROUTES.MENU}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-primary text-primary hover:bg-primary-50 transition-colors text-xs sm:text-sm font-bold group cursor-pointer"
        >
          <span>شوف المنيو</span>
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
        </Link>
      </div>

      {/* Main Offer Banner Card */}
      <div
        onClick={handleBannerClick}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 to-primary-900 text-white p-5 sm:p-8 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer group select-none"
      >
        <div className="relative z-10 flex flex-row items-center justify-between gap-4 sm:gap-6">
          {/* Text Content */}
          <div className="space-y-2.5 sm:space-y-3.5 flex-1 min-w-0 text-start">
            {/* Clean Yellow Badge */}
            <div className="inline-block">
              <span className="px-3 py-1 rounded-md text-xs font-black bg-yellow text-dark">
                {badgeText}
              </span>
            </div>

            {/* Offer Title */}
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
              {titleText}
            </h3>

            {/* Price */}
            {currentOffer.price && (
              <div className="pt-1">
                <span className="inline-flex items-center px-4 py-1.5 rounded-xl bg-yellow text-dark font-black text-sm sm:text-base shadow-sm">
                  <span className="font-bold tabular-nums number-ltr">{formatPrice(Number(currentOffer.price))}</span>
                </span>
              </div>
            )}
          </div>

          {/* Food Cutout */}
          <div className="relative w-36 sm:w-56 md:w-64 shrink-0 flex items-center justify-center">
            <img
              src={offerImage}
              alt={titleText}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/hero_burger_clean_cutout.png';
              }}
              className="w-full h-auto max-h-36 sm:max-h-48 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-300 relative z-10"
            />
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      {activeOffers.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {activeOffers.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`transition-all duration-200 rounded-full cursor-pointer ${
                  isActive
                    ? 'w-6 h-2 bg-primary'
                    : 'w-2 h-2 bg-primary-100 hover:bg-primary-200'
                }`}
                aria-label={`انتقل إلى العرض ${index + 1}`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};
