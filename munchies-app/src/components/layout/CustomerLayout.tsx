/**
 * @module components/layout/CustomerLayout
 * @description Layout wrapper for customer pages with restaurant closed banner, navbar, mobile menu, and cart drawer.
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { RestaurantClosedBanner } from './RestaurantClosedBanner';
import { Navbar } from './Navbar';
import { MobileMenu } from './MobileMenu';
import { Footer } from './Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ROUTES } from '@/config/routes';

export const CustomerLayout: React.FC = () => {
  const location = useLocation();
  const isCheckout = location.pathname.startsWith(ROUTES.CHECKOUT);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCFE] w-full overflow-x-clip">
      <RestaurantClosedBanner />
      <Navbar />
      <MobileMenu />
      <CartDrawer />
      <main className="flex-1 w-full min-w-0">
        <Outlet />
      </main>
      {!isCheckout ? (
        <Footer />
      ) : (
        <footer className="py-4 border-t border-border bg-white text-center text-xs text-medium-gray hidden sm:block">
          Munchie's أسوان • جميع الحقوق محفوظة
        </footer>
      )}
    </div>
  );
};
