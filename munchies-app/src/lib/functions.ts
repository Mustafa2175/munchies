/**
 * @module lib/functions
 * @description Cloud Functions callable wrappers with local fallback for offline/demo development.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import { saveDocument } from '@/lib/firestore';
import type { Order, OrderStatus } from '@/types';

export interface CreateOrderPayload {
  items: any[];
  orderType: 'pickup' | 'delivery';
  customerSnapshot: {
    name: string;
    email: string;
    phone: string;
  };
  deliveryAddress?: any;
  paymentMethod: 'cash';
  specialInstructions?: string;
  couponCode?: string | null;
}

export async function callCreateOrder(payload: CreateOrderPayload): Promise<{ orderId: string; orderNumber: string }> {
  try {
    const fn = httpsCallable<CreateOrderPayload, { orderId: string; orderNumber: string }>(functions, 'createOrder');
    const res = await fn(payload);
    return res.data;
  } catch {
    // Local / direct client fallback for immediate MVP functionality
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${randomNum}`;
    const orderId = `order_${Date.now()}`;

    const subtotal = payload.items.reduce((sum, item) => sum + item.lineTotal, 0);
    const deliveryFee = payload.orderType === 'delivery' ? 25 : 0;
    const discount = 0;
    const total = subtotal + deliveryFee - discount;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: payload.customerSnapshot.email,
      customerName: payload.customerSnapshot.name,
      customerPhone: payload.customerSnapshot.phone,
      customerEmail: payload.customerSnapshot.email,
      type: payload.orderType,
      status: 'pending' as OrderStatus,
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'pending',
      items: payload.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        image: i.image,
        unitPrice: i.basePrice,
        quantity: i.quantity,
        totalPrice: i.lineTotal,
        customizations: i.customizations,
        specialInstructions: i.specialInstructions,
      })),
      subtotal,
      discount,
      deliveryFee,
      total,
      notes: payload.specialInstructions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'pending' as OrderStatus,
          timestamp: new Date().toISOString(),
          note: 'Order submitted by customer',
        },
      ],
    };

    // Store in localStorage as backup and Firestore
    try {
      await saveDocument('orders', orderId, newOrder);
    } catch {
      // Ignore if offline
    }

    const localOrders = JSON.parse(localStorage.getItem('munchies_orders') || '[]');
    localOrders.unshift(newOrder);
    localStorage.setItem('munchies_orders', JSON.stringify(localOrders));

    return { orderId, orderNumber };
  }
}

export async function callCancelOrder(orderId: string, reason?: string): Promise<boolean> {
  try {
    const fn = httpsCallable<{ orderId: string; reason?: string }, { success: boolean }>(functions, 'cancelOrder');
    const res = await fn({ orderId, reason });
    return res.data.success;
  } catch {
    const localOrders = JSON.parse(localStorage.getItem('munchies_orders') || '[]');
    const idx = localOrders.findIndex((o: any) => o.id === orderId);
    if (idx > -1) {
      localOrders[idx].status = 'cancelled';
      localOrders[idx].updatedAt = new Date().toISOString();
      localStorage.setItem('munchies_orders', JSON.stringify(localOrders));
    }
    return true;
  }
}

