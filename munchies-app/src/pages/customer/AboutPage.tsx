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
          قصتنا في أسوان
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-dark">
          عن مطعم مانشيز
        </h1>
        <p className="text-base text-medium-gray leading-relaxed">
          انطلقنا من كورنيش أسوان بشغف تقديم ساندوتشات برجر وفات بير غنية بالصوصات الطازجة وأعلى معايير الجودة.
        </p>
      </div>

      {/* Main Feature Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4 text-dark leading-relaxed text-sm sm:text-base">
          <h2 className="text-2xl font-black text-primary">
            سر النكهة والطعم في مانشيز
          </h2>
          <p className="text-medium-gray">
            في مانشيز، نؤمن أن جودة الساندوتش تبدأ من التفاصيل. نختار لحومنا البلدية الطازجة بعناية، ونحضر صوصاتنا الخاصة داخل مطبخنا يومياً لنضمن لك نكهة متوازنة ومميزة في كل طلب.
          </p>
          <p className="text-medium-gray">
            سواء كنت تفضل البرجر الكلاسيكي، أو سندوتشات الفات بير، أو الفرايز الغرقانة بالجبنة، نحن هنا لنقدم لك تجربة ممتعة في كل مرة تزورنا فيها بأسوان.
          </p>
        </div>

        <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-card border border-border bg-light-gray flex items-center justify-center p-6">
          <img
            src="/hero_food_blended.png"
            alt="أطباق مانشيز الطازجة"
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
            لحوم بلدية طازجة
          </h3>
          <p className="text-xs text-medium-gray">
            نستخدم لحوماً طازجة يومياً ونحضر كل ساندوتش عند الطلب مباشرة.
          </p>
        </Card>

        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-dark">
            صوصات خاصة بمطبخنا
          </h3>
          <p className="text-xs text-medium-gray">
            وصفات صوصات وإضافات متوازنة تم ابتكارها لتناسب كل صنف بالمنيو.
          </p>
        </Card>

        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-primary flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-dark">
            خدمة وضيافة أسوانية
          </h3>
          <p className="text-xs text-medium-gray">
            فريقنا بفرع الكورنيش حريص على تقديم طلبك بأفضل سرعة وجودة.
          </p>
        </Card>
      </div>
    </div>
  );
};
