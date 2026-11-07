/**
 * @module components/layout/Footer
 * @description Rich 3-column footer with brand identity, branch details, and quick links.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Phone, MapPin, Clock, Heart } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#26212B] text-white pt-16 pb-8 border-t-4 border-[#FFDA35]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-gray-800">
          {/* Col 1: Brand & Story */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#512080] flex items-center justify-center overflow-hidden border-2 border-[#FFDA35] shadow-md">
                <img src="/fb_logo.jpg" alt="Munchie's Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-[#FFDA35] tracking-wider leading-none">
                  مانشيز MUNCHIE'S
                </span>
                <span className="text-xs text-purple-300 font-bold mt-1">لو كبير عليك، اضغطه! 🍔</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              مطعم مانشيز بأسوان - أشهى ساندوتشات البرجر، الفات بير، وفرايز لوديد بأعلى جودة ولحوم بلدية طازجة 100%. Fries to meet you 💜
            </p>
            <div className="pt-1">
              <a
                href="https://www.facebook.com/p/Munchies-%D9%85%D8%A7%D9%86%D8%B4%D9%8A%D8%B2-61579057995805/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#512080] hover:bg-[#6B3FA0] text-white text-xs font-bold transition-all shadow-xs border border-[#FFDA35]/30 group"
              >
                <span>صفحتنا على فيسبوك (+4,900 متابع في أسوان) 💜</span>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white uppercase tracking-wider">
              روابط سريعة
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to={ROUTES.HOME} className="hover:text-[#FFDA35] transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to={ROUTES.MENU} className="hover:text-[#FFDA35] transition-colors">
                  المنيو
                </Link>
              </li>
              <li>
                <Link to={ROUTES.OFFERS} className="hover:text-[#FFDA35] transition-colors">
                  العروض
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ABOUT} className="hover:text-[#FFDA35] transition-colors">
                  عن مانشيز
                </Link>
              </li>
              <li>
                <Link to={ROUTES.CONTACT} className="hover:text-[#FFDA35] transition-colors">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Branch Info */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white uppercase tracking-wider">
              الفرع والتواصل
            </h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FFDA35] shrink-0 mt-1" />
                <span>حديقة الورد أمام الراية – فرع الكورنيش، أسوان</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FFDA35] shrink-0" />
                <a href="tel:01025707026" className="number-ltr font-bold hover:text-white transition-colors">
                  01025707026
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#FFDA35] shrink-0" />
                <span>يومياً من 12:00 ظهراً حتى 3:00 فجراً</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>جميع الحقوق محفوظة لمطعم مانشيز © 2026</p>
          <p className="flex items-center gap-1.5">
            <span>صنع بكل</span>
            <Heart className="w-3.5 h-3.5 text-[#E84D45] fill-current" />
            <span>في أسوان</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

