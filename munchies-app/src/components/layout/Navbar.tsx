/**
 * @module components/layout/Navbar
 * @description Premium deep-purple navigation bar integrated with the Munchie's brand identity.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User, Shield } from 'lucide-react';
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
    { label: 'العروض 🔥', path: ROUTES.OFFERS },
    { label: 'عن مانشيز', path: ROUTES.ABOUT },
    { label: 'تواصل معنا', path: ROUTES.CONTACT },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#3E1467]/95 backdrop-blur-md border-b border-white/10 transition-all text-white shadow-md w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Right side (in RTL): Brand Logo & Mascot, then Mobile hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#512080] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform overflow-hidden border-2 border-[#FFDA35] shrink-0">
              <img src="/fb_logo.jpg" alt="Munchie's Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl font-black tracking-tight text-white leading-none">
                مانشيز
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-[#2E0B50] bg-[#FFDA35] px-1 sm:px-1.5 py-0.5 rounded-xs mt-0.5 uppercase tracking-wider self-start shadow-2xs">
                MUNCHIE'S
              </span>
            </div>
          </Link>

          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-1.5 sm:p-2 rounded-xl text-white hover:bg-white/10 cursor-pointer"
            aria-label="فتح القائمة"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-[#FFDA35] text-[#2E0B50] font-black shadow-md'
                    : 'text-white/90 hover:text-[#FFDA35] hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Left side (in RTL): Language Switcher, Cart, Profile, Admin */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Language Switcher Capsule */}
          <div className="hidden sm:flex items-center bg-black/30 rounded-full p-1 border border-white/15 text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded-full text-white/60 select-none cursor-default">
              EN
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFDA35] text-[#2E0B50] font-black shadow-xs select-none">
              AR
            </span>
          </div>

          {/* Cart Icon with notification badge */}
          <CartIcon className="text-white hover:text-[#FFDA35] hover:bg-white/10" />

          {/* Admin link if user is admin */}
          {isAdmin && (
            <Link to={ROUTES.ADMIN_DASHBOARD} className="hidden sm:inline-flex">
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Shield className="w-3.5 h-3.5 me-1 text-[#FFDA35]" />
                لوحة التحكم
              </Button>
            </Link>
          )}

          {/* User Profile or Login */}
          {isAuthenticated ? (
            <Link
              to={ROUTES.PROFILE}
              className="p-1.5 sm:p-2 rounded-full text-white hover:text-[#FFDA35] hover:bg-white/10 transition-colors"
              title={user?.fullName || 'حسابي'}
            >
              <User className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              to={ROUTES.LOGIN}
              className="p-1.5 sm:p-2 rounded-full text-white hover:text-[#FFDA35] hover:bg-white/10 transition-colors"
              title="تسجيل الدخول"
            >
              <User className="w-5 h-5" />
            </Link>
          )}

          {/* Quick Order Button */}
          <Link to={ROUTES.MENU} className="hidden sm:inline-flex">
            <Button
              size="sm"
              variant="yellow"
              className="font-black px-4 py-2 shadow-md hover:scale-105 transition-transform"
            >
              اطلب دلوقتي
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
