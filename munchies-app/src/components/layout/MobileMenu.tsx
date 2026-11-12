/**
 * @module components/layout/MobileMenu
 * @description Slide-in drawer for mobile navigation strictly in Arabic.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Phone, MapPin, PackageSearch } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { ROUTES } from '@/config/routes';

export const MobileMenu: React.FC = () => {
  const location = useLocation();
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore();

  if (!isMobileMenuOpen) return null;

  const navLinks = [
    { label: 'الرئيسية', path: ROUTES.HOME },
    { label: 'تتبع طلبك', path: ROUTES.TRACK_ORDER, icon: PackageSearch },
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
        className="fixed inset-0 bg-dark/50 backdrop-blur-xs transition-opacity"
        onClick={closeMobileMenu}
      />

      <div className="fixed inset-y-0 start-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-slide-in-right">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-light-gray">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary overflow-hidden flex items-center justify-center border border-yellow/40 shadow-xs">
              <img src="/fb_logo.jpg" alt="شعار مانشيز" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-primary text-base leading-tight">مانشيز MUNCHIE'S</span>
              <span className="text-[10px] text-medium-gray font-bold">لو كبير عليك، اضغطه!</span>
            </div>
          </div>
          <button
            onClick={closeMobileMenu}
            className="p-1.5 rounded-lg text-medium-gray hover:text-dark hover:bg-white transition-colors cursor-pointer"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-dark hover:bg-light-gray'
                }`}
              >
                <span>{link.label}</span>
                {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-yellow' : 'text-medium-gray'}`} />}
              </Link>
            );
          })}
        </div>

        {/* Footer info in drawer */}
        <div className="p-4 border-t border-border bg-light-gray text-xs text-medium-gray space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
            <a href="tel:01025707026" className="number-ltr font-bold text-dark">
              01025707026
            </a>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>حديقة الورد أمام الراية – الكورنيش، أسوان</span>
          </div>
        </div>
      </div>
    </div>
  );
};
