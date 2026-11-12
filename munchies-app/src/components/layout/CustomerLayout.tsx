/**
 * @module components/layout/CustomerLayout
 * @description Layout wrapper for customer pages with restaurant closed banner, navbar, mobile menu, and cart drawer.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { RestaurantClosedBanner } from './RestaurantClosedBanner';
import { Navbar } from './Navbar';
import { MobileMenu } from './MobileMenu';
import { Footer } from './Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCFE] w-full overflow-x-clip">
      <RestaurantClosedBanner />
      <Navbar />
      <MobileMenu />
      <CartDrawer />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
