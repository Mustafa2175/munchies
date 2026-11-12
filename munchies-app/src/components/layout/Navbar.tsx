/**
 * @module components/layout/Navbar
 * @description Navigation bar integrated with Munchie's brand identity.
 * Fully responsive: Logo + Hamburger on right (in RTL), Desktop links in center, Account + Cart on left.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, PackageSearch, User as UserIcon } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { CartIcon } from '@/components/cart/CartIcon';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);
  const { isAuthenticated, user, isAdmin } = useAuthStore();

  const navLinks = [
    { label: 'الرئيسية', path: ROUTES.HOME },
    { label: 'المنيو', path: ROUTES.MENU },
    { label: 'اصنع ساندوتشك', path: '/build-your-own' },
    { label: 'العروض', path: ROUTES.OFFERS },
    { label: 'عن مانشيز', path: ROUTES.ABOUT },
    { label: 'تواصل معنا', path: ROUTES.CONTACT },
  ];

  const userAccountRoute = isAdmin ? ROUTES.ADMIN : ROUTES.ORDERS;

  return (
    <header className="sticky top-0 z-40 bg-[#3E1467]/95 backdrop-blur-md border-b border-white/10 transition-all text-white shadow-md w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-4">
        {/* Right side (in RTL): Brand Logo & Mobile hamburger */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#512080] flex items-center justify-center shadow-md overflow-hidden border-2 border-[#FFDA35] shrink-0">
              <img src="/fb_logo.jpg" alt="شعار مانشيز" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
              مانشيز
            </span>
          </Link>

          {/* Hamburger Menu on Mobile */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 cursor-pointer active:scale-95 transition-transform flex items-center justify-center"
            aria-label="فتح القائمة"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-[#FFDA35] text-[#26212B] font-black shadow-xs'
                    : 'text-white/90 hover:text-[#FFDA35] hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Left side (in RTL): Track order, Account, Cart, Quick Order */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Track Order Link (desktop only) */}
          <Link
            to={ROUTES.TRACK_ORDER}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/90 hover:text-[#FFDA35] hover:bg-white/10 transition-colors cursor-pointer"
            title="تتبع طلبك"
            aria-label="تتبع طلبك"
          >
            <PackageSearch className="w-4 h-4 text-[#FFDA35]" />
            <span className="text-xs font-bold">تتبع طلبك</span>
          </Link>

          {/* Account / User Icon */}
          <Link
            to={userAccountRoute}
            className="p-2 rounded-xl text-white/95 hover:text-[#FFDA35] hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer select-none active:scale-95"
            title={isAuthenticated ? (user?.fullName || 'حسابي') : 'تسجيل الدخول / حسابي'}
            aria-label="حسابي"
          >
            <div className="relative">
              <UserIcon className="w-5 h-5 stroke-[2]" />
              {isAuthenticated && (
                <span className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-[#FFDA35] ring-2 ring-[#3E1467]" />
              )}
            </div>
          </Link>

          {/* Cart Icon */}
          <CartIcon className="text-white hover:text-[#FFDA35] hover:bg-white/10 rounded-xl" />

          {/* Quick Order Button (desktop only) */}
          <Link to={ROUTES.MENU} className="hidden sm:inline-flex">
            <Button
              size="sm"
              variant="yellow"
              className="font-black px-4"
            >
              اطلب دلوقتي
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
