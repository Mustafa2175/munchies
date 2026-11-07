/**
 * @module components/layout/AdminLayout
 * @description Master layout for administrative screens with sidebar and topbar.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

export const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#F5F3F7]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

