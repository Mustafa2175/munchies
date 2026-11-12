/**
 * @module components/order/OrderCard
 * @description Card summarizing an order in the user's order history. Strictly Arabic.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import type { Order } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { formatDate } from '@/lib/date';
import { ROUTES } from '@/config/routes';
import { getLocalizedText } from '@/lib/i18n';

export interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const trackUrl = `${ROUTES.ORDER_TRACKING.replace(':id', order.id)}`;

  return (
    <Card hoverable className="p-5 border border-border hover:border-primary/30">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <span className="text-xs font-black text-primary font-mono tabular-nums block">
            #{String(order.orderNumber || '').replace(/^#/, '')}
          </span>
          <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            <span className="tabular-nums">{formatDate(order.createdAt)}</span>
          </span>
        </div>
        <StatusBadge status={order.status} locale="ar" audience="customer" />
      </div>

      <div className="py-3 space-y-1.5">
        {order.items.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex justify-between text-xs text-gray-600">
            <span>
              <span className="tabular-nums font-mono">{item.quantity}</span>x {getLocalizedText(item.name, 'صنف')}
            </span>
            <CurrencyDisplay amount={item.totalPrice} />
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-[11px] text-gray-400 font-medium">
            +<span className="tabular-nums">{order.items.length - 3}</span> أصناف تانية
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-gray-500">الإجمالي:</span>
          <CurrencyDisplay amount={order.total} className="text-sm font-extrabold text-primary" />
        </div>

        <Link
          to={trackUrl}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark"
        >
          <span>تابع طلبك</span>
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
        </Link>
      </div>
    </Card>
  );
};
