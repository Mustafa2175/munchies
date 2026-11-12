/**
 * @module components/layout/AdminSidebar
 * @description Sidebar navigation for restaurant staff strictly in Arabic.
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Utensils,
  Layers,
  Sliders,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToCollection } from '@/lib/firestore';
import type { Order } from '@/types';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen = false, onClose }) => {
  const logout = useAuthStore((state) => state.logout);
  const adminUser = useAuthStore((state) => state.adminUser);
  const location = useLocation();
  const [orderCount, setOrderCount] = useState<number | null>(null);

  // Live real-time subscription for order count badge
  useEffect(() => {
    const unsub = subscribeToCollection<Order>('orders', (remoteOrders) => {
      setOrderCount((remoteOrders || []).length);
    });
    return () => unsub();
  }, []);

  const menuItems = [
    {
      label: 'الطلبات',
      path: ROUTES.ADMIN_DASHBOARD,
      icon: LayoutGrid,
      matchPaths: [ROUTES.ADMIN_DASHBOARD, ROUTES.ADMIN_ORDERS, '/admin'],
      count: orderCount,
    },
    { label: 'قائمة الأصناف', path: ROUTES.ADMIN_PRODUCTS, icon: Utensils },
    { label: 'أقسام المنيو', path: ROUTES.ADMIN_CATEGORIES, icon: Layers },
    { label: 'تشغيل المطعم والمواعيد', path: '/admin/operations', icon: Sliders },
    { label: 'تقارير المبيعات', path: ROUTES.ADMIN_ANALYTICS, icon: BarChart3 },
    { label: 'إعدادات الفرع', path: ROUTES.ADMIN_SETTINGS, icon: Settings },
    { label: 'سجل الأمان والتدقيق', path: ROUTES.ADMIN_AUDIT_LOG, icon: ShieldCheck },
  ];

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="p-6 max-md:p-5 border-b border-gray-800/80 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-yellow shadow-xs shrink-0">
            <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-black text-yellow text-base leading-none">مانشيز</h2>
            <span className="text-[10px] text-gray-400 font-medium">لوحة تحكم العمليات والمطبخ</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 md:hidden cursor-pointer"
            aria-label="إغلاق القائمة"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isItemActive =
            item.matchPaths?.includes(location.pathname) ||
            location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose?.()}
              className={() =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isItemActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                    isItemActive
                      ? 'bg-yellow text-dark'
                      : 'bg-white/10 text-gray-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Staff profile & logout */}
      <div className="p-4 border-t border-gray-800/80 bg-black/20 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">
              {adminUser?.name || 'إدارة المطعم'}
            </span>
            <span className="text-[10px] text-gray-400">
              {adminUser?.role === 'super_admin' ? 'مدير النظام' : 'مشرف الوردية'}
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop-first persistent sidebar (no transforms or RTL cascade conflicts) */}
      <aside className="hidden md:flex w-64 bg-dark text-white flex-col shrink-0 sticky top-0 h-screen border-e border-gray-800">
        {sidebarContent}
      </aside>

      {/* Narrow-viewport fallback drawer (< md) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[85vw] bg-dark text-white flex flex-col h-full border-e border-gray-800 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
