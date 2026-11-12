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

const SIDEBAR_COLLAPSED_KEY = 'munchies_admin_sidebar_collapsed';

export const AdminLayout: React.FC = () => {
  const { unreadCount, clearUnread } = useNewOrderNotification();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-light-gray w-full overflow-x-clip">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar
          unreadCount={unreadCount}
          onClearUnread={clearUnread}
          onMenuClick={() => setIsSidebarOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={handleToggleCollapse}
        />
        <main className="flex-1 w-full p-6 max-md:p-4">
          <Outlet />
        </main>
      </div>
      <SoundTogglePill />
    </div>
  );
};
