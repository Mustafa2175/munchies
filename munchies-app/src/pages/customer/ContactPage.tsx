/**
 * @module pages/customer/ContactPage
 * @description Contact details, working hours, and branch map info. Strictly Arabic.
 */

import React from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const ContactPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#26212B]">
          تواصل مع مانشيز
        </h1>
        <p className="text-sm text-gray-500">
          نسعد دائماً باستقبالكم في فرعنا أو استقبال اتصالاتكم واستفساراتكم.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF8E9] text-[#512080] flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#26212B]">
            موقع الفرع
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            حديقة الورد أمام الراية – فرع الكورنيش، أسوان
          </p>
        </Card>

        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F3EDFA] text-[#512080] flex items-center justify-center mx-auto">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#26212B]">
            الهاتف والواتساب
          </h3>
          <p className="text-xs font-bold text-[#512080] number-ltr">01025707026</p>
          <div className="pt-2">
            <a href="tel:01025707026">
              <Button size="sm" variant="secondary">
                اتصال مباشر
              </Button>
            </a>
          </div>
        </Card>

        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#512080] flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#26212B]">
            ساعات العمل
          </h3>
          <p className="text-xs text-gray-500">
            يومياً من 12:00 ظهراً حتى 3:00 فجراً
          </p>
        </Card>
      </div>

      {/* Social Media Card */}
      <Card className="p-6 bg-gradient-to-r from-[#F3EDFA] to-[#FFF8E9] border-[#FFDA35]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#512080] overflow-hidden flex items-center justify-center border-2 border-[#FFDA35] shadow-xs shrink-0">
            <img src="/fb_logo.jpg" alt="Munchie's Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-black text-base text-[#512080]">تابع صفحتنا الرسمية على فيسبوك</h3>
            <p className="text-xs text-gray-600">أكثر من 4,900 متابع في أسوان! عروض يومية وصور طازجة من المطبخ 💜</p>
          </div>
        </div>
        <a
          href="https://www.facebook.com/p/Munchies-%D9%85%D8%A7%D9%86%D8%B4%D9%8A%D8%B2-61579057995805/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="primary" size="md" className="font-bold shrink-0">
            زيارة صفحة فيسبوك
          </Button>
        </a>
      </Card>

      {/* Map visual card */}
      <Card className="overflow-hidden border-gray-100">
        <div className="p-6 bg-gradient-to-r from-[#512080] to-[#6B3FA0] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-xl text-[#FFDA35]">
              زورنا على الكورنيش في أسوان
            </h3>
            <p className="text-xs text-gray-200 mt-1">
              حديقة الورد أمام الراية – موقع متميز وإطلالة ساحرة على النيل
            </p>
          </div>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="yellow" size="md" className="font-bold">
              فتح على خرائط جوجل
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
};
