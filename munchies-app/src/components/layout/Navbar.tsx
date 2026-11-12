/**
 * @module components/layout/Navbar
 * @description Adaptive shared navigation bar:
 * - Floating translucent glass pill ONLY on the homepage while the Hero section (#hero-section) is visible.
 * - Normal full-width solid Munchie's purple (#512080) bar after scrolling past Hero and on all other routes.
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User as UserIcon } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { CartIcon } from '@/components/cart/CartIcon';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === ROUTES.HOME;
  const routeKey = location.key;

  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const { isAuthenticated, user, isAdmin } = useAuthStore();

  // Tracks the homepage visit key once the Hero scrolls completely above the navbar.
  // Keeping this keyed per navigation ensures `/` always renders in floating-glass mode on entry
  // and immediately reverts to normal full-width `#512080` on inner routes with zero stale state.
  const [scrolledPastHeroKey, setScrolledPastHeroKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isHomePage) return;

    const heroEl = document.getElementById('hero-section');
    if (!heroEl) return;

    const desktopMedia = window.matchMedia('(min-width: 640px)');
    let observer: IntersectionObserver | null = null;

    const setupObserver = () => {
      observer?.disconnect();
      const topOffset = desktopMedia.matches ? 72 : 64;
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          const nextKey = entry.isIntersecting ? null : routeKey;
          setScrolledPastHeroKey((prev) => (prev === nextKey ? prev : nextKey));
        },
        {
          root: null,
          rootMargin: `-${topOffset}px 0px 0px 0px`,
          threshold: 0,
        }
      );
      observer.observe(heroEl);
    };

    setupObserver();
    desktopMedia.addEventListener('change', setupObserver);

    return () => {
      observer?.disconnect();
      desktopMedia.removeEventListener('change', setupObserver);
    };
  }, [isHomePage, routeKey]);

  const isHeroVisible = isHomePage && scrolledPastHeroKey !== routeKey;
  const isFloatingGlass = isHomePage && isHeroVisible;

  const navLinks = [
    { label: 'المنيو', path: ROUTES.MENU },
    { label: 'العروض', path: ROUTES.OFFERS },
    { label: 'اعمل ساندوتشك', path: '/build-your-own' },
  ];

  const userAccountRoute = isAdmin ? ROUTES.ADMIN : ROUTES.ORDERS;

  return (
    <header
      className={`sticky top-0 z-40 w-full h-16 sm:h-[72px] shrink-0 ${
        isHomePage
          ? `-mb-16 sm:-mb-[72px] pointer-events-none transition-[padding] duration-300 ease-out ${
              isFloatingGlass ? 'pt-3 sm:pt-4 px-3 sm:px-6' : 'pt-0 px-0'
            }`
          : ''
      }`}
    >
      <div
        className={`pointer-events-auto mx-auto text-white border-b ${
          isHomePage
            ? 'transition-[background-color,border-radius,border-color,box-shadow,height,max-width] duration-300 ease-out'
            : ''
        } ${
          isFloatingGlass
            ? 'max-w-6xl h-14 sm:h-16 px-3.5 sm:px-6 rounded-2xl bg-[#2B0A4E]/45 backdrop-blur-md border-transparent ring-1 ring-inset ring-white/15 shadow-[0_8px_28px_rgba(14,3,28,0.22)]'
            : 'max-w-full w-full h-16 sm:h-[72px] px-4 sm:px-6 lg:px-8 rounded-none bg-[#512080] border-white/10 shadow-md'
        }`}
      >
        <div
          className={`mx-auto h-full flex items-center justify-between lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-4 ${
            isFloatingGlass ? 'w-full' : 'max-w-7xl'
          }`}
        >
          {/* Start side (Right in RTL, Left in LTR): Actual Munchie's logo only */}
          <div className="flex items-center lg:justify-self-start shrink-0">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center shrink-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDA35]"
              aria-label="Munchie's - الرئيسية"
            >
              <img
                src="/munchies-logo.png"
                alt="Munchie's"
                className="h-10 sm:h-12 w-auto object-contain select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:scale-[1.03]"
              />
            </Link>
          </div>

          {/* Center: Minimal desktop & tablet navigation */}
          <nav
            className="hidden md:flex items-center justify-center lg:justify-self-center gap-2 lg:gap-7"
            aria-label="التنقل الرئيسي"
          >
            {navLinks.map((link) => {
              const isActive =
                link.path === ROUTES.MENU
                  ? location.pathname.startsWith(ROUTES.MENU) ||
                    location.pathname.startsWith('/product')
                  : location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-2.5 py-1.5 text-sm lg:text-[15px] whitespace-nowrap transition-colors duration-200 select-none ${
                    isActive
                      ? "text-[#FFDA35] font-black after:content-[''] after:absolute after:bottom-0 after:inset-x-2 after:h-0.5 after:rounded-full after:bg-[#FFDA35]"
                      : 'text-white/95 font-bold hover:text-[#FFDA35]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* End side (Left in RTL, Right in LTR): Account, Cart, Order CTA & Mobile Hamburger */}
          <div className="flex items-center justify-end lg:justify-self-end gap-1 sm:gap-2 shrink-0">
            {/* Account */}
            <Link
              to={userAccountRoute}
              className="relative w-10 h-10 rounded-xl text-white hover:text-[#FFDA35] hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer select-none active:scale-95"
              title={isAuthenticated ? user?.fullName || 'حسابي' : 'حسابي'}
              aria-label="حسابي"
            >
              <UserIcon className="w-5 h-5 stroke-[2]" />
              {isAuthenticated && (
                <span className="absolute top-2 end-2 w-2 h-2 rounded-full bg-[#FFDA35] shadow-xs" />
              )}
            </Link>

            {/* Cart */}
            <CartIcon />

            {/* Primary Order CTA (tablet & desktop) */}
            <Link to={ROUTES.MENU} className="hidden md:inline-flex ms-1">
              <Button
                size="sm"
                variant="yellow"
                className="h-9 px-4 font-black text-xs lg:text-sm rounded-xl shadow-sm hover:shadow-md whitespace-nowrap"
              >
                اطلب دلوقتي
              </Button>
            </Link>

            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="md:hidden w-10 h-10 rounded-xl text-white hover:text-[#FFDA35] hover:bg-white/10 cursor-pointer active:scale-95 transition-colors flex items-center justify-center"
              aria-label="فتح القائمة"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
