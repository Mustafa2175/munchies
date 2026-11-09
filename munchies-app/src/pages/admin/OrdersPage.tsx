/**
 * @module pages/admin/OrdersPage
 * @description Comprehensive Orders Management view with multi-row shift filters,
 * real-time KPI summary cards, interactive square order cards grid, and 80mm thermal receipt printing.
 * Strictly in Arabic with Munchies purple/gold theme.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Printer,
  X,
  UtensilsCrossed,
  Truck,
  Store,
  Clock,
  Phone,
  User,
  ShoppingBag,
  TrendingUp,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatTime, formatDateTime } from '@/lib/date';
import { subscribeToCollection, updateOrderStatusInFirestore } from '@/lib/firestore';
import { getLocalizedText } from '@/lib/i18n';
import { useRestaurantStore, getTodayWorkingHoursText } from '@/stores/restaurantStore';
import { TIMEZONE } from '@/config/constants';
import { toZonedTime } from 'date-fns-tz';
import toast from 'react-hot-toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCairoDate(input?: string | number | Date): Date {
  return toZonedTime(input ? new Date(input) : new Date(), TIMEZONE);
}

function isSameCalendarDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatArabicDateBadge(
  dateFilter: 'today' | 'yesterday' | 'specific' | 'all',
  specificDate: string
): string {
  const cairoNow = getCairoDate();
  const formatter = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TIMEZONE,
  });

  if (dateFilter === 'today') {
    return `اليوم (${formatter.format(cairoNow)})`;
  }
  if (dateFilter === 'yesterday') {
    const yesterday = new Date(cairoNow);
    yesterday.setDate(yesterday.getDate() - 1);
    return `أمس (${formatter.format(yesterday)})`;
  }
  if (dateFilter === 'specific' && specificDate) {
    const parts = specificDate.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return formatter.format(d);
    }
    return specificDate;
  }
  return 'جميع الفترات';
}

// ─── Status Badge Colors ──────────────────────────────────────────────────────

function getStatusBadgeConfig(status: OrderStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'جديد',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case 'confirmed':
      return {
        label: 'تم التأكيد',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
      };
    case 'preparing':
      return {
        label: 'قيد التحضير',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-300',
      };
    case 'ready':
      return {
        label: 'جاهز للاستلام',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'out_for_delivery':
      return {
        label: 'في التوصيل',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
      };
    case 'delivered':
    case 'picked_up':
      return {
        label: 'تم التسليم',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200',
      };
    case 'cancelled':
      return {
        label: 'ملغي',
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
      };
    case 'refunded':
      return {
        label: 'مسترجع',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    default:
      return {
        label: status,
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
      };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'specific' | 'all'>('today');
  const [specificDate, setSpecificDate] = useState<string>(() => {
    const now = getCairoDate();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<Order | null>(null);

  // Subscribe to real-time updates from Firestore orders collection
  useEffect(() => {
    const unsub = subscribeToCollection<Order>('orders', (remoteOrders) => {
      const sorted = (remoteOrders || []).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setOrders(sorted);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatusInFirestore(orderId, nextStatus);
      toast.success('تم تحديث حالة الطلب بنجاح');
    } catch (err) {
      console.error('Failed to update order status in Firestore:', err);
      toast.error('فشل تحديث حالة الطلب – تأكد من صلاحيات المشرف');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
      try {
        await updateOrderStatusInFirestore(orderId, 'cancelled', 'تم الإلغاء بواسطة الإدارة');
        toast.success('تم إلغاء الطلب بنجاح');
      } catch (err) {
        console.error('Failed to cancel order:', err);
        toast.error('فشل إلغاء الطلب');
      }
    }
  };

  const toggleCardCollapse = (orderId: string) => {
    setCollapsedCards((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // ── Date counts ────────────────────────────────────────────────────────────
  const cairoNow = getCairoDate();
  const cairoYesterday = new Date(cairoNow);
  cairoYesterday.setDate(cairoYesterday.getDate() - 1);

  const todayOrdersAll = orders.filter((o) => {
    const orderDate = getCairoDate(o.createdAt);
    return isSameCalendarDay(orderDate, cairoNow);
  });

  const yesterdayOrdersAll = orders.filter((o) => {
    const orderDate = getCairoDate(o.createdAt);
    return isSameCalendarDay(orderDate, cairoYesterday);
  });

  // Filter orders by date
  const dateFilteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = getCairoDate(o.createdAt);
      if (dateFilter === 'today') {
        return isSameCalendarDay(orderDate, cairoNow);
      }
      if (dateFilter === 'yesterday') {
        return isSameCalendarDay(orderDate, cairoYesterday);
      }
      if (dateFilter === 'specific') {
        if (!specificDate) return true;
        const [sy, sm, sd] = specificDate.split('-').map(Number);
        return (
          orderDate.getFullYear() === sy &&
          orderDate.getMonth() === sm - 1 &&
          orderDate.getDate() === sd
        );
      }
      return true; // 'all'
    });
  }, [orders, dateFilter, specificDate]);

  // ── Status counts for the selected date ─────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = {
      all: dateFilteredOrders.length,
      pending: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    };

    dateFilteredOrders.forEach((o) => {
      if (o.status === 'pending') counts.pending++;
      else if (o.status === 'confirmed' || o.status === 'preparing') counts.preparing++;
      else if (o.status === 'ready' || o.status === 'out_for_delivery') counts.ready++;
      else if (o.status === 'picked_up' || o.status === 'delivered') counts.delivered++;
      else if (o.status === 'cancelled' || o.status === 'refunded') counts.cancelled++;
    });

    return counts;
  }, [dateFilteredOrders]);

  // ── Filtered orders by status & search ─────────────────────────────────────
  const finalFilteredOrders = useMemo(() => {
    return dateFilteredOrders.filter((o) => {
      // Status match
      let matchesStatus = true;
      if (statusFilter === 'pending') {
        matchesStatus = o.status === 'pending';
      } else if (statusFilter === 'preparing') {
        matchesStatus = o.status === 'confirmed' || o.status === 'preparing';
      } else if (statusFilter === 'ready') {
        matchesStatus = o.status === 'ready' || o.status === 'out_for_delivery';
      } else if (statusFilter === 'delivered') {
        matchesStatus = o.status === 'picked_up' || o.status === 'delivered';
      } else if (statusFilter === 'cancelled') {
        matchesStatus = o.status === 'cancelled' || o.status === 'refunded';
      }

      // Search match
      const query = searchQuery.trim().toLowerCase();
      const cleanQuery = query.replace(/^#/, '');
      const rawOrderNum = String(o.orderNumber || '').toLowerCase().replace(/^#/, '');
      const matchesSearch =
        !query ||
        rawOrderNum.includes(cleanQuery) ||
        `#${rawOrderNum}`.includes(query) ||
        o.customerName?.toLowerCase().includes(query) ||
        o.customerPhone?.replace(/[\s\-]/g, '').includes(cleanQuery);

      return matchesStatus && matchesSearch;
    });
  }, [dateFilteredOrders, statusFilter, searchQuery]);

  // ── KPI Metrics for Today ──────────────────────────────────────────────────
  const kpiTodayTotal = todayOrdersAll.length;
  const kpiPending = todayOrdersAll.filter((o) => o.status === 'pending').length;
  const kpiPreparing = todayOrdersAll.filter(
    (o) => o.status === 'confirmed' || o.status === 'preparing'
  ).length;
  const kpiRevenue = todayOrdersAll
    .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Shift hours
  const workingHoursText = getTodayWorkingHoursText() || 'من 12:00 م إلى 03:00 ص';

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#26212B]">الطلبات الواردة</h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#F3EDFA] text-[#512080] border border-purple-200 shadow-2xs">
              {finalFilteredOrders.length} {finalFilteredOrders.length === 1 ? 'طلب' : 'طلبات'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            متابعة وإدارة حالات الطلبات الحية لحظياً
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. TOP SUMMARY KPI CARDS ROW (4 Cards)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Today's Orders */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">إجمالي طلبات اليوم</span>
            <span className="text-2xl font-black text-[#26212B] mt-1 block number-ltr text-start">
              {kpiTodayTotal}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F3EDFA] text-[#512080] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </Card>

        {/* KPI 2: Pending Approval */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">بانتظار الموافقة</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block number-ltr text-start">
              {kpiPending}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        {/* KPI 3: Preparing in Kitchen */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">قيد التحضير في المطبخ</span>
            <span className="text-2xl font-black text-[#512080] mt-1 block number-ltr text-start">
              {kpiPreparing}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#512080] flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
        </Card>

        {/* KPI 4: Total Revenue */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">إجمالي الإيرادات اليوم</span>
            <span className="text-xl font-black text-[#27834B] mt-1 block">
              <CurrencyDisplay amount={kpiRevenue} />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#27834B] flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. UNIFIED FILTER & SHIFT CONTROL BOX (Multi-row Card)
          ══════════════════════════════════════════════════════════════════════ */}
      <Card className="p-5 space-y-4 border border-gray-200/80 shadow-xs">
        {/* Row 1 — Shift Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-gray-100">
          {/* Shift Date Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-gray-700 ms-1 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#512080]" />
              <span>تاريخ الوردية:</span>
            </span>

            {/* Today */}
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-[#512080] text-white shadow-xs'
                  : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80'
              }`}
            >
              اليوم ({todayOrdersAll.length})
            </button>

            {/* Yesterday */}
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                dateFilter === 'yesterday'
                  ? 'bg-[#512080] text-white shadow-xs'
                  : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80'
              }`}
            >
              أمس ({yesterdayOrdersAll.length})
            </button>

            {/* Specific Date */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDateFilter('specific')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  dateFilter === 'specific'
                    ? 'bg-[#512080] text-white shadow-xs'
                    : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80'
                }`}
              >
                تحديد تاريخ
              </button>
              {dateFilter === 'specific' && (
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-300 bg-white font-mono focus:outline-none focus:border-[#512080]"
                />
              )}
            </div>

            {/* All Dates */}
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-[#512080] text-white shadow-xs'
                  : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80'
              }`}
            >
              كل التواريخ ({orders.length})
            </button>
          </div>

          {/* Shift Hours & Date Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Shift hours badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#F3EDFA] text-[#512080] border border-purple-200">
              <Clock className="w-3.5 h-3.5" />
              <span>الوردية: {workingHoursText}</span>
            </span>

            {/* Selected date badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>{formatArabicDateBadge(dateFilter, specificDate)}</span>
            </span>
          </div>
        </div>

        {/* Row 2 — Order Status Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* All */}
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#512080] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              الكل ({statusCounts.all})
            </button>

            {/* New / Pending */}
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              جديد ({statusCounts.pending})
            </button>

            {/* Preparing */}
            <button
              onClick={() => setStatusFilter('preparing')}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'preparing'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
              }`}
            >
              قيد التحضير ({statusCounts.preparing})
            </button>

            {/* Ready */}
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'ready'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              جاهز للاستلام ({statusCounts.ready})
            </button>

            {/* Delivered */}
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'delivered'
                  ? 'bg-gray-700 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              تم التسليم ({statusCounts.delivered})
            </button>

            {/* Cancelled */}
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'cancelled'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white border border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              ملغي ({statusCounts.cancelled})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الطلب، اسم العميل، الهاتف..."
              className="w-full text-xs rounded-xl border border-gray-200 bg-white py-2 ps-9 pe-3 focus:outline-none focus:border-[#512080]"
            />
          </div>
        </div>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════
          4. INTERACTIVE SQUARE/BOX ORDER CARDS GRID
          ══════════════════════════════════════════════════════════════════════ */}
      {finalFilteredOrders.length === 0 ? (
        <Card className="p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-base text-gray-700">لا توجد طلبات واردة</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            لم يتم العثور على أي طلبات تطابق الفلاتر المحددة حالياً. ستظهر الطلبات الجديدة هنا فور استلامها.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {finalFilteredOrders.map((order) => {
            const rawOrderNum = String(order.orderNumber || '').replace(/^#/, '');
            const displayOrderNumber = `#${rawOrderNum}`;
            const isDelivery =
              order.type === 'delivery' ||
              (order as any).deliveryType === 'delivery' ||
              (order as any).orderType === 'delivery';
            const statusConfig = getStatusBadgeConfig(order.status);
            const isCollapsed = !!collapsedCards[order.id];
            const isCancellable = order.status === 'pending' || order.status === 'confirmed';
            const totalItemCount = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

            return (
              <Card
                key={order.id}
                className="flex flex-col justify-between overflow-hidden border border-gray-200 hover:border-purple-300 transition-all shadow-xs hover:shadow-md"
              >
                {/* ── CARD HEADER ── */}
                <div className="p-4 bg-white border-b border-gray-100 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base text-[#512080]">
                        {displayOrderNumber}
                      </span>
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Payment method badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {order.paymentMethod === 'card' ? 'فيزا' : 'كاش'}
                      </span>

                      {/* Quick print button */}
                      <button
                        onClick={() => {
                          setSelectedTicketOrder(order);
                          setTimeout(() => window.print(), 300);
                        }}
                        className="p-1 rounded-lg text-gray-400 hover:text-[#512080] hover:bg-purple-50 transition-colors"
                        title="طباعة بون فوري"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Collapse toggle */}
                      <button
                        onClick={() => toggleCardCollapse(order.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title={isCollapsed ? 'توسيع الأصناف' : 'تصغير الأصناف'}
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Order timestamp */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(order.createdAt)}</span>
                    </span>
                    <span>{formatDateTime(order.createdAt).split('-')[0]}</span>
                  </div>
                </div>

                {/* ── CUSTOMER & ORDER TYPE BOX ── */}
                <div className="p-4 bg-gray-50/70 border-b border-gray-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-[#512080] flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-extrabold text-xs text-[#26212B] truncate">
                        {getLocalizedText(order.customerName, 'عميل مانشيز')}
                      </span>
                    </div>

                    <a
                      href={`tel:${order.customerPhone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 hover:text-[#512080] number-ltr bg-white px-2 py-0.5 rounded-md border border-gray-200 shrink-0"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{order.customerPhone}</span>
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    {/* Branch badge */}
                    <span className="text-gray-500 font-semibold truncate">
                      فرع الكورنيش - حديقة الورد
                    </span>

                    {/* Order Type badge */}
                    {isDelivery ? (
                      <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 shrink-0">
                        <Truck className="w-3 h-3 text-[#512080]" />
                        <span>توصيل للمنزل</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                        <Store className="w-3 h-3 text-amber-700" />
                        <span>استلام من الفرع</span>
                      </span>
                    )}
                  </div>

                  {/* Delivery address details if delivery */}
                  {isDelivery && order.deliveryAddress && (
                    <div className="text-[10px] text-gray-600 bg-white p-2 rounded-lg border border-gray-200/60 space-y-0.5">
                      <div className="font-bold text-purple-900">
                        منطقة: {getLocalizedText(order.deliveryAddress.area, 'أسوان')}
                      </div>
                      <div className="truncate">
                        {[
                          getLocalizedText(order.deliveryAddress.street || order.deliveryAddress.addressLine1),
                          getLocalizedText(order.deliveryAddress.building || order.deliveryAddress.addressLine2),
                        ]
                          .filter(Boolean)
                          .join(' – ')}
                      </div>
                      {order.deliveryAddress.deliveryInstructions && (
                        <div className="text-gray-400 italic">
                          علامة: {getLocalizedText(order.deliveryAddress.deliveryInstructions)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── ORDERED ITEMS SECTION ── */}
                {!isCollapsed && (
                  <div className="p-4 flex-1 space-y-2.5">
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-gray-100">
                      <span className="font-black text-[#26212B]">الأصناف المطلوبة</span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {totalItemCount} قطع
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pe-1">
                      {order.items.map((item, idx) => {
                        const itemName = getLocalizedText(item.name || item.productName, 'صنف');
                        const itemPrice = item.totalPrice || (item.quantity || 1) * (item.unitPrice || 0);

                        return (
                          <div key={idx} className="text-xs space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono font-black text-[11px] text-[#512080] bg-[#F3EDFA] px-1.5 py-0.2 rounded shrink-0">
                                  {item.quantity}x
                                </span>
                                <span className="font-bold text-[#26212B] truncate">{itemName}</span>
                              </div>
                              <span className="font-extrabold text-[#26212B] shrink-0">
                                <CurrencyDisplay amount={itemPrice} />
                              </span>
                            </div>

                            {/* Customizations / Add-ons / Sauces */}
                            {item.customizations && item.customizations.length > 0 && (
                              <div className="ps-6 text-[10px] text-gray-500 space-y-0.5">
                                {item.customizations.map((c: any, cIdx: number) => {
                                  const groupTitle = getLocalizedText(c.groupName || c.groupId, '');
                                  const opts = Array.isArray(c.selectedOptions)
                                    ? c.selectedOptions
                                        .map((o: any) => getLocalizedText(o?.name || o, ''))
                                        .filter(Boolean)
                                        .join('، ')
                                    : getLocalizedText(c.optionName || c.name, '');
                                  return (
                                    <div key={cIdx} className="text-gray-500">
                                      + {groupTitle ? `${groupTitle}: ` : ''}{opts}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Item special notes */}
                            {item.specialInstructions && (
                              <div className="ps-6 text-[10px] text-amber-700 italic">
                                * ملاحظة: {item.specialInstructions}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── CARD FOOTER ── */}
                <div className="p-4 bg-white border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Total */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-gray-400 font-bold">الإجمالي:</span>
                    <span className="text-base font-black text-[#512080]">
                      <CurrencyDisplay amount={order.total} />
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Print Receipt Button */}
                    <button
                      onClick={() => setSelectedTicketOrder(order)}
                      className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="معاينة وطباعة البون"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة</span>
                    </button>

                    {/* Cancel Order Button */}
                    {isCancellable && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        إلغاء الطلب
                      </button>
                    )}

                    {/* Primary Status Progression Button */}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#512080] hover:bg-[#43186e] text-white text-xs font-black transition-all shadow-xs cursor-pointer"
                      >
                        بدء التحضير
                      </button>
                    )}

                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#512080] hover:bg-[#43186e] text-white text-xs font-black transition-all shadow-xs cursor-pointer"
                      >
                        بدء التحضير
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(order.id, isDelivery ? 'out_for_delivery' : 'ready')
                        }
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
                      >
                        {isDelivery ? 'خرج للتوصيل' : 'جاهز للاستلام'}
                      </button>
                    )}

                    {(order.status === 'ready' || order.status === 'out_for_delivery') && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(order.id, isDelivery ? 'delivered' : 'picked_up')
                        }
                        className="px-3.5 py-1.5 rounded-xl bg-[#512080] hover:bg-[#43186e] text-white text-xs font-black transition-all shadow-xs cursor-pointer"
                      >
                        تم التسليم
                      </button>
                    )}

                    {(order.status === 'picked_up' || order.status === 'delivered') && (
                      <span className="px-2.5 py-1 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold">
                        تم التسليم ✓
                      </span>
                    )}

                    {order.status === 'cancelled' && (
                      <span className="px-2.5 py-1 rounded-xl bg-red-50 text-red-500 text-xs font-bold">
                        ملغي ✕
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          5. KITCHEN / THERMAL RECEIPT PRINTING MODAL (80mm)
          ══════════════════════════════════════════════════════════════════════ */}
      {selectedTicketOrder && (
        <Modal
          isOpen={!!selectedTicketOrder}
          onClose={() => setSelectedTicketOrder(null)}
          size="md"
        >
          <div className="space-y-4 printable-ticket">
            {/* Header */}
            <div className="text-center pb-4 border-b-2 border-dashed border-gray-300">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-[#512080] text-[#FFDA35] flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="font-black text-xl text-[#26212B]">مانشيز MUNCHIE'S</h3>
              </div>
              <p className="text-xs text-gray-500">فرع الكورنيش - حديقة الورد أمام الراية، أسوان</p>
              <p className="text-xs text-gray-500 font-bold number-ltr">01025707026</p>
              {selectedTicketOrder.type === 'delivery' ||
              (selectedTicketOrder as any).deliveryType === 'delivery' ? (
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-700 text-white text-xs font-black">
                  بون توصيل ديليفري (DELIVERY)
                </div>
              ) : (
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-[#512080] text-white text-xs font-black">
                  بون استلام من الفرع (PICKUP)
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="text-xs space-y-1.5 py-2 border-b border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-500">رقم الأوردر:</span>
                <span className="font-black text-[#512080] text-base font-mono">
                  #{String(selectedTicketOrder.orderNumber || '').replace(/^#/, '')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">التاريخ والوقت:</span>
                <span className="font-bold">{formatDateTime(selectedTicketOrder.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">اسم العميل:</span>
                <span className="font-bold">
                  {getLocalizedText(selectedTicketOrder.customerName, 'عميل')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">رقم الموبايل:</span>
                <span className="font-bold number-ltr">{selectedTicketOrder.customerPhone}</span>
              </div>
              {selectedTicketOrder.deliveryAddress && (
                <div className="p-2 my-1 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                  <span className="font-extrabold text-amber-900 block mb-0.5">
                    عنوان التوصيل في أسوان:
                  </span>
                  <span className="font-bold text-gray-800 block">
                    {[
                      getLocalizedText(selectedTicketOrder.deliveryAddress.area),
                      getLocalizedText(
                        selectedTicketOrder.deliveryAddress.addressLine1 ||
                          selectedTicketOrder.deliveryAddress.street
                      ),
                      getLocalizedText(
                        selectedTicketOrder.deliveryAddress.addressLine2 ||
                          selectedTicketOrder.deliveryAddress.building
                      ),
                    ]
                      .filter(Boolean)
                      .join(' – ')}
                  </span>
                  {selectedTicketOrder.deliveryAddress.deliveryInstructions && (
                    <span className="text-[10px] text-gray-600 block mt-0.5">
                      علامة مميزة: {getLocalizedText(selectedTicketOrder.deliveryAddress.deliveryInstructions)}
                    </span>
                  )}
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">طريقة الدفع:</span>
                <span className="font-bold text-emerald-700">
                  {selectedTicketOrder.paymentMethod === 'card' ? 'فيزا' : 'كاش عند الاستلام'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="py-2 border-b-2 border-dashed border-gray-300">
              <h4 className="font-black text-xs text-[#26212B] mb-2">أصناف الطلب:</h4>
              <div className="space-y-2.5">
                {selectedTicketOrder.items.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between font-bold text-[#26212B]">
                      <span>
                        {item.quantity}x {getLocalizedText(item.name || item.productName, 'صنف')}
                      </span>
                      <CurrencyDisplay amount={item.totalPrice} />
                    </div>
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="ps-4 text-[11px] text-gray-500 space-y-0.5 mt-0.5">
                        {item.customizations.map((c: any, cIdx: number) => {
                          const groupTitle = getLocalizedText(c.groupName || c.groupId, '');
                          const opts = Array.isArray(c.selectedOptions)
                            ? c.selectedOptions
                                .map((o: any) => getLocalizedText(o?.name || o, ''))
                                .filter(Boolean)
                                .join('، ')
                            : getLocalizedText(c.optionName || c.name, '');
                          return (
                            <div key={cIdx}>
                              • {groupTitle ? `${groupTitle}: ` : ''}{opts}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div className="ps-4 text-[10px] text-amber-700 italic">
                        * ملاحظة: {item.specialInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-2 flex justify-between items-center text-base font-black">
              <span>الإجمالي المطلوب:</span>
              <CurrencyDisplay
                amount={selectedTicketOrder.total}
                className="text-lg text-[#512080]"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-2 no-print">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTicketOrder(null)}>
                إغلاق
              </Button>
              <Button
                variant="yellow"
                size="sm"
                leftIcon={Printer}
                onClick={() => window.print()}
                className="font-black"
              >
                طباعة البون
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
