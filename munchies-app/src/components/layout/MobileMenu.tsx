/**
 * @module components/layout/MobileMenu
 * @description Slide-in drawer for mobile navigation strictly in Arabic.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Phone, MapPin } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { ROUTES } from '@/config/routes';

export const MobileMenu: React.FC = () => {
  const location = useLocation();
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore();

  if (!isMobileMenuOpen) return null;

  const navLinks = [
    { label: 'الرئيسية', path: ROUTES.HOME },
    { label: 'تتبع طلبك 🔍', path: ROUTES.TRACK_ORDER },
    { label: 'المنيو', path: ROUTES.MENU },
    { label: 'اصنع ساندوتشك', path: '/build-your-own' },
    { label: 'العروض', path: ROUTES.OFFERS },
    { label: 'عن مانشيز', path: ROUTES.ABOUT },
    { label: 'تواصل معنا', path: ROUTES.CONTACT },
  ];

  const handleLinkClick = () => {
    closeMobileMenu();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={closeMobileMenu}
      />

      <div className="fixed inset-y-0 start-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-slide-in-right">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-[#F5F3F7]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#512080] overflow-hidden flex items-center justify-center border border-[#FFDA35]/40 shadow-xs">
              <img src="/fb_logo.jpg" alt="Munchie's Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-[#512080] text-base leading-tight">مانشيز MUNCHIE'S</span>
              <span className="text-[10px] text-gray-500 font-bold">لو كبير عليك، اضغطه! 🍔</span>
            </div>
          </div>
          <button
            onClick={closeMobileMenu}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#512080] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Footer info in drawer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#512080]" />
            <span className="number-ltr font-semibold">01025707026</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#512080]" />
            <span>حديقة الورد أمام الراية – الكورنيش، أسوان</span>
          </div>
        </div>
      </div>
    </div>
  );
};
