/**
 * @module lib/functions
 * @description Cloud Functions callable wrappers with local fallback for offline/demo development.
 */

import { httpsCallable } from 'firebase/functions';
import { doc, collection, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { functions, db } from '@/config/firebase';
import { updateOrderStatusInFirestore } from '@/lib/firestore';
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
  deliveryFee?: number;
  paymentMethod: 'cash';
  specialInstructions?: string;
  couponCode?: string | null;
}

/**
 * Atomically generates the next sequential order number (starting at 1001)
 * from Firestore settings/orderCounter with a localStorage fallback.
 */
export async function getNextOrderNumber(): Promise<string> {
  try {
    const counterRef = doc(db, 'settings', 'orderCounter');
    const nextNum = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      let current = 1000;
      if (snap.exists()) {
        const val = snap.data()?.lastOrderNumber;
        if (typeof val === 'number') {
          current = val;
        }
      }
      const next = current + 1;
      transaction.set(
        counterRef,
        {
          lastOrderNumber: next,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return next;
    });

    localStorage.setItem('munchies_last_order_num', nextNum.toString());
    return nextNum.toString();
  } catch (error) {
    console.warn('Could not increment Firestore orderCounter in transaction, using fallback:', error);
    const localVal = Number(localStorage.getItem('munchies_last_order_num') || '1000');
    const nextNum = localVal + 1;
    localStorage.setItem('munchies_last_order_num', nextNum.toString());
    return nextNum.toString();
  }
}

/**
 * Recursively removes all undefined fields from an object so Firestore setDoc/updateDoc never fails.
 */
function stripUndefined<T>(val: T): T {
  if (val === null || val === undefined) {
    return null as any;
  }
  if (Array.isArray(val)) {
    return val.map(stripUndefined) as any;
  }
  if (typeof val === 'object' && !(val instanceof Date)) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        res[k] = stripUndefined(v);
      }
    }
    return res as T;
  }
  return val;
}

/**
 * Direct client-side creation directly into Firestore (Spark plan compatible, no Cloud Functions dependency).
 */
export async function callCreateOrder(
  payload: CreateOrderPayload
): Promise<{ orderId: string; orderNumber: string; order: Order }> {
  const orderNumber = await getNextOrderNumber();
  const rawNum = String(orderNumber).replace(/^#/, '');
  const numericVal = parseInt(rawNum, 10);

  // Generate official Firestore document reference
  const orderRef = doc(collection(db, 'orders'));
  const orderId = orderRef.id;

  const subtotal = payload.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  const deliveryFee = payload.orderType === 'delivery' ? (payload.deliveryFee !== undefined ? payload.deliveryFee : 25) : 0;
  const discount = 0;
  const total = subtotal + deliveryFee - discount;
  const nowIso = new Date().toISOString();

  const newOrder: Order & { orderNumberNum: number } = {
    id: orderId,
    orderNumber: rawNum,
    orderNumberNum: isNaN(numericVal) ? 0 : numericVal,
    userId: payload.customerSnapshot.email || 'guest',
    customerName: payload.customerSnapshot.name || 'عميل مانشيز',
    customerPhone: payload.customerSnapshot.phone || '',
    customerEmail: payload.customerSnapshot.email || '',
    type: payload.orderType || 'pickup',
    deliveryType: payload.orderType || 'pickup',
    deliveryAddress: payload.orderType === 'delivery' && payload.deliveryAddress ? payload.deliveryAddress : null,
    status: 'pending' as OrderStatus,
    paymentMethod: payload.paymentMethod || 'cash',
    paymentStatus: 'pending',
    items: payload.items.map((i) => ({
      id: i.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: i.productId || '',
      name: typeof i.name === 'string' ? { ar: i.name, en: i.name } : (i.name || { ar: '', en: '' }),
      image: i.image || '',
      unitPrice: i.basePrice || i.unitPrice || 0,
      quantity: i.quantity || 1,
      totalPrice: i.lineTotal || i.totalPrice || 0,
      customizations: i.customizations || [],
      specialInstructions: i.specialInstructions || '',
    })),
    subtotal,
    discount,
    deliveryFee,
    total,
    notes: payload.specialInstructions || '',
    createdAt: nowIso,
    updatedAt: nowIso,
    statusHistory: [
      {
        status: 'pending' as OrderStatus,
        timestamp: nowIso,
        note: 'تم إرسال الطلب من العميل',
      },
    ],
  };

  // Strip any remaining undefined values recursively
  const sanitizedOrder = stripUndefined(newOrder);

  // 1. Direct write to Cloud Firestore
  try {
    await setDoc(orderRef, sanitizedOrder);
  } catch (firestoreErr) {
    console.error('CRITICAL: Failed to write order to Cloud Firestore:', firestoreErr);
    throw new Error('فشل إرسال الطلب إلى الخادم، يرجى المحاولة مرة أخرى');
  }

  // 2. Keep local storage in sync for backup / fast offline read
  try {
    const localOrders = JSON.parse(localStorage.getItem('munchies_orders') || '[]');
    localOrders.unshift(sanitizedOrder);
    localStorage.setItem('munchies_orders', JSON.stringify(localOrders));
  } catch {
    // Ignore local storage error
  }

  return { orderId, orderNumber: rawNum, order: sanitizedOrder as Order };
}

export async function callCancelOrder(orderId: string, reason?: string): Promise<boolean> {
  try {
    // Write directly to Cloud Firestore (Spark plan, no Cloud Functions needed)
    await updateOrderStatusInFirestore(orderId, 'cancelled', reason || 'طلب العميل إلغاء الأوردر');

    // Also update local storage if present
    try {
      const localOrders = JSON.parse(localStorage.getItem('munchies_orders') || '[]');
      const idx = localOrders.findIndex((o: any) => o.id === orderId);
      if (idx > -1) {
        localOrders[idx].status = 'cancelled';
        localOrders[idx].updatedAt = new Date().toISOString();
        localStorage.setItem('munchies_orders', JSON.stringify(localOrders));
      }
    } catch {
      // ignore
    }

    return true;
  } catch (firestoreErr) {
    console.error('Could not cancel order in Firestore:', firestoreErr);
    return false;
  }
}

