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

export interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const trackUrl = `${ROUTES.ORDER_TRACKING.replace(':id', order.id)}`;

  return (
    <Card hoverable className="p-5 border border-gray-100 hover:border-[#512080]/30">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <span className="text-xs font-bold text-[#512080] block">
            {order.orderNumber}
          </span>
          <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {formatDate(order.createdAt)}
          </span>
        </div>
        <StatusBadge status={order.status} locale="ar" />
      </div>

      <div className="py-3 space-y-1.5">
        {order.items.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex justify-between text-xs text-gray-600">
            <span>
              {item.quantity}x {item.name.ar}
            </span>
            <CurrencyDisplay amount={item.totalPrice} />
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-[11px] text-gray-400 font-medium">
            +{order.items.length - 3} أصناف أخرى
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-gray-500">الإجمالي:</span>
          <CurrencyDisplay amount={order.total} className="text-sm font-extrabold text-[#512080]" />
        </div>

        <Link
          to={trackUrl}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#512080] hover:text-[#461C6E]"
        >
          <span>متابعة الطلب</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};
