/**
 * @file seed-firestore.ts
 * @description Comprehensive Firestore seeder for Munchie's Restaurant (Project: munchies-9a7b7).
 * Populates products, categories, branch operations settings, and admin users via Firestore REST API.
 */

import fs from 'fs';
import path from 'path';
import { CATEGORIES, PRODUCTS } from '../src/data/mockData';

const PROJECT_ID = 'munchies-9a7b7';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Helper: Convert JavaScript value to Firestore REST JSON
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Helper: Write a document to Firestore via REST API
async function saveDocument(collectionPath: string, docId: string, data: any, token: string) {
  const url = `${BASE_URL}/${collectionPath}/${docId}`;
  const converted = toFirestoreValue(data);

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: converted.mapValue.fields,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to save ${collectionPath}/${docId} (${res.status}): ${errorText}`);
  }
}

// Get access token from Firebase Tools configuration
function getAccessToken(): string {
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  const configPath = path.join(userProfile, '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Firebase CLI credentials not found at: ${configPath}`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config.tokens?.access_token;
  if (!token) {
    throw new Error('No access_token found in firebase-tools config. Please run firebase login.');
  }
  return token;
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Firestore Seeding for [${PROJECT_ID}]`);
  console.log(`======================================================\n`);

  const token = getAccessToken();

  // 1. Seed Categories
  console.log(`📦 Seeding Categories (${CATEGORIES.length} items)...`);
  for (const cat of CATEGORIES) {
    await saveDocument('categories', cat.id, cat, token);
    console.log(`  ✓ Category seeded: ${cat.name.ar} (${cat.id})`);
  }

  // 2. Seed Products
  console.log(`\n🍔 Seeding Products (${PRODUCTS.length} items)...`);
  for (const product of PRODUCTS) {
    await saveDocument('products', product.id, product, token);
    console.log(`  ✓ Product seeded: ${product.name.ar} - ${product.price} EGP (${product.id})`);
  }

  // 3. Seed Restaurant Settings
  console.log(`\n⚙️ Seeding Restaurant Settings (settings/restaurant)...`);
  const restaurantSettings = {
    id: 'restaurant',
    name: { ar: 'مانشيز', en: "Munchie's" },
    tagline: { ar: 'مزاجك للأكل؟ إحنا جاهزين!', en: "Craving Good Food? We've Got You!" },
    logoUrl: '/fb_logo.jpg',
    faviconUrl: '/favicon.svg',
    phone: '01025707026',
    email: 'info@munchies-aswan.com',
    address: {
      ar: 'حديقة الورد أمام الراية – فرع الكورنيش، أسوان',
      en: 'Rose Garden in front of Al Raya – Corniche Branch, Aswan',
    },
    location: {
      lat: 24.0889,
      lng: 32.8998,
    },
    isManualClosed: false,
    isOrderingPaused: false,
    workingHours: {
      sunday: { isOpen: true, ranges: [{ open: '12:00', close: '03:00' }] },
      monday: { isOpen: true, ranges: [{ open: '12:00', close: '03:00' }] },
      tuesday: { isOpen: true, ranges: [{ open: '12:00', close: '03:00' }] },
      wednesday: { isOpen: true, ranges: [{ open: '12:00', close: '03:00' }] },
      thursday: { isOpen: true, ranges: [{ open: '12:00', close: '03:00' }] },
      friday: { isOpen: true, ranges: [{ open: '12:00', close: '03:00' }] },
      saturday: { isOpen: true, ranges: [{ open: '12:00', close: '03:00' }] },
    },
    defaultPrepTimeMinutes: 20,
    minOrderAmount: 0,
    deliveryZones: [
      {
        id: 'aswan_corniche',
        name: { ar: 'كورنيش أسوان والوسط', en: 'Aswan Corniche & Downtown' },
        fee: 25,
        estimatedMinutes: 35,
        isActive: false, // Under construction
      },
    ],
    socialLinks: {
      facebook: 'https://facebook.com/munchies.aswan',
      whatsapp: 'https://wa.me/201025707026',
    },
    seo: {
      title: { ar: 'مانشيز أسوان | أشهى برجر وسندوتشات', en: "Munchie's Aswan | Best Burgers & Sandwiches" },
      description: {
        ar: 'اطلب أونلاين من مانشيز بأسوان - برجر، فات بير، فرايز لوديد، وسندوتشات بأعلى جودة ولحوم بلدية 100%',
        en: "Order online from Munchie's Aswan - Burgers, Fat Burgers, Loaded Fries, and gourmet sandwiches",
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveDocument('settings', 'restaurant', restaurantSettings, token);
  console.log(`  ✓ settings/restaurant successfully configured!`);

  // 4. Seed Admin Users
  console.log(`\n🛡️ Seeding Initial Admin Users (adminUsers collection)...`);
  const adminUsers = [
    {
      id: 'admin_1',
      uid: 'admin_1',
      displayName: 'مدير مانشيز',
      email: 'admin@munchies.com',
      phone: '01025707026',
      role: 'super_admin',
      isActive: true,
      permissions: [
        'orders.view',
        'orders.manage',
        'orders.cancel',
        'orders.refund',
        'products.view',
        'products.manage',
        'categories.manage',
        'settings.view',
        'settings.manage',
        'operations.manage',
        'reports.view',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mustafakhaled2175',
      uid: 'mustafakhaled2175',
      displayName: 'Mustafa Khaled (Admin)',
      email: 'mustafakhaled2175@gmail.com',
      phone: '01025707026',
      role: 'super_admin',
      isActive: true,
      permissions: [
        'orders.view',
        'orders.manage',
        'orders.cancel',
        'orders.refund',
        'products.view',
        'products.manage',
        'categories.manage',
        'settings.view',
        'settings.manage',
        'operations.manage',
        'reports.view',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const admin of adminUsers) {
    await saveDocument('adminUsers', admin.id, admin, token);
    console.log(`  ✓ Admin user created: ${admin.displayName} (${admin.email})`);
  }

  // 5. Seed Offers
  console.log(`\n🏷️ Seeding Offers (offers collection)...`);
  const offers = [
    {
      id: 'offer_fat_duo',
      title: { ar: 'عرض دبل فات بير', en: 'Fat Burger Duo Offer' },
      description: {
        ar: 'اطلب 2 ساندوتش فات بير واحصل على فرايز كب صوص ولتر كولا مجاناً',
        en: 'Order 2 Fat Burgers and get a cheese fries cup + 1L drink free',
      },
      code: 'FATDUO',
      discountType: 'percentage',
      discountValue: 15,
      badgeText: { ar: 'وفر 15%', en: 'Save 15%' },
      isActive: true,
      imageUrl: '/hero_burger_perfect.png',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const offer of offers) {
    await saveDocument('offers', offer.id, offer, token);
    console.log(`  ✓ Offer created: ${offer.title.ar} (${offer.id})`);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 SUCCESS: Firestore Database Fully Initialized!`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error('\n❌ Seeding Failed:', err);
  process.exit(1);
});

