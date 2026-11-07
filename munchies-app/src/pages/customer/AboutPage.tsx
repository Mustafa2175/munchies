/**
 * @module pages/customer/AboutPage
 * @description Munchie's story, vision, culinary values, and branch gallery. Strictly Arabic.
 */

import React from 'react';
import { Award, Heart, UtensilsCrossed } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-black text-[#512080] uppercase tracking-wider block">
          قصتنا في أسوان
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#26212B]">
          عن مطعم مانشيز
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          انطلقنا من قلب أسوان بشغف تقديم تجربة أكل شارع فاخرة وأصيلة تناسب كل الأذواق بأعلى معايير الجودة والنظافة.
        </p>
      </div>

      {/* Main Feature Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4 text-gray-700 leading-relaxed text-sm sm:text-base">
          <h2 className="text-2xl font-black text-[#512080]">
            سر النكهة والطعم الذي لا يُنسى
          </h2>
          <p>
            في مانشيز، نؤمن أن جودة الساندوتش تبدأ من التفاصيل الصغيرة. نختار لحومنا البلدية الطازجة يومياً بعناية فائقة، ونحضر صوصاتنا السرية الخاصة داخل مطبخنا لنضمن لك في كل مرة نكهة مميزة ومتوازنة.
          </p>
          <p>
            سواء كنت تفضل البرجر الكلاسيكي، أو سندوتشات الفات بير الضخمة، أو الفرايز الغرقانة بالجبنة، نحن هنا لنجعل كل وجبة تجربة تسعدك.
          </p>
        </div>

        <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-xl border-4 border-white">
          <img
            src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80"
            alt="مطبخ مانشيز"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF8E9] text-[#512080] flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-[#26212B]">
            مكونات بلدية طازجة
          </h3>
          <p className="text-xs text-gray-500">
            لا نستخدم اللحوم المجمدة نهائياً، كل مكوناتنا طازجة يومياً.
          </p>
        </Card>

        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F3EDFA] text-[#512080] flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-[#26212B]">
            وصفات مبتكرة وحصرية
          </h3>
          <p className="text-xs text-gray-500">
            خلطات صوصات ومجموعات نكهات مميزة لن تجدها في أي مكان آخر.
          </p>
        </Card>

        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#512080] flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-[#26212B]">
            خدمة وضيافة أسوانية
          </h3>
          <p className="text-xs text-gray-500">
            نهتم برضاك وسرعة تجهيز طلبك بحب وابتسامة دائمة.
          </p>
        </Card>
      </div>
    </div>
  );
};
