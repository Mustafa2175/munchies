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
        <h1 className="text-3xl sm:text-4xl font-black text-dark">
          تواصل مع مانشيز
        </h1>
        <p className="text-sm text-medium-gray">
          نسعد دائماً باستقبالكم في فرعنا أو استقبال اتصالاتكم واستفساراتكم.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-dark">
            موقع الفرع
          </h3>
          <p className="text-xs text-medium-gray leading-relaxed">
            حديقة الورد أمام الراية – فرع الكورنيش، أسوان
          </p>
        </Card>

        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center mx-auto">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-dark">
            الهاتف والواتساب
          </h3>
          <p className="text-xs font-bold text-primary number-ltr">01025707026</p>
          <div className="pt-2">
            <a href="tel:01025707026">
              <Button size="sm" variant="secondary">
                اتصال مباشر
              </Button>
            </a>
          </div>
        </Card>

        <Card className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-primary flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-dark">
            ساعات العمل
          </h3>
          <p className="text-xs text-medium-gray">
            يومياً من 12:00 ظهراً حتى 3:00 فجراً
          </p>
        </Card>
      </div>

      {/* Social Media Card */}
      <Card className="p-6 border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary overflow-hidden flex items-center justify-center border-2 border-yellow shadow-xs shrink-0">
            <img src="/fb_logo.jpg" alt="شعار مانشيز" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-black text-base text-dark">تابع صفحتنا الرسمية على فيسبوك</h3>
            <p className="text-xs text-medium-gray">عروض أسبوعية وتحديثات فورية من مطبخنا في أسوان</p>
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
      <Card className="overflow-hidden border-border">
        <div className="p-6 bg-primary text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-xl text-yellow">
              زورنا على الكورنيش في أسوان
            </h3>
            <p className="text-xs text-purple-200 mt-1">
              حديقة الورد أمام الراية – موقع متميز على كورنيش النيل
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
