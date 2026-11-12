/**
 * @module pages/customer/AboutPage
 * @description Munchie's story, culinary values, and branch details. Strictly Arabic.
 */

import React from 'react';
import { Award, Heart, UtensilsCrossed } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-black text-primary uppercase tracking-wider block">
          حكايتنا في أسوان
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-dark">
          مين Munchie's؟
        </h1>
        <p className="text-base text-medium-gray leading-relaxed">
          بدأنا من كورنيش أسوان بشغف نعمل ساندوتشات Burger وFat Bear بصوصات Fresh وجودة تفرق معاك من أول لقمة.
        </p>
      </div>

      {/* Main Feature Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4 text-dark leading-relaxed text-sm sm:text-base">
          <h2 className="text-2xl font-black text-primary">
            إيه سر الطعم في Munchie's؟
          </h2>
          <p className="text-medium-gray">
            في Munchie's بنهتم بكل تفصيلة في الساندوتش؛ من اختيار اللحوم البلدية الطازة كل يوم، لحد صوصاتنا اللي بنحضرها بنفسنا في مطبخنا عشان تاخد طعم مظبوط في كل أوردر.
          </p>
          <p className="text-medium-gray">
            سواء بتحب الـ Burger الكلاسيك، أو ساندوتشات الـ Fat Bear، أو الـ Loaded Fries الغرقانة جبنة وصوص... إحنا دايمًا جاهزين نقدملك تجربة تبسطك في أسوان.
          </p>
        </div>

        <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-card border border-border bg-light-gray flex items-center justify-center p-6">
          <img
            src="/hero_food_blended.png"
            alt="أطباق Munchie's الطازة"
            className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]"
          />
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-dark">
            لحوم بلدية Fresh
          </h3>
          <p className="text-xs text-medium-gray">
            بنستخدم لحوم طازة كل يوم وبنحضر كل ساندوتش وقت ما تطلبه على طول.
          </p>
        </Card>

        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-dark">
            صوصات مخصوص لمطبخنا
          </h3>
          <p className="text-xs text-medium-gray">
            وصفات صوصات وإضافات متظبطة عشان تليق على كل ساندوتش في المنيو.
          </p>
        </Card>

        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-primary flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-dark">
            خدمة سريعة في أسوان
          </h3>
          <p className="text-xs text-medium-gray">
            فريقنا في فرع الكورنيش هدفه يوصلك طلبك سخن وبأحسن جودة.
          </p>
        </Card>
      </div>
    </div>
  );
};
