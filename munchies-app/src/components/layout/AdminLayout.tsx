/**
 * @module components/layout/AdminLayout
 * @description Master layout for administrative screens with sidebar, topbar,
 * real-time new-order sound notifications, and a floating sound toggle pill.
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { SoundTogglePill } from '@/components/admin/SoundTogglePill';
import { useNewOrderNotification } from '@/hooks/useNewOrderNotification';

export const AdminLayout: React.FC = () => {
  const { unreadCount, clearUnread } = useNewOrderNotification();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-light-gray w-full overflow-x-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar
          unreadCount={unreadCount}
          onClearUnread={clearUnread}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <SoundTogglePill />
    </div>
  );
};
