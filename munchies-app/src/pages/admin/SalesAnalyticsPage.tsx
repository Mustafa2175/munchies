/**
 * @module pages/admin/SalesAnalyticsPage
 * @description Comprehensive sales analytics & product ranking dashboard
 * with real-time KPI cards, menu item rankings, and add-on/sauce rankings.
 * All data calculated dynamically from Firestore orders (excluding cancelled).
 * Strictly in Arabic with Munchies brand theme.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Award,
  ShoppingBag,
  Calendar,
  Star,
  Droplets,
  Crown,
  Hash,
} from 'lucide-react';
import type { Order, Category } from '@/types';
import { Card } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { getLocalizedText } from '@/lib/i18n';
import { subscribeToCollection } from '@/lib/firestore';
import { useProductStore } from '@/stores/productStore';
import { TIMEZONE } from '@/config/constants';
import { CATEGORIES } from '@/data/mockData';
import { toZonedTime } from 'date-fns-tz';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MenuItemStat {
  productId: string;
  name: string;
  category: string;
  imageUrl: string;
  quantitySold: number;
  totalRevenue: number;
}

interface AddOnStat {
  id: string;
  name: string;
  unitPrice: number;
  timesOrdered: number;
  totalRevenue: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get current date in Cairo timezone */
function getCairoNow(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/** Check if an ISO date string falls on today (Cairo timezone) */
function isToday(dateStr: string): boolean {
  try {
    const orderDate = toZonedTime(new Date(dateStr), TIMEZONE);
    const now = getCairoNow();
    return (
      orderDate.getFullYear() === now.getFullYear() &&
      orderDate.getMonth() === now.getMonth() &&
      orderDate.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
}

/** Check if an ISO date string falls in the current month (Cairo timezone) */
function isThisMonth(dateStr: string): boolean {
  try {
    const orderDate = toZonedTime(new Date(dateStr), TIMEZONE);
    const now = getCairoNow();
    return (
      orderDate.getFullYear() === now.getFullYear() &&
      orderDate.getMonth() === now.getMonth()
    );
  } catch {
    return false;
  }
}

/** Find the category name for a product */
function getCategoryName(categoryId: string, categories: Category[]): string {
  const cat = categories.find((c) => c.id === categoryId);
  return cat ? getLocalizedText(cat.name) : '';
}

/** Format number with commas for Arabic display */
function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** Get rank badge styling */
function getRankStyle(rank: number): { bg: string; text: string; border: string } {
  switch (rank) {
    case 1:
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
    case 2:
      return { bg: 'bg-gray-200', text: 'text-gray-700', border: 'border-gray-300' };
    case 3:
      return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export const SalesAnalyticsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const products = useProductStore((s) => s.products);

  // Subscribe to real-time Firestore orders
  useEffect(() => {
    const unsub = subscribeToCollection<Order>('orders', (remoteOrders) => {
      setOrders(remoteOrders || []);
    });
    return () => unsub();
  }, []);

  // ─── Computed analytics ──────────────────────────────────────────────────

  const analytics = useMemo(() => {
    // Filter out cancelled orders
    const validOrders = orders.filter(
      (o) => o.status !== 'cancelled' && o.status !== 'refunded'
    );

    // Today's orders (Cairo timezone)
    const todayOrders = validOrders.filter((o) => isToday(o.createdAt));
    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);

    // This month's orders (Cairo timezone)
    const monthOrders = validOrders.filter((o) => isThisMonth(o.createdAt));
    const monthSales = monthOrders.reduce((sum, o) => sum + o.total, 0);

    // ── Menu item statistics ────────────────────────────────────────────────
    const menuItemMap = new Map<string, MenuItemStat>();

    // Initialize all products (including those with 0 sales)
    for (const product of products) {
      menuItemMap.set(product.id, {
        productId: product.id,
        name: getLocalizedText(product.name),
        category: getCategoryName(product.categoryId, CATEGORIES),
        imageUrl: product.image || '',
        quantitySold: 0,
        totalRevenue: 0,
      });
    }

    // ── Add-on / sauce / combo statistics ────────────────────────────────────
    const addOnMap = new Map<string, AddOnStat>();

    // Aggregate from all valid orders
    for (const order of validOrders) {
      for (const item of order.items) {
        // Update menu item stats
        const existing = menuItemMap.get(item.productId);
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.totalRevenue += item.totalPrice || item.quantity * item.unitPrice;
        } else {
          // Product from order that might not be in current product list
          menuItemMap.set(item.productId, {
            productId: item.productId,
            name: getLocalizedText(item.name || item.productName, 'صنف غير معروف'),
            category: '',
            imageUrl: (item as any).image || (item as any).productImage || '',
            quantitySold: item.quantity,
            totalRevenue: item.totalPrice || item.quantity * item.unitPrice,
          });
        }

        // Aggregate add-on/customization stats
        const customizations = item.customizations || [];
        for (const cust of customizations) {
          // Handle different customization structures
          if (cust.selectedOptions && Array.isArray(cust.selectedOptions)) {
            // CartItemCustomization format: { groupId, groupName, selectedOptions: [...] }
            for (const opt of cust.selectedOptions) {
              const optId = opt.id || opt.optionId || `${cust.groupId}_${getLocalizedText(opt.name)}`;
              const optName = getLocalizedText(opt.name);
              const optPrice = opt.price || 0;
              if (!optName || optPrice <= 0) continue; // skip free defaults (bread, etc.)

              const existingAddOn = addOnMap.get(optId);
              if (existingAddOn) {
                existingAddOn.timesOrdered += item.quantity;
                existingAddOn.totalRevenue += optPrice * item.quantity;
              } else {
                addOnMap.set(optId, {
                  id: optId,
                  name: optName,
                  unitPrice: optPrice,
                  timesOrdered: item.quantity,
                  totalRevenue: optPrice * item.quantity,
                });
              }
            }
          } else if (cust.optionName || cust.optionId) {
            // OrderCustomization format: { groupId, groupName, optionId, optionName, price }
            const optId = cust.optionId || `${cust.groupId}_${getLocalizedText(cust.optionName)}`;
            const optName = getLocalizedText(cust.optionName);
            const optPrice = cust.price || 0;
            if (!optName || optPrice <= 0) continue;

            const existingAddOn = addOnMap.get(optId);
            if (existingAddOn) {
              existingAddOn.timesOrdered += item.quantity;
              existingAddOn.totalRevenue += optPrice * item.quantity;
            } else {
              addOnMap.set(optId, {
                id: optId,
                name: optName,
                unitPrice: optPrice,
                timesOrdered: item.quantity,
                totalRevenue: optPrice * item.quantity,
              });
            }
          }
        }
      }
    }

    // If no add-ons found in orders, populate from product customization definitions
    // so the admin still sees the full list with "0 orders"
    if (addOnMap.size === 0) {
      for (const product of products) {
        const groups = product.customizationGroups || [];
        for (const group of groups) {
          for (const opt of group.options) {
            if (opt.price <= 0) continue; // skip free options
            const optId = opt.id || `${group.id}_${getLocalizedText(opt.name)}`;
            if (!addOnMap.has(optId)) {
              addOnMap.set(optId, {
                id: optId,
                name: getLocalizedText(opt.name),
                unitPrice: opt.price,
                timesOrdered: 0,
                totalRevenue: 0,
              });
            }
          }
        }
      }
    }

    // Sort menu items: descending by quantity, then by revenue as tie-breaker
    const menuItemStats = Array.from(menuItemMap.values()).sort((a, b) => {
      if (b.quantitySold !== a.quantitySold) return b.quantitySold - a.quantitySold;
      return b.totalRevenue - a.totalRevenue;
    });

    // Sort add-ons: descending by times ordered
    const addOnStats = Array.from(addOnMap.values()).sort((a, b) => {
      if (b.timesOrdered !== a.timesOrdered) return b.timesOrdered - a.timesOrdered;
      return b.totalRevenue - a.totalRevenue;
    });

    // Best/Least selling
    const bestSelling = menuItemStats[0] || null;
    const leastSelling = menuItemStats.length > 0 ? menuItemStats[menuItemStats.length - 1] : null;
    const topAddOn = addOnStats[0] || null;

    return {
      todaySales,
      todayOrderCount: todayOrders.length,
      monthSales,
      monthOrderCount: monthOrders.length,
      bestSelling,
      leastSelling,
      topAddOn,
      menuItemStats,
      addOnStats,
    };
  }, [orders, products]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-8">
      {/* ══════════════════════════════════════════════════════════════════════
          HEADER SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <div>
        <h1 className="text-2xl font-black text-dark">
          إحصائيات وتقارير المبيعات
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          متابعة أداء المبيعات اليومية والشهرية والأصناف الأكثر والأقل طلباً
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          KPI CARDS ROW (5 Cards)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. Today's Sales */}
        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-gray-400 font-bold block">
                مبيعات النهاردة
              </span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">
                <CurrencyDisplay amount={analytics.todaySales} />
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 tabular-nums">
            {formatNumber(analytics.todayOrderCount)} طلبات اليوم
          </span>
        </Card>

        {/* 2. This Month's Sales */}
        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-gray-400 font-bold block">
                مبيعات الشهر ده
              </span>
              <span className="text-xl font-black text-primary mt-1 block">
                <CurrencyDisplay amount={analytics.monthSales} />
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <span className="inline-block text-[10px] font-bold text-primary bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100 tabular-nums">
            {formatNumber(analytics.monthOrderCount)} طلبات هذا الشهر
          </span>
        </Card>

        {/* 3. Best-Selling Menu Item */}
        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <span className="text-[11px] text-gray-400 font-bold block">
                الأكثر مبيعاً في المنيو
              </span>
              {analytics.bestSelling ? (
                <>
                  <span className="text-sm font-black text-dark mt-1 block truncate" title={analytics.bestSelling.name}>
                    {analytics.bestSelling.name}
                  </span>
                  {analytics.bestSelling.category && (
                    <span className="text-[10px] text-gray-400 block truncate">
                      {analytics.bestSelling.category}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-400 mt-1 block">لا توجد بيانات</span>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          {analytics.bestSelling && (
            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 tabular-nums">
              تم بيع {formatNumber(analytics.bestSelling.quantitySold)} قطعة
            </span>
          )}
        </Card>

        {/* 4. Least-Selling Menu Item */}
        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <span className="text-[11px] text-gray-400 font-bold block">
                الأقل مبيعاً في المنيو
              </span>
              {analytics.leastSelling ? (
                <>
                  <span className="text-sm font-black text-dark mt-1 block truncate" title={analytics.leastSelling.name}>
                    {analytics.leastSelling.name}
                  </span>
                  {analytics.leastSelling.category && (
                    <span className="text-[10px] text-gray-400 block truncate">
                      {analytics.leastSelling.category}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-400 mt-1 block">لا توجد بيانات</span>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          {analytics.leastSelling && (
            <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border tabular-nums ${
              analytics.leastSelling.quantitySold === 0
                ? 'text-gray-500 bg-gray-100 border-gray-200'
                : 'text-gray-600 bg-gray-100 border-gray-200'
            }`}>
              {analytics.leastSelling.quantitySold === 0
                ? 'لم يتم البيع'
                : `تم بيع ${formatNumber(analytics.leastSelling.quantitySold)} قطعة`}
            </span>
          )}
        </Card>

        {/* 5. Top Add-on / Sauce / Combo */}
        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <span className="text-[11px] text-gray-400 font-bold block">
                الأكثر طلباً في الإضافات / الصوصات
              </span>
              {analytics.topAddOn ? (
                <>
                  <span className="text-sm font-black text-dark mt-1 block truncate" title={analytics.topAddOn.name}>
                    {analytics.topAddOn.name}
                  </span>
                  <span className="text-[10px] text-gray-400 block">
                    <CurrencyDisplay amount={analytics.topAddOn.unitPrice} className="text-[10px] font-semibold" />
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400 mt-1 block">لا توجد بيانات</span>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          {analytics.topAddOn && (
            <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 tabular-nums">
              {analytics.topAddOn.timesOrdered === 0
                ? 'لم يتم الطلب'
                : `تم طلبه ${formatNumber(analytics.topAddOn.timesOrdered)} مرة`}
            </span>
          )}
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TWO-COLUMN RANKING LISTS
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── RIGHT COLUMN: Menu Items Ranked by Sales ──────────────────────── */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-dark">
                  ترتيب أصناف المنيو حسب المبيعات
                </h3>
              </div>
              <span className="text-[11px] font-bold text-primary bg-primary-50 px-2.5 py-1 rounded-full tabular-nums">
                {analytics.menuItemStats.length} صنف
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-50 max-h-[700px] overflow-y-auto">
            {analytics.menuItemStats.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                لا توجد بيانات مبيعات متاحة حالياً
              </div>
            ) : (
              analytics.menuItemStats.map((item, idx) => {
                const rank = idx + 1;
                const rankStyle = getRankStyle(rank);
                return (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border shrink-0 tabular-nums ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}
                    >
                      #{rank}
                    </div>

                    {/* Item Thumbnail */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-gray-300" />
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-dark truncate">
                        {item.name}
                      </div>
                      {item.category && (
                        <div className="text-[10px] text-gray-400 truncate">
                          {item.category}
                        </div>
                      )}
                    </div>

                    {/* Quantity Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums ${
                        item.quantitySold === 0
                          ? 'text-gray-400 bg-gray-100'
                          : 'text-emerald-700 bg-emerald-50'
                      }`}
                    >
                      {item.quantitySold === 0
                        ? 'لم يتم البيع'
                        : `تم بيع ${formatNumber(item.quantitySold)} قطعة`}
                    </span>

                    {/* Revenue */}
                    <span className="text-xs font-extrabold text-primary shrink-0 min-w-[70px] text-end">
                      <CurrencyDisplay amount={item.totalRevenue} />
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* ── LEFT COLUMN: Add-ons / Sauces / Combos Ranked ────────────────── */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-base text-dark">
                  ترتيب الإضافات والأطباق الجانبية حسب الطلب
                </h3>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full tabular-nums">
                {analytics.addOnStats.length} إضافة
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-50 max-h-[700px] overflow-y-auto">
            {analytics.addOnStats.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                لا توجد بيانات إضافات متاحة حالياً
              </div>
            ) : (
              analytics.addOnStats.map((addOn, idx) => {
                const rank = idx + 1;
                const rankStyle = getRankStyle(rank);
                return (
                  <div
                    key={addOn.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border shrink-0 tabular-nums ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}
                    >
                      #{rank}
                    </div>

                    {/* Add-on Icon */}
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Hash className="w-4 h-4 text-blue-400" />
                    </div>

                    {/* Add-on Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-dark truncate">
                        {addOn.name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        <CurrencyDisplay amount={addOn.unitPrice} className="text-[10px] font-semibold" />
                      </div>
                    </div>

                    {/* Times Ordered Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums ${
                        addOn.timesOrdered === 0
                          ? 'text-gray-400 bg-gray-100'
                          : 'text-blue-700 bg-blue-50'
                      }`}
                    >
                      {addOn.timesOrdered === 0
                        ? 'لم يتم الطلب'
                        : `تم طلبه ${formatNumber(addOn.timesOrdered)} مرة`}
                    </span>

                    {/* Revenue */}
                    <span className="text-xs font-extrabold text-primary shrink-0 min-w-[70px] text-end">
                      <CurrencyDisplay amount={addOn.totalRevenue} />
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

