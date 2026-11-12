/**
 * @module lib/functions
 * @description Order creation and cancellation helpers bound strictly to authenticated Firebase user UID.
 */

import { doc, collection, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { updateOrderStatusInFirestore } from '@/lib/firestore';
import { isStoreCurrentlyOpen } from '@/stores/restaurantStore';
import { isProductAvailable, useProductStore } from '@/stores/productStore';
import { normalizeEgyptianPhone, normalizeEmail, normalizeFullName } from '@/lib/validators';
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
 * from Firestore settings/orderCounter.
 */
export async function getNextOrderNumber(): Promise<string> {
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

  return nextNum.toString();
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
 * Creates a new order in Cloud Firestore tied strictly to `auth.currentUser.uid`.
 * Revalidates product availability and base prices before persisting.
 */
export async function callCreateOrder(
  payload: CreateOrderPayload
): Promise<{ orderId: string; orderNumber: string; order: Order }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('يجب تسجيل الدخول أولاً لإتمام الطلب.');
  }

  if (!isStoreCurrentlyOpen()) {
    throw new Error('معلش، إحنا قافلين دلوقتي ومبنستقبلش طلبات جديدة. راجعنا قريب!');
  }

  const storeProducts = useProductStore.getState().products;

  // Revalidate availability and authoritative prices for every cart line
  const validatedItems = await Promise.all(
    payload.items.map(async (item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const optionSum = Array.isArray(item.customizations)
        ? item.customizations.reduce(
            (acc: number, group: any) =>
              acc +
              (Array.isArray(group.selectedOptions)
                ? group.selectedOptions.reduce(
                    (oAcc: number, opt: any) => oAcc + Number(opt.price || 0),
                    0
                  )
                : 0),
            0
          )
        : 0;

      if (item.productId === 'custom_sandwich') {
        const unitPrice = Number(item.basePrice || item.unitPrice || 50) + optionSum;
        return {
          id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: 'custom_sandwich',
          name: typeof item.name === 'string' ? { ar: item.name, en: item.name } : item.name || { ar: '', en: '' },
          image: item.image || '',
          unitPrice,
          quantity,
          totalPrice: unitPrice * quantity,
          customizations: item.customizations || [],
          specialInstructions: item.specialInstructions || '',
        };
      }

      // Check Firestore product doc first, falling back to synced store
      let authoritativeProduct: Record<string, any> | undefined = storeProducts.find(
        (p) => p.id === item.productId
      );
      try {
        const snap = await getDoc(doc(db, 'products', item.productId));
        if (snap.exists()) {
          authoritativeProduct = { id: snap.id, ...snap.data() };
        }
      } catch {
        // Use store snapshot if offline
      }

      if (authoritativeProduct && !isProductAvailable(authoritativeProduct)) {
        const name =
          typeof authoritativeProduct.name === 'object' && authoritativeProduct.name?.ar
            ? authoritativeProduct.name.ar
            : 'أحد الأصناف';
        throw new Error(`"${name}" غير متاح حالياً. من فضلك شيله من السلة.`);
      }

      const basePrice =
        authoritativeProduct && typeof authoritativeProduct.price === 'number'
          ? authoritativeProduct.price
          : Number(item.basePrice || item.unitPrice || 0);
      const unitPrice = basePrice + optionSum;

      return {
        id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: item.productId || '',
        name: typeof item.name === 'string' ? { ar: item.name, en: item.name } : item.name || { ar: '', en: '' },
        image: item.image || '',
        unitPrice,
        quantity,
        totalPrice: unitPrice * quantity,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions || '',
      };
    })
  );

  const orderNumber = await getNextOrderNumber();
  const rawNum = String(orderNumber).replace(/^#/, '');
  const numericVal = parseInt(rawNum, 10);

  const orderRef = doc(collection(db, 'orders'));
  const orderId = orderRef.id;

  const subtotal = validatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee =
    payload.orderType === 'delivery'
      ? payload.deliveryFee !== undefined
        ? payload.deliveryFee
        : 25
      : 0;
  const discount = 0;
  const total = subtotal + deliveryFee - discount;
  const nowIso = new Date().toISOString();

  // Strictly bind ownership to the authenticated Firebase user UID
  const authenticatedUid = currentUser.uid;
  const customerEmail = normalizeEmail(currentUser.email || payload.customerSnapshot.email || '');

  const newOrder: Order & { orderNumberNum: number } = {
    id: orderId,
    orderNumber: rawNum,
    orderNumberNum: isNaN(numericVal) ? 0 : numericVal,
    customerId: authenticatedUid,
    userId: authenticatedUid,
    customerName: normalizeFullName(payload.customerSnapshot.name) || currentUser.displayName || 'عميل مانشيز',
    customerPhone: normalizeEgyptianPhone(payload.customerSnapshot.phone),
    customerEmail,
    type: payload.orderType || 'pickup',
    deliveryType: payload.orderType || 'pickup',
    deliveryAddress:
      payload.orderType === 'delivery' && payload.deliveryAddress
        ? payload.deliveryAddress
        : null,
    status: 'pending' as OrderStatus,
    paymentMethod: payload.paymentMethod || 'cash',
    paymentStatus: 'pending',
    items: validatedItems,
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

  const sanitizedOrder = stripUndefined(newOrder);

  try {
    await setDoc(orderRef, sanitizedOrder);
  } catch (firestoreErr) {
    console.error('CRITICAL: Failed to write order to Cloud Firestore:', firestoreErr);
    throw new Error('حصلت مشكلة أثناء إرسال الطلب، جرّب تاني من فضلك.');
  }

  return { orderId, orderNumber: rawNum, order: sanitizedOrder as Order };
}

export async function callCancelOrder(orderId: string, reason?: string): Promise<boolean> {
  if (!auth.currentUser) {
    throw new Error('يجب تسجيل الدخول أولاً.');
  }
  try {
    await updateOrderStatusInFirestore(orderId, 'cancelled', reason || 'العميل لغى الطلب');
    return true;
  } catch (firestoreErr) {
    console.error('Could not cancel order in Firestore:', firestoreErr);
    return false;
  }
}
