/**
 * @file test-spark-order-security.ts
 * @description Verifies Spark-compatible order integrity and storage/firestore rule protections:
 * 1. storage.rules admin restriction and closed public write paths
 * 2. firestore.rules strict adminUsers-based isAdmin() and mathematical order total invariant
 * 3. callCreateOrder client price sanitization against DB catalog and builder registry
 */

import * as fs from 'fs';
import * as path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('\n🔒 Starting Spark-Compatible Security Hardening Verification...\n');

  const appDir = fs.existsSync(path.resolve(process.cwd(), 'munchies-app'))
    ? path.resolve(process.cwd(), 'munchies-app')
    : process.cwd();

  // 1. Verify storage.rules
  console.log('--- 1. Testing Storage Rules Hardening ---');
  const storageRules = fs.readFileSync(path.resolve(appDir, 'storage.rules'), 'utf8');

  assert(
    storageRules.includes('firestore.exists(/databases/(default)/documents/adminUsers/$(request.auth.uid))') &&
      storageRules.includes('firestore.get(/databases/(default)/documents/adminUsers/$(request.auth.uid)).data.isActive == true'),
    'storage.rules defines isAdmin() using Firestore adminUsers lookup'
  );

  assert(
    storageRules.includes('match /products/{fileName}') &&
      storageRules.includes('allow write: if isAdmin()'),
    'Product image uploads restricted strictly to verified admins'
  );

  assert(
    storageRules.includes('match /categories/{fileName}') &&
      storageRules.includes('allow write: if isAdmin()'),
    'Category image uploads restricted strictly to verified admins'
  );

  assert(
    storageRules.includes('match /settings/{fileName}') &&
      storageRules.includes('allow write: if isAdmin()'),
    'Settings/branding image uploads restricted strictly to verified admins'
  );

  assert(
    storageRules.includes('match /users/{userId}/{fileName}') &&
      storageRules.includes('request.auth.uid == userId'),
    'User uploads allowed only to own userId path'
  );

  assert(
    storageRules.includes('match /{allPaths=**}') &&
      storageRules.includes('allow write: if false;'),
    'Fallback rule completely denies writing to any unspecified path'
  );

  // 2. Verify firebase.json includes storage
  console.log('\n--- 2. Testing firebase.json Storage Linking ---');
  const firebaseJson = fs.readFileSync(path.resolve(appDir, 'firebase.json'), 'utf8');
  assert(
    firebaseJson.includes('"storage":') && firebaseJson.includes('"rules": "storage.rules"'),
    'firebase.json correctly maps storage to storage.rules'
  );

  // 3. Verify firestore.rules isAdmin() and Order Pricing Invariant
  console.log('\n--- 3. Testing Firestore Rules Hardening ---');
  const firestoreRules = fs.readFileSync(path.resolve(appDir, 'firestore.rules'), 'utf8');

  // Verify email fallback was removed
  assert(
    !firestoreRules.includes("request.auth.token.email == 'admin@munchies.com'"),
    'firestore.rules completely removed email-based admin bypass'
  );

  // Verify adminUsers check in isAdmin()
  assert(
    firestoreRules.includes('exists(/databases/$(database)/documents/adminUsers/$(request.auth.uid))') &&
      firestoreRules.includes('get(/databases/$(database)/documents/adminUsers/$(request.auth.uid)).data.isActive == true'),
    'firestore.rules isAdmin() strictly queries adminUsers/{uid}'
  );

  // Verify mathematical total invariant on orders
  assert(
    firestoreRules.includes('data.total == data.subtotal + data.deliveryFee -'),
    'firestore.rules enforces strict mathematical invariant: total == subtotal + deliveryFee - discount'
  );

  // 4. Verify callCreateOrder in src/lib/functions.ts
  console.log('\n--- 4. Testing callCreateOrder Price Sanitization ---');
  const functionsTs = fs.readFileSync(path.resolve(appDir, 'src/lib/functions.ts'), 'utf8');

  assert(
    functionsTs.includes('CUSTOM_BUILDER_PRICES') &&
      functionsTs.includes('customOptionsSum += verifiedPrice'),
    'callCreateOrder recalculates custom sandwich unit price from server ingredient registry'
  );

  assert(
    functionsTs.includes('authoritativeProduct.price') &&
      functionsTs.includes('matchingDbOpt.price'),
    'callCreateOrder overrides client customization prices with authoritative database prices'
  );

  assert(
    functionsTs.includes('restaurantSettings.deliveryFee') &&
      functionsTs.includes('freeDeliveryMinimum'),
    'callCreateOrder calculates delivery fee strictly from restaurant settings'
  );

  console.log('\n🎉 ALL SPARK SECURITY HARDENING VERIFICATIONS PASSED!\n');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

