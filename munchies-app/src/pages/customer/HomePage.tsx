/**
 * @module pages/customer/HomePage
 * @description Munchie's main landing page: hero, shop by category, best sellers, and branch details. Strictly Arabic.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  Award,
  Clock,
  MapPin,
  Phone,
  UtensilsCrossed,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/Button';
import { ProductGrid } from '@/components/product/ProductGrid';
import { HeroSection } from '@/components/home/HeroSection';
import { PRODUCTS, CATEGORIES } from '@/data/mockData';

export const HomePage: React.FC = () => {
  const bestSellers = PRODUCTS.filter((p) => p.isBestSeller).slice(0, 6);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* ─── Redesigned Hero Section ─── */}
      <HeroSection />

      {/* ─── Shop By Category ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-extrabold text-[#512080] uppercase tracking-wider block mb-1">
              الأقسام الرئيسية
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#26212B]">
              تسوق حسب القسم
            </h2>
          </div>
          <Link
            to={ROUTES.MENU}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#512080] hover:text-[#461C6E]"
          >
            <span>عرض جميع الأصناف</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
            <Link
              key={cat.id}
              to={`${ROUTES.MENU}?category=${cat.id}`}
              className="group p-5 rounded-3xl bg-white border border-gray-100 hover:border-[#512080] hover:shadow-lg transition-all duration-300 text-center flex flex-col items-center justify-center gap-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F5F3F7] group-hover:bg-[#F3EDFA] text-[#512080] flex items-center justify-center transition-colors">
                <UtensilsCrossed className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#26212B] group-hover:text-[#512080] transition-colors">
                  {cat.name.ar}
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">
                  {cat.productCount} صنف
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Best Sellers ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>اختيارات زبائننا المفضلة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#26212B]">
              الأكثر طلباً ومبيعاً
            </h2>
          </div>
          <Link
            to={ROUTES.MENU}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#512080] hover:text-[#461C6E]"
          >
            <span>كل المنيو</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ProductGrid products={bestSellers} />
      </section>

      {/* ─── Promotional Banner ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#512080] to-[#6B3FA0] text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-[#FFDA35] text-[#26212B] text-xs font-black uppercase tracking-wider inline-block">
              عروض التوفير
            </span>
            <h3 className="text-2xl sm:text-4xl font-black leading-tight text-[#FFDA35]">
              كومبو بطاطس + كولا بـ ٣٥ جنيه بس!
            </h3>
            <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
              كمل وجبتك مع أي سندوتش أو برجر واطلب كومبو البطاطس المقرمشة والكولا المنعشة بخصم رائع.
            </p>
            <div className="pt-2">
              <Link to={ROUTES.MENU}>
                <Button size="md" variant="yellow" className="font-extrabold px-6">
                  اطلب الآن
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Differentiators ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF8E9] text-[#512080] flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-[#26212B] mb-1">
                جودة لحوم 100% طازجة
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                لحم بقري مفروم فريش يومياً بدون مجمدات أو إضافات صناعية.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F3EDFA] text-[#512080] flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-[#26212B] mb-1">
                خلطة صوصات مانشيز الخاصة
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                صوصات مبتكرة تمنح كل قضمة طعماً غنياً لا ينسى.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#512080] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-[#26212B] mb-1">
                استلام فوري وسريع
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                اطلب أونلاين واستلم طلبك سخن وجاهز من الفرع بدون انتظار.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Location & Branch details ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#F5F3F7] p-8 sm:p-10 border border-gray-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-start">
            <span className="text-xs font-black text-[#512080] uppercase tracking-wider block">
              زورونا في أسوان
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#26212B]">
              فرع الكورنيش - حديقة الورد
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-gray-600 pt-1">
              <div className="flex items-center gap-1.5 justify-center md:justify-start">
                <MapPin className="w-4 h-4 text-[#512080]" />
                <span>حديقة الورد أمام الراية – الكورنيش، أسوان</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center md:justify-start">
                <Phone className="w-4 h-4 text-[#512080]" />
                <span className="number-ltr font-bold">01025707026</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <a
              href="tel:01025707026"
              className="inline-block"
            >
              <Button variant="primary" size="lg" leftIcon={Phone}>
                اتصل بالمطعم
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
