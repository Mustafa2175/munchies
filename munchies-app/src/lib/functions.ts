/**
 * @module lib/functions
 * @description Order creation and cancellation helpers bound strictly to authenticated Firebase user UID.
 */

import { doc, collection, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { updateOrderStatusInFirestore } from '@/lib/firestore';
import { getRestaurantOperationsStatus } from '@/stores/restaurantStore';
import { evaluateRestaurantStatus } from '@/lib/restaurantOperations';
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

const CUSTOM_BUILDER_PRICES: Record<string, number> = {
  // Proteins
  prot_ch_grill: 65,
  prot_crispy: 70,
  prot_burger: 55,
  prot_beef_steak: 45,
  prot_hot_dog: 15,
  prot_burger_ch_grill: 40,
  // Breads
  bread_kaiser: 15,
  bread_french: 15,
  bread_whole_grain: 15,
  bread_fat_bun: 20,
  bread_toast: 10,
  bread_tortilla: 20,
  // Cheeses & Deli
  deli_red_cheddar: 10,
  deli_american_cheese: 12,
  deli_mozzarella: 10,
  deli_turkey: 12,
  deli_salami: 12,
  deli_roast_beef: 12,
  // Toppings & Sauces
  top_jalapeno: 4,
  top_pickles: 4,
  top_mushroom: 10,
  top_caramelized_onion: 7,
  top_fried_egg: 10,
  top_honey_cabbage: 10,
  top_bell_pepper: 7,
  top_sauce: 20,
  top_chips: 20,
};

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

  // Validate live restaurant operating mode & schedule directly against Firestore
  let operatingStatus = getRestaurantOperationsStatus();
  let restaurantSettings: Record<string, any> | null = null;
  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'restaurant'));
    if (settingsSnap.exists()) {
      restaurantSettings = settingsSnap.data();
      operatingStatus = evaluateRestaurantStatus(restaurantSettings, new Date());
    }
  } catch {
    // Fall back to real-time synced store if offline
  }

  if (!operatingStatus.isOpen) {
    throw new Error(
      operatingStatus.customerMessage || 'معلش، إحنا قافلين دلوقتي ومبنستقبلش طلبات جديدة. راجعنا قريب!'
    );
  }

  const storeProducts = useProductStore.getState().products;

  // Revalidate availability and strictly recalculate prices from database for every cart line
  const validatedItems = await Promise.all(
    payload.items.map(async (item) => {
      const quantity = Math.max(1, Math.min(50, Number(item.quantity) || 1));

      // 1. If custom sandwich: recalculate unit price strictly from authoritative ingredient registry
      if (item.productId === 'custom_sandwich') {
        let customOptionsSum = 0;
        const verifiedCustomizations: any[] = [];

        if (Array.isArray(item.customizations)) {
          for (const group of item.customizations) {
            const groupId = group.id || group.groupId || '';
            const verifiedOptions: any[] = [];
            if (Array.isArray(group.selectedOptions)) {
              for (const opt of group.selectedOptions) {
                const optId = opt.id || opt.optionId || '';
                const verifiedPrice = CUSTOM_BUILDER_PRICES[optId] !== undefined ? CUSTOM_BUILDER_PRICES[optId] : 0;
                customOptionsSum += verifiedPrice;
                verifiedOptions.push({
                  id: optId,
                  optionId: optId,
                  name: opt.name || optId,
                  price: verifiedPrice,
                });
              }
            }
            verifiedCustomizations.push({
              id: groupId,
              groupId,
              groupName: group.groupName || group.name || groupId,
              selectedOptions: verifiedOptions,
            });
          }
        }

        const unitPrice = customOptionsSum > 0 ? customOptionsSum : 50;
        return {
          id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: 'custom_sandwich',
          name: typeof item.name === 'string' ? { ar: item.name, en: item.name } : item.name || { ar: 'ساندوتش على مزاجك', en: 'Custom Sandwich' },
          image: item.image || '/hero_burger_clean_cutout.png',
          unitPrice,
          quantity,
          totalPrice: unitPrice * quantity,
          customizations: verifiedCustomizations,
          specialInstructions: item.specialInstructions || '',
        };
      }

      // 2. Standard catalog product: fetch directly from Firestore products collection
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

      if (!authoritativeProduct) {
        throw new Error(`الصنف المطلوب (${item.productId}) غير موجود.`);
      }

      if (!isProductAvailable(authoritativeProduct)) {
        const name =
          typeof authoritativeProduct.name === 'object' && authoritativeProduct.name?.ar
            ? authoritativeProduct.name.ar
            : 'أحد الأصناف';
        throw new Error(`"${name}" غير متاح حالياً. من فضلك شيله من السلة.`);
      }

      // Base price strictly from Firestore
      const basePrice = Number(authoritativeProduct.price || 0);

      // Customization options verified against authoritative customizationGroups
      let optionSum = 0;
      const verifiedCustomizations: any[] = [];
      const dbGroups: any[] = Array.isArray(authoritativeProduct.customizationGroups)
        ? authoritativeProduct.customizationGroups
        : [];

      if (Array.isArray(item.customizations)) {
        for (const group of item.customizations) {
          const groupId = group.id || group.groupId || '';
          const matchingDbGroup = dbGroups.find((g: any) => g.id === groupId);
          const verifiedOptions: any[] = [];

          if (Array.isArray(group.selectedOptions)) {
            for (const opt of group.selectedOptions) {
              const optId = opt.id || opt.optionId || '';
              const matchingDbOpt = matchingDbGroup?.options?.find((o: any) => o.id === optId);
              const verifiedPrice = matchingDbOpt ? Number(matchingDbOpt.price || 0) : 0;
              optionSum += verifiedPrice;
              verifiedOptions.push({
                id: optId,
                optionId: optId,
                name: matchingDbOpt?.name || opt.name || optId,
                price: verifiedPrice,
              });
            }
          }

          verifiedCustomizations.push({
            id: groupId,
            groupId,
            groupName: matchingDbGroup?.name || group.groupName || group.name || groupId,
            selectedOptions: verifiedOptions,
          });
        }
      }

      const unitPrice = basePrice + optionSum;

      return {
        id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: item.productId || '',
        name: typeof item.name === 'string' ? { ar: item.name, en: item.name } : item.name || { ar: '', en: '' },
        image: authoritativeProduct.imageUrl || item.image || '',
        unitPrice,
        quantity,
        totalPrice: unitPrice * quantity,
        customizations: verifiedCustomizations,
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

  // Authoritative delivery fee from settings/restaurant
  let deliveryFee = 0;
  if (payload.orderType === 'delivery') {
    if (restaurantSettings && restaurantSettings.deliveryEnabled === false) {
      throw new Error('خدمة التوصيل غير مفعلة حالياً بالمطعم.');
    }
    const configuredFee = typeof restaurantSettings?.deliveryFee === 'number' ? restaurantSettings.deliveryFee : 25;
    const freeMin = typeof restaurantSettings?.freeDeliveryMinimum === 'number' ? restaurantSettings.freeDeliveryMinimum : 0;
    if (freeMin > 0 && subtotal >= freeMin) {
      deliveryFee = 0;
    } else {
      deliveryFee = configuredFee;
    }
  }

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
