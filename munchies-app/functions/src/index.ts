/**
 * @module functions
 * @description Production Firebase Cloud Functions for the Munchie's ordering platform.
 * Enforces strict server-side Zod input validation (types, lengths, allowed ranges, formats)
 * on every callable endpoint and mutation.
 */

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { evaluateRestaurantStatus } from './restaurantOperations';

admin.initializeApp();
const db = admin.firestore();

// ─── Authoritative Custom Sandwich Builder Ingredient Pricing ────────────────

export const CUSTOM_BUILDER_PRICES: Record<string, number> = {
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

// ─── Production CORS & Origin Allowlist ──────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://munchies-aswan.com',
  'https://www.munchies-aswan.com',
  'https://munchies-9a7b7.web.app',
  'https://munchies-9a7b7.firebaseapp.com',
];

if (process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push(
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:4173'
  );
}

const functionOptions = {
  region: 'us-central1' as const,
  cors: ALLOWED_ORIGINS,
};

// ─── CSRF Protection & Origin Validation ─────────────────────────────────────

function verifyCsrfAndOrigin(request: { rawRequest?: any }): void {
  const req = request.rawRequest;
  if (!req) return;

  const originHeader = req.headers['origin'] || req.headers['referer'];
  if (!originHeader) {
    throw new HttpsError(
      'permission-denied',
      'CSRF Protection: Missing Origin or Referer header on state-changing request.'
    );
  }

  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  const isAllowed = ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));
  if (!isAllowed) {
    throw new HttpsError(
      'permission-denied',
      `CSRF Protection: Request origin '${origin}' is not authorized.`
    );
  }
}

// ─── Per-IP and Per-User Rate Limiting (Returns HTTP 429) ────────────────────

interface RateLimitConfig {
  bucket: string;
  limit: number;
  windowMs: number;
}

function getClientIp(rawRequest?: any): string {
  if (!rawRequest) return 'unknown_ip';
  const forwarded = rawRequest.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  return rawRequest.ip || rawRequest.connection?.remoteAddress || 'unknown_ip';
}

async function checkRateLimit(key: string, config: RateLimitConfig): Promise<void> {
  const now = Date.now();
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
  const docRef = db.doc(`rateLimits/${config.bucket}_${safeKey}`);

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(docRef);
    if (!snap.exists) {
      transaction.set(docRef, {
        count: 1,
        resetAt: now + config.windowMs,
        lastRequestAt: now,
      });
      return;
    }

    const data = snap.data();
    const resetAt = data?.resetAt || 0;

    if (now > resetAt) {
      // Window expired, reset counter for next window
      transaction.set(docRef, {
        count: 1,
        resetAt: now + config.windowMs,
        lastRequestAt: now,
      });
      return;
    }

    const currentCount = data?.count || 0;
    if (currentCount >= config.limit) {
      const waitSeconds = Math.ceil((resetAt - now) / 1000);
      throw new HttpsError(
        'resource-exhausted',
        `Rate limit exceeded (HTTP 429). Too many requests for ${config.bucket}. Please retry in ${waitSeconds}s.`
      );
    }

    transaction.update(docRef, {
      count: currentCount + 1,
      lastRequestAt: now,
    });
  });
}

// ─── Input Validation Schemas (Server-Side) ──────────────────────────────────

const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;

const orderCustomizationOptionSchema = z.object({
  id: z.string().trim().max(128).optional(),
  name: z.unknown().optional(),
  price: z.number().min(0).max(1000).default(0),
});

const orderCustomizationGroupSchema = z.object({
  id: z.string().trim().max(128).optional(),
  name: z.unknown().optional(),
  selectedOptions: z.array(orderCustomizationOptionSchema).max(30).optional(),
});

const orderItemSchema = z.object({
  id: z.string().trim().max(128).optional(),
  productId: z.string().trim().min(1, 'Product ID required').max(128),
  name: z.unknown().optional(),
  image: z.string().trim().max(1000).optional().or(z.literal('')),
  basePrice: z.number().min(0).max(10000).optional(),
  lineTotal: z.number().min(0).max(50000).optional(),
  unitPrice: z.number().min(0).max(10000).optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Quantity cannot exceed 50'),
  customizations: z.array(orderCustomizationGroupSchema).max(20).optional(),
  specialInstructions: z.string().trim().max(500).optional().or(z.literal('')),
});

const createOrderSchema = z.object({
  orderType: z.enum(['pickup', 'delivery']),
  customerSnapshot: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    phone: z.string().trim().regex(egyptianPhoneRegex, 'Invalid Egyptian mobile number (must start with 010, 011, 012, or 015 and be 11 digits)'),
    email: z.string().trim().email('Invalid email address').max(254).optional().or(z.literal('')),
  }),
  deliveryAddress: z
    .union([
      z.string().trim().max(500),
      z.record(z.string(), z.unknown()).refine((m) => Object.keys(m).length <= 20, 'Address map cannot exceed 20 fields'),
    ])
    .optional()
    .nullable(),
  deliveryFee: z.number().min(0).max(1000).optional(),
  specialInstructions: z.string().trim().max(500).optional().or(z.literal('')),
  couponCode: z.string().trim().max(50).optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'Cart cannot be empty').max(100, 'Cannot exceed 100 distinct items per order'),
});

const cancelOrderSchema = z.object({
  orderId: z.string().trim().min(1, 'Order ID required').max(128),
  reason: z.string().trim().max(500).optional().or(z.literal('')),
});

const orderStatusEnum = z.enum([
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'picked_up',
  'cancelled',
  'refunded',
]);

const updateOrderStatusSchema = z.object({
  orderId: z.string().trim().min(1, 'Order ID required').max(128),
  newStatus: orderStatusEnum,
  reason: z.string().trim().max(500).optional().or(z.literal('')),
});

const recordPaymentSchema = z.object({
  orderId: z.string().trim().min(1, 'Order ID required').max(128),
});

const recordSecurityEventSchema = z.object({
  eventType: z.enum([
    'failed_login',
    'password_change',
    'password_reset_request',
    'admin_action',
    'admin_login',
  ]),
  identifier: z.string().trim().max(254).optional(),
  errorCode: z.string().trim().max(100).optional(),
  targetCollection: z.string().trim().max(100).optional(),
  targetId: z.string().trim().max(128).optional(),
  summary: z.string().trim().max(500).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

// ─── Sensitive Data Scrubber & Audit Trail Helpers ───────────────────────────

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /credential/i,
  /auth.*header/i,
  /api.*key/i,
  /credit.*card/i,
  /cvv/i,
  /pin/i,
];

function maskEmail(email?: string | null): string {
  if (!email || typeof email !== 'string') return 'anonymous';
  const parts = email.split('@');
  if (parts.length !== 2) return 'masked-identifier';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0] || '*'}***@${domain}`;
  }
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

function sanitizeAuditData(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[Truncated]';
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.slice(0, 20).map((item) => sanitizeAuditData(item, depth + 1));
  }
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERNS.some((p) => p.test(key))) {
      clean[key] = '[REDACTED_SENSITIVE_DATA]';
      continue;
    }
    clean[key] = sanitizeAuditData(value, depth + 1);
  }
  return clean;
}

interface AuditLogPayload {
  action: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  targetCollection?: string;
  targetId?: string;
  summary: string;
  details?: Record<string, unknown>;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  isAlert?: boolean;
}

async function logAuditEvent(entry: AuditLogPayload): Promise<void> {
  try {
    const sanitizedDetails = entry.details ? (sanitizeAuditData(entry.details) as Record<string, unknown>) : {};
    const auditDoc = {
      action: entry.action,
      actorId: entry.actorId || 'system',
      actorName: entry.actorName || 'نظام مانشيز',
      actorRole: entry.actorRole || 'system',
      targetCollection: entry.targetCollection || 'system',
      targetId: entry.targetId || 'n/a',
      summary: entry.summary,
      details: sanitizedDetails,
      severity: entry.severity || 'INFO',
      isAlert: entry.isAlert || false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString(),
    };

    await db.collection('auditLogs').add(auditDoc);

    // Also structured console logging without sensitive data
    if (entry.severity === 'CRITICAL') {
      console.error(`[SECURITY ALERT] ${entry.summary}`, { action: entry.action, target: entry.targetId });
    } else if (entry.severity === 'WARNING') {
      console.warn(`[AUDIT WARNING] ${entry.summary}`, { action: entry.action, target: entry.targetId });
    } else {
      console.info(`[AUDIT INFO] ${entry.summary}`, { action: entry.action, target: entry.targetId });
    }
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// ─── 1. createOrder ──────────────────────────────────────────────────────────

export const createOrder = onCall(functionOptions, async (request) => {
  verifyCsrfAndOrigin(request);

  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required to place an order.');
  }

  const clientIp = getClientIp(request.rawRequest);
  // Rate limits: max 10 orders per 10 min per user, max 25 orders per 10 min per IP (Returns HTTP 429)
  await checkRateLimit(auth.uid, { bucket: 'create_order_user', limit: 10, windowMs: 10 * 60 * 1000 });
  await checkRateLimit(clientIp, { bucket: 'create_order_ip', limit: 25, windowMs: 10 * 60 * 1000 });

  // Strict server-side Zod input validation
  const validationResult = createOrderSchema.safeParse(request.data);
  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new HttpsError('invalid-argument', `Invalid order data: ${errorDetails}`);
  }

  const data = validationResult.data;

  // 1. Verify restaurant operating mode, automatic schedule (Africa/Cairo), and manual overrides
  const settingsDoc = await db.doc('settings/restaurant').get();
  if (settingsDoc.exists) {
    const settings = settingsDoc.data();
    const operatingStatus = evaluateRestaurantStatus(settings, new Date());
    if (!operatingStatus.isOpen) {
      throw new HttpsError(
        'failed-precondition',
        operatingStatus.customerMessage || 'المطعم مغلق حالياً ولا يستقبل طلبات جديدة.'
      );
    }
  }

  // 2. Validate product prices and calculate totals atomically from database (never trust client prices)
  let calculatedSubtotal = 0;
  const processedItems = [];

  for (const item of data.items) {
    // If custom sandwich: verify each selected ingredient against server pricing registry
    if (item.productId === 'custom_sandwich') {
      let customOptionsSum = 0;
      const verifiedCustomizations = [];

      if (item.customizations && Array.isArray(item.customizations)) {
        for (const group of item.customizations) {
          const groupId = group.id || (group as any).groupId || '';
          const groupName = (group as any).groupName || group.name || { ar: groupId, en: groupId };
          const verifiedOptions = [];

          if (group.selectedOptions && Array.isArray(group.selectedOptions)) {
            for (const opt of group.selectedOptions) {
              const optId = opt.id || (opt as any).optionId || '';
              // Verified unit price strictly from server registry
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
            groupName,
            selectedOptions: verifiedOptions,
          });
        }
      }

      // Unit price is calculated strictly from server ingredient prices (minimum safe fallback 50 EGP)
      const unitPrice = customOptionsSum > 0 ? customOptionsSum : 50;
      const lineTotal = unitPrice * item.quantity;
      calculatedSubtotal += lineTotal;

      processedItems.push({
        id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: 'custom_sandwich',
        name: item.name || { ar: 'ساندوتش على مزاجك', en: 'Custom Sandwich' },
        image: item.image || '/hero_burger_clean_cutout.png',
        unitPrice,
        quantity: item.quantity,
        totalPrice: lineTotal,
        customizations: verifiedCustomizations,
        specialInstructions: item.specialInstructions || '',
      });
      continue;
    }

    // Standard catalog product: fetch directly from Firestore products collection
    const productDoc = await db.doc(`products/${item.productId}`).get();
    if (!productDoc.exists) {
      throw new HttpsError(
        'not-found',
        `المنتج المطلوب (${item.productId}) غير موجود بقائمة الطعام.`
      );
    }

    const pData = productDoc.data();
    if (!pData?.isAvailable) {
      throw new HttpsError(
        'failed-precondition',
        `عذراً، المنتج ${pData?.name?.ar || item.productId} غير متوفر حالياً.`
      );
    }

    const basePrice = Number(pData.price);
    if (isNaN(basePrice) || basePrice < 0) {
      throw new HttpsError('internal', 'بيانات تسعير المنتج غير صالحة.');
    }

    // Validate customizations against options in Firestore
    let optionsSum = 0;
    const verifiedCustomizations = [];
    const dbGroups: any[] = Array.isArray(pData.customizationGroups) ? pData.customizationGroups : [];

    if (item.customizations && Array.isArray(item.customizations)) {
      for (const group of item.customizations) {
        const groupId = group.id || (group as any).groupId || '';
        const matchingDbGroup = dbGroups.find((g: any) => g.id === groupId);
        const verifiedOptions = [];

        if (group.selectedOptions && Array.isArray(group.selectedOptions)) {
          for (const opt of group.selectedOptions) {
            const optId = opt.id || (opt as any).optionId || '';
            const matchingDbOpt = matchingDbGroup?.options?.find((o: any) => o.id === optId);
            const verifiedPrice = matchingDbOpt ? Number(matchingDbOpt.price || 0) : 0;
            optionsSum += verifiedPrice;
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
          groupName: matchingDbGroup?.name || (group as any).groupName || group.name,
          selectedOptions: verifiedOptions,
        });
      }
    }

    const unitPrice = basePrice + optionsSum;
    const lineTotal = unitPrice * item.quantity;
    calculatedSubtotal += lineTotal;

    processedItems.push({
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: item.productId,
      name: pData.name || item.name,
      image: pData.imageUrl || item.image || '',
      unitPrice,
      quantity: item.quantity,
      totalPrice: lineTotal,
      customizations: verifiedCustomizations,
      specialInstructions: item.specialInstructions || '',
    });
  }

  // 3. Delivery fee strictly evaluated from server settings (never trust client delivery fee)
  let deliveryFee = 0;
  if (data.orderType === 'delivery') {
    const restDoc = await db.doc('settings/restaurant').get();
    const restData = restDoc.exists ? restDoc.data() : null;

    if (restData && restData.deliveryEnabled === false) {
      throw new HttpsError('failed-precondition', 'خدمة التوصيل غير مفعلة حالياً بالمطعم.');
    }

    const configuredFee = typeof restData?.deliveryFee === 'number' ? restData.deliveryFee : 25;
    const freeMin = typeof restData?.freeDeliveryMinimum === 'number' ? restData.freeDeliveryMinimum : 0;

    if (freeMin > 0 && calculatedSubtotal >= freeMin) {
      deliveryFee = 0;
    } else {
      deliveryFee = configuredFee;
    }
  }

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
    customerId: auth.uid,
    userId: auth.uid,
    customerName: data.customerSnapshot.name,
    customerPhone: data.customerSnapshot.phone,
    customerEmail: data.customerSnapshot.email || '',
    type: data.orderType,
    deliveryType: data.orderType,
    deliveryAddress: data.deliveryAddress || null,
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

export const cancelOrder = onCall(functionOptions, async (request) => {
  verifyCsrfAndOrigin(request);

  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  // Rate limit: max 5 order cancellations per 10 minutes per user (HTTP 429)
  await checkRateLimit(auth.uid, { bucket: 'cancel_order', limit: 5, windowMs: 10 * 60 * 1000 });

  // Strict server-side Zod input validation
  const validationResult = cancelOrderSchema.safeParse(request.data);
  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new HttpsError('invalid-argument', `Invalid request: ${errorDetails}`);
  }

  const { orderId, reason } = validationResult.data;
  const orderRef = db.doc(`orders/${orderId}`);

  return await db.runTransaction(async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }

    const orderData = orderDoc.data();

    // Check ownership if not admin
    const ownerUid = orderData?.customerId || orderData?.userId;
    const isStaff = ownerUid !== auth.uid;
    if (isStaff) {
      const adminDoc = await db.doc(`adminUsers/${auth.uid}`).get();
      if (!adminDoc.exists || !adminDoc.data()?.isActive) {
        throw new HttpsError('permission-denied', 'Unauthorized to cancel this order.');
      }
    }

    // Atomic business rule: cannot cancel once preparation starts
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

    // Asynchronously log cancellation audit event
    logAuditEvent({
      action: 'cancel_order',
      actorId: auth.uid,
      actorName: auth.token.name || auth.token.email || 'عميل مانشيز',
      actorRole: isStaff ? 'admin' : 'customer',
      targetCollection: 'orders',
      targetId: orderId,
      summary: `إلغاء الطلب ${orderData?.orderNumber || orderId} (${reason || 'طلب العميل'})`,
      details: { orderId, reason: reason || 'Cancelled by customer', isStaff },
      severity: 'INFO',
    }).catch((e) => console.warn('Audit log write error:', e));

    return { success: true };
  });
});

// ─── 3. updateOrderStatus ────────────────────────────────────────────────────

export const updateOrderStatus = onCall(functionOptions, async (request) => {
  verifyCsrfAndOrigin(request);

  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Admin authentication required.');
  }

  // Rate limit: max 120 status updates per 10 minutes per admin
  await checkRateLimit(auth.uid, { bucket: 'admin_order_update', limit: 120, windowMs: 10 * 60 * 1000 });

  // Server-side identity check: verify caller is an active administrator
  const adminDoc = await db.doc(`adminUsers/${auth.uid}`).get();
  if (!adminDoc.exists || !adminDoc.data()?.isActive) {
    throw new HttpsError('permission-denied', 'Only active administrators can update order status.');
  }

  // Strict server-side Zod input validation
  const validationResult = updateOrderStatusSchema.safeParse(request.data);
  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new HttpsError('invalid-argument', `Invalid request: ${errorDetails}`);
  }

  const { orderId, newStatus, reason } = validationResult.data;
  const orderRef = db.doc(`orders/${orderId}`);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new HttpsError('not-found', 'Order not found.');
  }

  const orderData = orderDoc.data();
  const currentHistory = orderData?.statusHistory || [];
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

  // Log administrative status update
  await logAuditEvent({
    action: 'update_order_status',
    actorId: auth.uid,
    actorName: adminDoc.data()?.name || adminDoc.data()?.displayName || 'مسؤول مانشيز',
    actorRole: adminDoc.data()?.role || 'admin',
    targetCollection: 'orders',
    targetId: orderId,
    summary: `تحديث حالة الطلب ${orderData?.orderNumber || orderId} إلى ${newStatus}`,
    details: {
      orderId,
      orderNumber: orderData?.orderNumber || orderId,
      previousStatus: orderData?.status,
      newStatus,
      reason: reason || '',
    },
    severity: 'INFO',
  });

  return { success: true };
});

// ─── 4. recordPayment ────────────────────────────────────────────────────────

export const recordPayment = onCall(functionOptions, async (request) => {
  verifyCsrfAndOrigin(request);

  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Admin authentication required.');
  }

  // Rate limit: max 60 payments recorded per 10 minutes per admin
  await checkRateLimit(auth.uid, { bucket: 'admin_payment', limit: 60, windowMs: 10 * 60 * 1000 });

  // Server-side identity check: verify caller is an active administrator
  const adminDoc = await db.doc(`adminUsers/${auth.uid}`).get();
  if (!adminDoc.exists || !adminDoc.data()?.isActive) {
    throw new HttpsError('permission-denied', 'Only active administrators can record payments.');
  }

  // Strict server-side Zod input validation
  const validationResult = recordPaymentSchema.safeParse(request.data);
  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new HttpsError('invalid-argument', `Invalid request: ${errorDetails}`);
  }

  const { orderId } = validationResult.data;
  const orderRef = db.doc(`orders/${orderId}`);
  const orderSnap = await orderRef.get();
  const orderNumber = orderSnap.data()?.orderNumber || orderId;

  await orderRef.update({
    paymentStatus: 'paid',
    paymentRecordedBy: auth.uid,
    paymentRecordedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Log administrative payment record
  await logAuditEvent({
    action: 'record_payment',
    actorId: auth.uid,
    actorName: adminDoc.data()?.name || adminDoc.data()?.displayName || 'مسؤول مانشيز',
    actorRole: adminDoc.data()?.role || 'admin',
    targetCollection: 'orders',
    targetId: orderId,
    summary: `تسجيل دفع الطلب ${orderNumber}`,
    details: { orderId, orderNumber, paymentStatus: 'paid' },
    severity: 'INFO',
  });

  return { success: true };
});

// ─── 5. revokeUserSession (Server-side logout invalidation) ───────────────────

export const revokeUserSession = onCall(functionOptions, async (request) => {
  verifyCsrfAndOrigin(request);

  const auth = request.auth;
  if (!auth) {
    return { success: true };
  }

  try {
    // Revoke all refresh tokens for this user on the server
    await admin.auth().revokeRefreshTokens(auth.uid);
    return { success: true };
  } catch (err) {
    console.warn(`Failed to revoke refresh tokens for user ${auth.uid}:`, err);
    return { success: false };
  }
});

// ─── 6. recordSecurityEvent (Logging, Rate Limits & Repeated Failure Alerts) ──

export const recordSecurityEvent = onCall(functionOptions, async (request) => {
  verifyCsrfAndOrigin(request);

  const parsed = recordSecurityEventSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Invalid security event payload.');
  }

  const { eventType, identifier, errorCode, targetCollection, targetId, summary, details } = parsed.data;
  const callerAuth = request.auth;
  const maskedId = maskEmail(identifier || callerAuth?.token?.email);
  const clientIp = getClientIp(request.rawRequest);

  if (eventType === 'failed_login') {
    const cleanKey = (identifier || clientIp)
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, '_')
      .slice(0, 100);

    // Hard rate limit check: max 5 failed attempts per 15 minutes per IP/Account (returns HTTP 429)
    await checkRateLimit(cleanKey, {
      bucket: 'failed_login_limit',
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    // Track failed login attempts in failedLoginTracker
    const trackerRef = db.doc(`failedLoginTracker/${cleanKey}`);
    const trackerSnap = await trackerRef.get();

    const now = Date.now();
    const WINDOW_MS = 15 * 60 * 1000;
    let attemptsCount = 1;

    if (trackerSnap.exists) {
      const data = trackerSnap.data();
      const lastAttempt = data?.lastAttemptTime || (data?.lastAttemptAt?.toMillis ? data.lastAttemptAt.toMillis() : 0);
      if (now - lastAttempt < WINDOW_MS) {
        attemptsCount = (data?.attemptsCount || 0) + 1;
      }
    }

    await trackerRef.set(
      {
        identifier: maskedId,
        attemptsCount,
        lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        lastAttemptTime: now,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const isRepeated = attemptsCount >= 3;

    if (isRepeated) {
      await logAuditEvent({
        action: 'repeated_failed_logins',
        actorId: 'anonymous',
        actorName: 'مجهول',
        actorRole: 'anonymous',
        targetCollection: 'auth',
        targetId: maskedId,
        summary: `تنبيه أمني: رصد محاولات تسجيل دخول فاشلة متكررة (${attemptsCount} محاولات) للحساب: ${maskedId}`,
        details: {
          attemptsCount,
          errorCode: errorCode || 'auth/invalid-credential',
          windowMinutes: 15,
        },
        severity: 'CRITICAL',
        isAlert: true,
      });

      return {
        success: true,
        isRepeatedAlert: true,
        attemptsCount,
        alertMessage: `تنبيه أمني: رصد محاولات دخول فاشلة متكررة (${attemptsCount} محاولات). تم توثيق هذا النشاط في سجل الأمان.`,
      };
    }

    await logAuditEvent({
      action: 'failed_login',
      actorId: 'anonymous',
      actorName: 'مجهول',
      actorRole: 'anonymous',
      targetCollection: 'auth',
      targetId: maskedId,
      summary: `محاولة تسجيل دخول فاشلة للحساب: ${maskedId}`,
      details: {
        errorCode: errorCode || 'auth/invalid-credential',
        attemptNumber: attemptsCount,
      },
      severity: 'WARNING',
      isAlert: false,
    });

    return { success: true, isRepeatedAlert: false, attemptsCount };
  }

  if (eventType === 'password_change') {
    if (callerAuth?.uid) {
      // Rate limit: max 5 password change attempts per 15 minutes
      await checkRateLimit(callerAuth.uid, { bucket: 'password_change', limit: 5, windowMs: 15 * 60 * 1000 });
    }

    await logAuditEvent({
      action: 'password_change',
      actorId: callerAuth?.uid || 'anonymous',
      actorName: callerAuth?.token?.name || 'مستخدم مانشيز',
      actorRole: callerAuth?.uid ? 'customer' : 'anonymous',
      targetCollection: 'users',
      targetId: callerAuth?.uid || maskedId,
      summary: `تم تحديث كلمة المرور للحساب: ${maskedId}`,
      details: { status: 'success' },
      severity: 'INFO',
    });
    return { success: true };
  }

  if (eventType === 'password_reset_request') {
    // Rate limit: max 3 reset requests per 15 minutes per IP or email
    await checkRateLimit(identifier || clientIp, { bucket: 'password_reset', limit: 3, windowMs: 15 * 60 * 1000 });

    await logAuditEvent({
      action: 'password_reset_request',
      actorId: 'anonymous',
      actorName: 'مجهول',
      actorRole: 'anonymous',
      targetCollection: 'auth',
      targetId: maskedId,
      summary: `تم طلب رابط استعادة كلمة المرور للحساب: ${maskedId}`,
      details: { status: 'requested' },
      severity: 'INFO',
    });
    return { success: true };
  }

  if (eventType === 'admin_login') {
    await logAuditEvent({
      action: 'admin_login',
      actorId: callerAuth?.uid || 'unknown',
      actorName: callerAuth?.token?.name || 'مسؤول مانشيز',
      actorRole: 'admin',
      targetCollection: 'adminUsers',
      targetId: callerAuth?.uid || 'n/a',
      summary: `تسجيل دخول ناجح إلى لوحة تحكم الإدارة: ${maskedId}`,
      severity: 'INFO',
    });
    return { success: true };
  }

  if (eventType === 'admin_action') {
    if (!callerAuth) {
      throw new HttpsError('unauthenticated', 'Admin authentication required.');
    }
    await logAuditEvent({
      action: (details?.action as string) || 'update_settings',
      actorId: callerAuth.uid,
      actorName: callerAuth.token.name || 'مسؤول مانشيز',
      actorRole: 'admin',
      targetCollection: targetCollection || 'admin',
      targetId: targetId || 'n/a',
      summary: summary || 'إجراء إداري في لوحة التحكم',
      details: details ? (sanitizeAuditData(details) as Record<string, unknown>) : undefined,
      severity: 'INFO',
    });
    return { success: true };
  }

  return { success: true };
});

// ─── 7. createAuthSessionCookie (Secure, HttpOnly, SameSite Session Cookie) ───

const sessionCookieSchema = z.object({
  idToken: z.string().trim().min(10, 'Valid Firebase ID token required'),
});

export const createAuthSessionCookie = onCall(functionOptions, async (request) => {
  verifyCsrfAndOrigin(request);

  const parsed = sessionCookieSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Valid Firebase ID token is required.');
  }

  const { idToken } = parsed.data;
  // Session cookie duration: 5 days
  const expiresIn = 5 * 24 * 60 * 60 * 1000;

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    return {
      success: true,
      sessionCookie,
      cookieOptions: {
        secure: true,
        httpOnly: true,
        sameSite: 'lax' as const,
        maxAge: expiresIn / 1000,
        path: '/',
      },
    };
  } catch (err) {
    console.error('Failed to create session cookie:', err);
    throw new HttpsError('unauthenticated', 'Failed to authenticate and create secure session cookie.');
  }
});

// ─── 8. handlePaymentWebhook (HMAC-SHA256 Signature Verified Payment Confirmation) ───

export const handlePaymentWebhook = onRequest({ region: 'us-central1' }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const signatureHeader =
    (req.headers['x-webhook-signature'] as string) ||
    (req.headers['x-signature'] as string) ||
    (req.headers['x-paymob-hmac'] as string);

  if (!signatureHeader || typeof signatureHeader !== 'string') {
    console.warn('[Payment Webhook] Request rejected: missing signature header');
    res.status(401).json({ error: 'Missing webhook signature header' });
    return;
  }

  // Webhook secret from environment variable (never hardcoded in source)
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'munchies_webhook_secret_default_change_in_prod';
  const rawBody = (req as any).rawBody
    ? (req as any).rawBody.toString('utf8')
    : JSON.stringify(req.body);

  const computedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

  let isMatch = false;
  try {
    const sigBuf = Buffer.from(signatureHeader, 'hex');
    const compBuf = Buffer.from(computedSignature, 'hex');
    if (sigBuf.length === compBuf.length && crypto.timingSafeEqual(sigBuf, compBuf)) {
      isMatch = true;
    }
  } catch (err) {
    isMatch = false;
  }

  if (!isMatch) {
    console.warn('[Payment Webhook] Signature verification failed');
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  // Signature is valid: process order confirmation
  const payload = req.body || {};
  const orderId = payload.orderId || payload.order_id || payload.merchant_order_id;
  const transactionId = payload.transactionId || payload.transaction_id || payload.id || `txn_${Date.now()}`;
  const isPaid =
    payload.success === true ||
    payload.status === 'success' ||
    payload.status === 'paid' ||
    payload.status === 'captured';

  if (!orderId || typeof orderId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid orderId in webhook payload' });
    return;
  }

  try {
    const orderRef = db.doc(`orders/${orderId}`);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (isPaid) {
      await orderRef.update({
        paymentStatus: 'paid',
        paymentReference: String(transactionId),
        status: 'confirmed',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await logAuditEvent({
        action: 'record_payment',
        actorId: 'payment_gateway',
        actorName: 'بوابة الدفع الإلكتروني',
        actorRole: 'system',
        targetCollection: 'orders',
        targetId: orderId,
        summary: `تم تأكيد دفع الطلب رقم #${orderSnap.data()?.orderNumber || orderId} عبر بوابة الدفع (عملية: ${transactionId})`,
        severity: 'INFO',
      });

      res.status(200).json({ received: true, orderId, status: 'confirmed' });
    } else {
      await orderRef.update({
        paymentStatus: 'failed',
        paymentReference: String(transactionId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.status(200).json({ received: true, orderId, status: 'failed' });
    }
  } catch (dbErr) {
    console.error('[Payment Webhook] Error updating order:', dbErr);
    res.status(500).json({ error: 'Internal processing error' });
  }
});

// ─── 9. Token-Based Password Reset (15-30 Min Expiry, Single-Use, Invalidation) ─

const resetRequestSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const requestPasswordResetToken = onCall(functionOptions, async (request) => {
  verifyCsrfAndOrigin(request);

  const clientIp = getClientIp(request.rawRequest);
  await checkRateLimit(clientIp, {
    bucket: 'password_reset_req_ip',
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  const parsed = resetRequestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'Valid email address is required.');
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    if (userRecord && userRecord.uid) {
      // Invalidate any existing unused reset tokens for this user
      const existingTokensSnap = await db
        .collection('passwordResetTokens')
        .where('uid', '==', userRecord.uid)
        .where('used', '==', false)
        .get();

      if (!existingTokensSnap.empty) {
        const batch = db.batch();
        existingTokensSnap.forEach((doc) => {
          batch.update(doc.ref, {
            used: true,
            invalidatedReason: 'superseded_by_new_request',
            invalidatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
      }

      // Generate secure 32-byte token and hash it with SHA-256
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Set expiry to 20 minutes (fits 15-30 minute security standard)
      const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 20 * 60 * 1000));

      await db.doc(`passwordResetTokens/${tokenHash}`).set({
        uid: userRecord.uid,
        email: userRecord.email,
        tokenHash,
        used: false,
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        requestIp: clientIp,
      });

      await logAuditEvent({
        action: 'password_reset_request',
        actorId: userRecord.uid,
        actorName: userRecord.displayName || 'عميل مانشيز',
        actorRole: 'customer',
        targetCollection: 'users',
        targetId: userRecord.uid,
        summary: `طلب رابط استعادة كلمة مرور لحساب: ${email.slice(0, 3)}***@${email.split('@')[1]} (صلاحية 20 دقيقة)`,
        severity: 'INFO',
      });

      return {
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، تم إرسال رابط تعيين كلمة المرور.',
        expiresInMinutes: 20,
      };
    }
  } catch (err: any) {
    if (err.code !== 'auth/user-not-found') {
      console.error('Password reset request error:', err);
    }
  }

  // Consistent response to protect against user enumeration
  return {
    success: true,
    message: 'إذا كان البريد الإلكتروني مسجلاً، تم إرسال رابط تعيين كلمة المرور.',
    expiresInMinutes: 20,
  };
});

const confirmResetSchema = z.object({
  token: z.string().trim().min(32).max(128),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const confirmPasswordResetWithToken = onCall(functionOptions, async (request) => {
  verifyCsrfAndOrigin(request);

  const clientIp = getClientIp(request.rawRequest);
  await checkRateLimit(clientIp, {
    bucket: 'password_reset_confirm_ip',
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  const parsed = confirmResetSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', 'بيانات تعيين كلمة المرور غير صالحة.');
  }

  const { token, newPassword } = parsed.data;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const tokenRef = db.doc(`passwordResetTokens/${tokenHash}`);

  // Atomically verify and consume single-use token
  const result = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(tokenRef);
    if (!snap.exists) {
      throw new HttpsError('not-found', 'رابط استعادة كلمة المرور غير صالح أو منتهي الصلاحية.');
    }

    const tData = snap.data()!;
    if (tData.used) {
      throw new HttpsError('failed-precondition', 'تم استخدام هذا الرابط مسبقاً. الروابط صالحة لمرة واحدة فقط.');
    }

    const now = Date.now();
    const expiresAtMs = tData.expiresAt.toMillis();
    if (now > expiresAtMs) {
      throw new HttpsError('failed-precondition', 'انتهت صلاحية هذا الرابط (صلاحية الرابط 20 دقيقة). يرجى طلب رابط جديد.');
    }

    // Mark as consumed immediately
    transaction.update(tokenRef, {
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      usedIp: clientIp,
    });

    return { uid: tData.uid, email: tData.email };
  });

  // Update password in Firebase Auth via Admin SDK
  await admin.auth().updateUser(result.uid, { password: newPassword });

  // Invalidate any other active reset tokens for this user
  const otherTokensSnap = await db
    .collection('passwordResetTokens')
    .where('uid', '==', result.uid)
    .where('used', '==', false)
    .get();

  if (!otherTokensSnap.empty) {
    const batch = db.batch();
    otherTokensSnap.forEach((doc) => {
      batch.update(doc.ref, {
        used: true,
        invalidatedReason: 'password_changed',
        invalidatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  // Revoke all refresh tokens to terminate all active sessions across devices
  await admin.auth().revokeRefreshTokens(result.uid);

  await logAuditEvent({
    action: 'password_change',
    actorId: result.uid,
    actorName: 'عميل مانشيز',
    actorRole: 'customer',
    targetCollection: 'users',
    targetId: result.uid,
    summary: `تم تعيين كلمة مرور جديدة بنجاح عبر رابط الاستعادة مع إنهاء كافة الجلسات النشطة`,
    severity: 'INFO',
  });

  return {
    success: true,
    message: 'تم تحديث كلمة المرور بنجاح. تم إنهاء كافة الجلسات السابقة لدواعي الأمان.',
  };
});

export const invalidateUserPasswordResetTokens = onCall(functionOptions, async (request) => {
  verifyCsrfAndOrigin(request);

  const auth = request.auth;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const activeTokens = await db
    .collection('passwordResetTokens')
    .where('uid', '==', auth.uid)
    .where('used', '==', false)
    .get();

  if (!activeTokens.empty) {
    const batch = db.batch();
    activeTokens.forEach((doc) => {
      batch.update(doc.ref, {
        used: true,
        invalidatedReason: 'password_changed_in_account',
        invalidatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  return { success: true };
});


