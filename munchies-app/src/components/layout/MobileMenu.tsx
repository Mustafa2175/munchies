/**
 * @module components/layout/MobileMenu
 * @description Slide-in drawer for mobile navigation matching simplified navbar routes in Arabic.
 */

import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Phone, MapPin, PackageSearch, User as UserIcon } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/config/routes';

export const MobileMenu: React.FC = () => {
  const location = useLocation();
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore();
  const { isAdmin, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, closeMobileMenu]);

  if (!isMobileMenuOpen) return null;

  const navLinks = [
    { label: 'المنيو', path: ROUTES.MENU },
    { label: 'العروض', path: ROUTES.OFFERS },
    { label: 'اصنع ساندوتشك', path: '/build-your-own' },
    { label: 'تتبع طلبك', path: ROUTES.TRACK_ORDER, icon: PackageSearch },
    {
      label: isAuthenticated ? 'حسابي وطلباتي' : 'حسابي',
      path: isAdmin ? ROUTES.ADMIN : ROUTES.ORDERS,
      icon: UserIcon,
    },
  ];

  const handleLinkClick = () => {
    closeMobileMenu();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="القائمة الجانبية"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-dark/50 backdrop-blur-xs transition-opacity"
        onClick={closeMobileMenu}
      />

      <div className="fixed inset-y-0 start-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-slide-in-right">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#512080]">
          <Link
            to={ROUTES.HOME}
            onClick={handleLinkClick}
            className="inline-flex items-center shrink-0"
            aria-label="مانشيز - الصفحة الرئيسية"
          >
            <img
              src="/munchies-logo.png"
              alt="Munchie's"
              className="h-11 w-auto object-contain select-none"
            />
          </Link>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="w-10 h-10 rounded-xl text-white/90 hover:text-[#FFDA35] hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5" aria-label="قائمة الجوال">
          {navLinks.map((link) => {
            const isActive =
              link.path === ROUTES.MENU
                ? location.pathname.startsWith(ROUTES.MENU) ||
                  location.pathname.startsWith('/product')
                : location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-dark hover:bg-light-gray'
                }`}
              >
                <span>{link.label}</span>
                {Icon && (
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-yellow' : 'text-medium-gray'}`}
                  />
                )}
              </Link>
            );
          })}

          <div className="pt-3 px-1">
            <Link
              to={ROUTES.MENU}
              onClick={handleLinkClick}
              className="flex items-center justify-center w-full py-3 rounded-xl bg-[#FFDA35] hover:bg-[#FFE35A] text-[#260840] font-black text-sm shadow-sm transition-colors"
            >
              اطلب دلوقتي
            </Link>
          </div>
        </nav>

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
