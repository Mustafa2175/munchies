/**
 * @module components/ui/StatusBadge
 * @description Color-coded badge for order lifecycles strictly in Arabic.
 */

import React from 'react';
import type { OrderStatus } from '@/types';

export interface StatusBadgeProps {
  status: OrderStatus;
  locale?: string;
  audience?: 'customer' | 'admin';
  className?: string;
}

const STATUS_CONFIG: Record<OrderStatus, { bg: string; text: string; ar: string }> = {
  pending: {
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    text: 'text-amber-800',
    ar: 'قيد الانتظار',
  },
  confirmed: {
    bg: 'bg-blue-100 text-blue-800 border-blue-200',
    text: 'text-blue-800',
    ar: 'تم التأكيد',
  },
  preparing: {
    bg: 'bg-purple-100 text-purple-800 border-purple-200',
    text: 'text-purple-800',
    ar: 'جاري التحضير',
  },
  ready: {
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    text: 'text-emerald-800',
    ar: 'جاهز للاستلام',
  },
  out_for_delivery: {
    bg: 'bg-sky-100 text-sky-800 border-sky-200',
    text: 'text-sky-800',
    ar: 'في الطريق إليك',
  },
  delivered: {
    bg: 'bg-green-100 text-green-800 border-green-200',
    text: 'text-green-800',
    ar: 'تم التوصيل',
  },
  picked_up: {
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    text: 'text-emerald-800',
    ar: 'تم الاستلام',
  },
  cancelled: {
    bg: 'bg-red-100 text-red-800 border-red-200',
    text: 'text-red-800',
    ar: 'ملغي',
  },
  refunded: {
    bg: 'bg-gray-100 text-gray-800 border-gray-200',
    text: 'text-gray-800',
    ar: 'مسترد',
  },
};

const CUSTOMER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'متقلقش، طلبك وصلنا!',
  confirmed: 'المطعم وافق على طلبك',
  preparing: 'طلبك بيتجهز دلوقتي 🔥',
  ready: 'طلبك جاهز! 🍔',
  out_for_delivery: 'طلبك في الطريق ليك 🛵',
  delivered: 'بالهنا والشفا ❤️',
  picked_up: 'بالهنا والشفا ❤️',
  cancelled: 'الطلب اتلغى',
  refunded: 'اتردّلك المبلغ',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  audience = 'admin',
  className = '',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const label =
    audience === 'customer'
      ? CUSTOMER_STATUS_LABELS[status] || config.ar
      : config.ar;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${config.bg} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current me-1.5 opacity-75 animate-pulse" />
      {label}
    </span>
  );
};
