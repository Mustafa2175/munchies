/**
 * @module components/layout/Footer
 * @description Clean 3-column footer with brand identity, branch details, and quick links.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-white pt-14 pb-8 border-t-4 border-yellow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-gray-800">
          {/* Col 1: Brand & Story */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center overflow-hidden border-2 border-yellow shadow-md">
                <img src="/fb_logo.jpg" alt="شعار مانشيز" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-yellow tracking-wider leading-none">
                  Munchie's | مانشيز
                </span>
                <span className="text-xs text-purple-200 font-bold mt-1">لو كبير عليك، اضغطه! 🍔</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              مطعم مانشيز في أسوان — أشهى ساندوتشات البرجر، الفات بير، والـ Loaded Fries بأعلى جودة ولحوم بلدية طازة 100%.
            </p>
            <div className="pt-1">
              <a
                href="https://www.facebook.com/p/Munchies-%D9%85%D8%A7%D9%86%D8%B4%D9%8A%D8%B2-61579057995805/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-xs border border-yellow/30"
              >
                <span>تابعنا على فيسبوك</span>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              روابط سريعة
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to={ROUTES.HOME} className="hover:text-yellow transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to={ROUTES.MENU} className="hover:text-yellow transition-colors">
                  المنيو
                </Link>
              </li>
              <li>
                <Link to={ROUTES.OFFERS} className="hover:text-yellow transition-colors">
                  العروض
                </Link>
              </li>
              <li>
                <Link to={ROUTES.TRACK_ORDER} className="hover:text-yellow transition-colors">
                  تابع طلبك
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ABOUT} className="hover:text-yellow transition-colors">
                  حكايتنا
                </Link>
              </li>
              <li>
                <Link to={ROUTES.CONTACT} className="hover:text-yellow transition-colors">
                  كلمنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Branch Info */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              مكاننا وكلمنا
            </h4>
            <div className="space-y-2.5 text-sm text-gray-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-yellow shrink-0 mt-0.5" />
                <span>حديقة الورد أمام الراية – فرع الكورنيش، أسوان</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-yellow shrink-0" />
                <a href="tel:01025707026" className="number-ltr font-bold hover:text-white transition-colors">
                  01025707026
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-yellow shrink-0" />
                <span>يومياً من 12:00 ظهراً حتى 3:00 فجراً</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex items-center justify-center text-xs text-gray-500">
          <p>جميع الحقوق محفوظة لـ Munchie's © 2026</p>
        </div>
      </div>
    </footer>
  );
};
