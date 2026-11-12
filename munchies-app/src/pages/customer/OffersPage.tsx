/**
 * @module pages/customer/OffersPage
 * @description Special promotional deals, combos, and bundles. Strictly Arabic.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { ROUTES } from '@/config/routes';

export const OffersPage: React.FC = () => {
  const offers = [
    {
      id: 'offer-1',
      title: 'عرض الكومبو الذهبي',
      description: 'اطلب أي برجر أو سندوتش واحصل على كومبو بطاطس + كولا بـ ٣٥ جنيه فقط بدلاً من ٥٥ جنيه!',
      price: 35,
      oldPrice: 55,
      badge: 'توفير 20 جنيه',
      image: '/hero_burger_clean_cutout.png',
    },
    {
      id: 'offer-2',
      title: 'دويتو مانشيز للأصدقاء',
      description: 'مانشيز بيف + مانشيز استربس + ٢ كب فرايز ٢ صوص بسعر خاص لفترة محدودة.',
      price: 320,
      oldPrice: 365,
      badge: 'خصم خاص',
      image: '/hero_food_blended.png',
    },
    {
      id: 'offer-3',
      title: 'بوكس العائلة الفاخر',
      description: '٤ سندوتشات من اختيارك + لوديد فرايز عائلي كبير + ٤ مشروبات غازية.',
      price: 650,
      oldPrice: 740,
      badge: 'توفير عائلي',
      image: '/hero_burger.png',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary text-xs font-black">
          <Tag className="w-3.5 h-3.5 text-primary" />
          <span>عروض Munchie's الحصرية</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-dark">
          العروض والتوفير
        </h1>
        <p className="text-sm text-medium-gray">
          أحلى Combos وعروض توفير عشان تستمتع بأكل Munchie's مع أصحابك وعيلتك.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <Card key={offer.id} hoverable className="flex flex-col h-full border-border">
            <div className="relative aspect-16/10 overflow-hidden bg-light-gray flex items-center justify-center p-4">
              <img
                src={offer.image}
                alt={offer.title}
                className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
              />
              <span className="absolute top-3 start-3 bg-danger text-white text-[11px] font-black px-2.5 py-1 rounded-md shadow-xs">
                {offer.badge}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-black text-lg text-dark">
                  {offer.title}
                </h3>
                <p className="text-xs text-medium-gray mt-2 leading-relaxed">
                  {offer.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-baseline gap-2">
                  <CurrencyDisplay amount={offer.price} className="text-xl font-black text-primary" />
                  <span className="text-xs text-medium-gray line-through tabular-nums">
                    {offer.oldPrice} ج.م
                  </span>
                </div>

                <Link to={ROUTES.MENU}>
                  <Button size="sm" variant="yellow" rightIcon={ArrowLeft} className="font-black">
                    اطلب دلوقتي
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
