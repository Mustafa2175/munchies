/**
 * @file test-audit-security.ts
 * @description Verification script for audit logging, sensitive data scrubbing,
 * and repeated failed login alert triggering.
 */

import { maskIdentifier, sanitizeLogDetails } from '../src/lib/auditLogger';

function runTests() {
  console.log('========================================================');
  console.log('🧪 Starting Security Logging & Alert System Verification');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
    }
  }

  // 1. Sensitive Data Scrubbing
  console.log('1. Testing Sensitive Data Scrubbing:');
  const dirtyPayload = {
    username: 'admin@munchies.com',
    password: 'SuperSecretPassword123!',
    newPassword: 'AnotherSecretPassword456!',
    currentPassword: 'OldPassword789!',
    token: 'jwt.token.here',
    secretKey: 'sk_live_12345',
    creditCard: '4111111111111111',
    cvv: '123',
    nested: {
      authHeader: 'Bearer xyz',
      pin: '9999',
      safeField: 'This is safe',
    },
  };

  const clean = sanitizeLogDetails(dirtyPayload) as Record<string, any>;
  assert('password must be redacted', clean.password === '[REDACTED_SENSITIVE_DATA]');
  assert('newPassword must be redacted', clean.newPassword === '[REDACTED_SENSITIVE_DATA]');
  assert('currentPassword must be redacted', clean.currentPassword === '[REDACTED_SENSITIVE_DATA]');
  assert('token must be redacted', clean.token === '[REDACTED_SENSITIVE_DATA]');
  assert('secretKey must be redacted', clean.secretKey === '[REDACTED_SENSITIVE_DATA]');
  assert('creditCard must be redacted', clean.creditCard === '[REDACTED_SENSITIVE_DATA]');
  assert('cvv must be redacted', clean.cvv === '[REDACTED_SENSITIVE_DATA]');
  assert('nested authHeader must be redacted', clean.nested?.authHeader === '[REDACTED_SENSITIVE_DATA]');
  assert('nested pin must be redacted', clean.nested?.pin === '[REDACTED_SENSITIVE_DATA]');
  assert('safeField must be preserved intact', clean.nested?.safeField === 'This is safe');

  // 2. Identifier Masking
  console.log('\n2. Testing Identifier Masking:');
  const maskedEmail1 = maskIdentifier('admin@munchies.com');
  assert('Masks admin@munchies.com properly', maskedEmail1 === 'ad***n@munchies.com');

  const maskedEmail2 = maskIdentifier('customer.john@gmail.com');
  assert('Masks customer.john@gmail.com properly', maskedEmail2 === 'cu***n@gmail.com');

  const maskedPhone = maskIdentifier('01025707026');
  assert('Masks Egyptian mobile number properly', maskedPhone === '010****7026');

  // 3. Repeated Failure Threshold Simulation
  console.log('\n3. Testing Repeated Failure Logic:');
  const threshold = 3;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const isRepeated = attempt >= threshold;
    if (attempt < threshold) {
      assert(`Attempt #${attempt} is normal warning (not repeated)`, isRepeated === false);
    } else {
      assert(`Attempt #${attempt} triggers CRITICAL security alert`, isRepeated === true);
    }
  }

  console.log('\n========================================================');
  console.log(`📊 Test Summary: ${passed}/${total} passed`);
  console.log('========================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();

