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
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToCollection } from '@/lib/firestore';
import type { Order } from '@/types';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
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

  const renderSidebarContent = (compact: boolean) => (
    <>
      {/* Brand */}
      <div
        className={`h-16 border-b border-gray-800/80 flex items-center shrink-0 ${
          compact ? 'px-2 justify-center' : 'px-5 justify-between gap-3'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-yellow shadow-xs shrink-0"
            title={compact ? 'مانشيز - لوحة تحكم العمليات' : undefined}
          >
            <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
          </div>
          {!compact && (
            <div className="min-w-0">
              <h2 className="font-black text-yellow text-base leading-none truncate">مانشيز</h2>
              <span className="text-[10px] text-gray-400 font-medium block truncate mt-0.5">
                لوحة تحكم العمليات والمطبخ
              </span>
            </div>
          )}
        </div>
        {!compact && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 md:hidden cursor-pointer shrink-0"
            aria-label="إغلاق القائمة"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto ${compact ? 'p-3 space-y-2' : 'p-4 space-y-1'}`}>
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
              title={compact ? item.label : undefined}
              aria-label={item.label}
              className={() =>
                compact
                  ? `relative flex items-center justify-center w-11 h-11 mx-auto rounded-xl transition-all ${
                      isItemActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  : `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isItemActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
              }
            >
              <Icon className={`${compact ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} />
              {!compact && <span className="flex-1 truncate">{item.label}</span>}
              {typeof item.count === 'number' && item.count > 0 && (
                <span
                  className={
                    compact
                      ? `absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[9px] font-bold tabular-nums shadow-xs ${
                          isItemActive
                            ? 'bg-yellow text-dark'
                            : 'bg-primary text-white'
                        }`
                      : `text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                          isItemActive
                            ? 'bg-yellow text-dark'
                            : 'bg-white/10 text-gray-300'
                        }`
                  }
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
        {compact ? (
          <button
            onClick={() => logout()}
            className="w-11 h-11 mx-auto flex items-center justify-center rounded-xl text-gray-400 hover:text-red-400 hover:bg-white/5 cursor-pointer transition-colors"
            title={`تسجيل الخروج (${adminUser?.name || 'إدارة المطعم'})`}
            aria-label="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">
                {adminUser?.name || 'إدارة المطعم'}
              </span>
              <span className="text-[10px] text-gray-400 truncate">
                {adminUser?.role === 'super_admin' ? 'مدير النظام' : 'مشرف الوردية'}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 cursor-pointer shrink-0"
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop-first collapsible sidebar (w-64 expanded <-> w-20 icon rail) */}
      <aside
        className={`hidden md:flex ${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-dark text-white flex-col shrink-0 sticky top-0 h-screen z-40 border-e border-gray-800 transition-[width] duration-200`}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center absolute top-4.5 -end-3.5 z-50 w-7 h-7 rounded-full bg-dark text-gray-300 hover:text-white hover:bg-primary border border-gray-700 shadow-md transition-colors cursor-pointer"
            title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة للأيقونات فقط'}
            aria-label={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {renderSidebarContent(isCollapsed)}
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
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
};
