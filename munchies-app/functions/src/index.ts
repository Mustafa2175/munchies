/**
 * @module functions
 * @description Production Firebase Cloud Functions for the Munchie's ordering platform.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = admin.firestore();

// ─── 1. createOrder ──────────────────────────────────────────────────────────

export const createOrder = onCall({ region: 'us-central1' }, async (request) => {
  const data = request.data;
  const auth = request.auth;

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new HttpsError('invalid-argument', 'Cart cannot be empty.');
  }

  if (!data.customerSnapshot?.name || !data.customerSnapshot?.phone) {
    throw new HttpsError('invalid-argument', 'Customer contact details required.');
  }

  // 1. Verify restaurant working hours and manual closure
  const settingsDoc = await db.doc('settings/restaurant').get();
  if (settingsDoc.exists) {
    const settings = settingsDoc.data();
    if (settings?.isManualClosed) {
      throw new HttpsError(
        'failed-precondition',
        settings.closureMessage?.ar || 'المطعم مغلق حالياً ولا يستقبل طلبات جديدة.'
      );
    }
  }

  // 2. Validate product prices and calculate totals atomically
  let calculatedSubtotal = 0;
  const processedItems = [];

  for (const item of data.items) {
    // If custom sandwich
    if (item.productId === 'custom_sandwich') {
      const lineTotal = Number(item.lineTotal || item.basePrice || 50);
      calculatedSubtotal += lineTotal;
      processedItems.push({
        id: item.id || `item_${Date.now()}`,
        productId: 'custom_sandwich',
        name: item.name || { ar: 'ساندوتش على مزاجك', en: 'Custom Sandwich' },
        image: item.image || '',
        unitPrice: lineTotal / (item.quantity || 1),
        quantity: item.quantity || 1,
        totalPrice: lineTotal,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions || '',
      });
      continue;
    }

    // Standard catalog product
    const productDoc = await db.doc(`products/${item.productId}`).get();
    let basePrice = Number(item.basePrice);

    if (productDoc.exists) {
      const pData = productDoc.data();
      if (!pData?.isAvailable) {
        throw new HttpsError(
          'failed-precondition',
          `Product ${pData?.name?.ar || item.productId} is currently out of stock.`
        );
      }
      basePrice = Number(pData.price);
    }

    // Sum options
    let optionsSum = 0;
    if (item.customizations && Array.isArray(item.customizations)) {
      for (const group of item.customizations) {
        if (group.selectedOptions && Array.isArray(group.selectedOptions)) {
          for (const opt of group.selectedOptions) {
            optionsSum += Number(opt.price || 0);
          }
        }
      }
    }

    const unitPrice = basePrice + optionsSum;
    const lineTotal = unitPrice * (item.quantity || 1);
    calculatedSubtotal += lineTotal;

    processedItems.push({
      id: item.id || `item_${Date.now()}`,
      productId: item.productId,
      name: item.name,
      image: item.image || '',
      unitPrice,
      quantity: item.quantity || 1,
      totalPrice: lineTotal,
      customizations: item.customizations || [],
      specialInstructions: item.specialInstructions || '',
    });
  }

  // 3. Delivery fee (disabled for MVP; pickup = 0)
  const deliveryFee = data.orderType === 'delivery' ? 25 : 0;
  const discount = 0;
  const total = calculatedSubtotal + deliveryFee - discount;

  // 4. Atomic sequential numeric order number starting at 1001
  const counterRef = db.doc('settings/orderCounter');
  const nextOrderNum = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(counterRef);
    let current = 1000;
    if (snap.exists) {
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
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return next;
  });

  const orderNumber = String(nextOrderNum);
  const orderRef = db.collection('orders').doc();

  const newOrder = {
    id: orderRef.id,
    orderNumber,
    userId: auth?.uid || 'guest',
    customerName: data.customerSnapshot.name,
    customerPhone: data.customerSnapshot.phone,
    customerEmail: data.customerSnapshot.email || '',
    type: data.orderType || 'pickup',
    status: 'pending',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    items: processedItems,
    subtotal: calculatedSubtotal,
    deliveryFee,
    discount,
    total,
    notes: data.specialInstructions || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    statusHistory: [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: 'Order submitted by customer',
      },
    ],
  };

  await orderRef.set(newOrder);

  return {
    orderId: orderRef.id,
    orderNumber,
    total,
  };
});

// ─── 2. cancelOrder ──────────────────────────────────────────────────────────

export const cancelOrder = onCall({ region: 'us-central1' }, async (request) => {
  const { orderId, reason } = request.data;
  const auth = request.auth;

  if (!orderId) {
    throw new HttpsError('invalid-argument', 'Order ID is required.');
  }

  const orderRef = db.doc(`orders/${orderId}`);

  return await db.runTransaction(async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }

    const orderData = orderDoc.data();

    // Check ownership if not admin
    if (auth && orderData?.userId !== auth.uid) {
      const adminDoc = await db.doc(`adminUsers/${auth.uid}`).get();
      if (!adminDoc.exists || !adminDoc.data()?.isActive) {
        throw new HttpsError('permission-denied', 'Unauthorized to cancel this order.');
      }
    }

    // Atomic business rule: cannot cancel once preparing starts
    const nonCancellable = ['preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
    if (nonCancellable.includes(orderData?.status)) {
      throw new HttpsError(
        'failed-precondition',
        'Cannot cancel order because preparation has already started.'
      );
    }

    const currentHistory = orderData?.statusHistory || [];
    currentHistory.push({
      status: 'cancelled',
      timestamp: new Date().toISOString(),
      note: reason || 'Cancelled by customer',
    });

    transaction.update(orderRef, {
      status: 'cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusHistory: currentHistory,
    });

    return { success: true };
  });
});

// ─── 3. updateOrderStatus ────────────────────────────────────────────────────

export const updateOrderStatus = onCall({ region: 'us-central1' }, async (request) => {
  const { orderId, newStatus, reason } = request.data;
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Admin authentication required.');
  }

  const orderRef = db.doc(`orders/${orderId}`);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new HttpsError('not-found', 'Order not found.');
  }

  const currentHistory = orderDoc.data()?.statusHistory || [];
  currentHistory.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: reason || `Status updated to ${newStatus}`,
    updatedBy: auth.uid,
  });

  await orderRef.update({
    status: newStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    statusHistory: currentHistory,
  });

  return { success: true };
});

// ─── 4. recordPayment ────────────────────────────────────────────────────────

export const recordPayment = onCall({ region: 'us-central1' }, async (request) => {
  const { orderId } = request.data;
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Admin authentication required.');
  }

  const orderRef = db.doc(`orders/${orderId}`);
  await orderRef.update({
    paymentStatus: 'paid',
    paymentRecordedBy: auth.uid,
    paymentRecordedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

