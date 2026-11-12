/**
 * @module lib/auditLogger
 * @description Centralized security and administrative audit logging utility.
 * Guarantees that no passwords, session tokens, or sensitive credentials are ever logged.
 * Automatically detects and flags repeated failed login attempts with security alerts.
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '../config/firebase';
import type { AuditAction, AuditSeverity } from '../types/admin';

// Patterns for keys that must be stripped before logging
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

/**
 * Masks an email or phone number to prevent full PII exposure in audit streams.
 * E.g. "ahmed.ali@example.com" -> "ah***i@example.com"
 */
export function maskIdentifier(identifier?: string | null): string {
  if (!identifier || typeof identifier !== 'string') return 'anonymous';
  const clean = identifier.trim();

  // Egyptian mobile phone
  if (/^01[0125][0-9]{8}$/.test(clean)) {
    return `${clean.slice(0, 3)}****${clean.slice(-4)}`;
  }

  // Email address
  if (clean.includes('@')) {
    const [name, domain] = clean.split('@');
    if (!domain) return 'masked-user';
    if (name.length <= 2) {
      return `${name[0] || '*'}***@${domain}`;
    }
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
  }

  if (clean.length > 4) {
    return `${clean.slice(0, 2)}***${clean.slice(-2)}`;
  }
  return 'masked-user';
}

/**
 * Deeply scrubs sensitive keys (passwords, tokens, credentials) from an object.
 */
export function sanitizeLogDetails(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[Truncated]';
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.slice(0, 20).map((item) => sanitizeLogDetails(item, depth + 1));
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERNS.some((p) => p.test(key))) {
      clean[key] = '[REDACTED_SENSITIVE_DATA]';
      continue;
    }
    clean[key] = sanitizeLogDetails(value, depth + 1);
  }
  return clean;
}

// Local storage session key for client-side failed attempt tracker
const FAILED_LOGIN_STORAGE_PREFIX = 'munchies_fail_login_';

function getLocalFailedAttempts(key: string): { count: number; lastTime: number } {
  try {
    const raw = sessionStorage.getItem(`${FAILED_LOGIN_STORAGE_PREFIX}${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.lastTime < 15 * 60 * 1000) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return { count: 0, lastTime: Date.now() };
}

function incrementLocalFailedAttempts(key: string): number {
  const current = getLocalFailedAttempts(key);
  const nextCount = current.count + 1;
  try {
    sessionStorage.setItem(
      `${FAILED_LOGIN_STORAGE_PREFIX}${key}`,
      JSON.stringify({ count: nextCount, lastTime: Date.now() })
    );
  } catch {
    // ignore
  }
  return nextCount;
}

export function clearLocalFailedAttempts(key: string): void {
  try {
    sessionStorage.removeItem(`${FAILED_LOGIN_STORAGE_PREFIX}${key}`);
  } catch {
    // ignore
  }
}

/**
 * Records a failed login attempt, updates the security tracker, and triggers
 * an alert if consecutive failed attempts reach or exceed the threshold (3+).
 */
export async function logFailedLogin(
  identifier: string,
  errorCode?: string
): Promise<{ isRepeatedAlert: boolean; attemptsCount: number; alertMessage?: string }> {
  const cleanId = (identifier || 'anonymous').trim().toLowerCase();
  const maskedId = maskIdentifier(cleanId);
  const localCount = incrementLocalFailedAttempts(cleanId);
  const isRepeated = localCount >= 3;

  // Attempt server-side recording via Cloud Functions
  try {
    if (functions) {
      const recordFn = httpsCallable<
        {
          eventType: string;
          identifier: string;
          errorCode?: string;
        },
        {
          success: boolean;
          isRepeatedAlert: boolean;
          attemptsCount: number;
          alertMessage?: string;
        }
      >(functions, 'recordSecurityEvent');

      const res = await recordFn({
        eventType: 'failed_login',
        identifier: cleanId,
        errorCode: errorCode || 'auth/invalid-credential',
      });

      return {
        isRepeatedAlert: res.data.isRepeatedAlert || isRepeated,
        attemptsCount: res.data.attemptsCount || localCount,
        alertMessage:
          res.data.alertMessage ||
          (isRepeated
            ? `تنبيه أمني: رصد محاولات دخول فاشلة متكررة (${localCount} محاولات). تم توثيق هذا النشاط في سجل الأمان.`
            : undefined),
      };
    }
  } catch (err) {
    console.warn('Could not record security event on server, fell back to local audit tracking:', err);
  }

  // Graceful fallback: log to console without sensitive info
  console.warn(`[FAILED_LOGIN_RECORDED] Account: ${maskedId}, Attempts: ${localCount}, Code: ${errorCode || 'unknown'}`);

  return {
    isRepeatedAlert: isRepeated,
    attemptsCount: localCount,
    alertMessage: isRepeated
      ? `تنبيه أمني: رصد ${localCount} محاولات دخول فاشلة متكررة لهذا الحساب. يُرجى التأكد من صحة البيانات أو استعادة كلمة المرور.`
      : undefined,
  };
}

/**
 * Records a password change event without any passwords or tokens.
 */
export async function logPasswordChange(email?: string): Promise<void> {
  const maskedId = maskIdentifier(email || auth?.currentUser?.email);

  try {
    if (functions) {
      const recordFn = httpsCallable(functions, 'recordSecurityEvent');
      await recordFn({
        eventType: 'password_change',
        identifier: email || auth?.currentUser?.email || '',
      });
      return;
    }
  } catch (err) {
    console.warn('Could not record password change via Cloud Function:', err);
  }

  console.info(`[AUDIT] Password changed successfully for ${maskedId}`);
}

/**
 * Records a password reset request without credentials.
 */
export async function logPasswordResetRequest(email: string): Promise<void> {
  const maskedId = maskIdentifier(email);

  try {
    if (functions) {
      const recordFn = httpsCallable(functions, 'recordSecurityEvent');
      await recordFn({
        eventType: 'password_reset_request',
        identifier: email,
      });
      return;
    }
  } catch (err) {
    console.warn('Could not record password reset request via Cloud Function:', err);
  }

  console.info(`[AUDIT] Password reset requested for ${maskedId}`);
}

/**
 * Records an administrative action (product/category/settings update, manual order override).
 * Can write directly to Firestore `auditLogs` collection (authorized for admins).
 */
export async function logAdminAction(
  action: AuditAction,
  targetCollection: string,
  targetId: string,
  summary: string,
  details?: Record<string, unknown>,
  severity: AuditSeverity = 'INFO'
): Promise<void> {
  const currentUser = auth?.currentUser;
  const actorId = currentUser?.uid || 'admin';
  const actorName = currentUser?.displayName || currentUser?.email || 'مسؤول مانشيز';
  const cleanDetails = details ? (sanitizeLogDetails(details) as Record<string, unknown>) : {};

  const logEntry = {
    action,
    actorId,
    actorName,
    actorRole: 'admin',
    targetCollection,
    targetId,
    summary,
    details: cleanDetails,
    severity,
    isAlert: severity === 'CRITICAL',
    timestamp: serverTimestamp(),
    createdAt: new Date().toISOString(),
  };

  try {
    if (db) {
      await addDoc(collection(db, 'auditLogs'), logEntry);
      return;
    }
  } catch (err) {
    // If client write is rejected or offline, attempt via Cloud Function
    try {
      if (functions) {
        const recordFn = httpsCallable(functions, 'recordSecurityEvent');
        await recordFn({
          eventType: 'admin_action',
          targetCollection,
          targetId,
          summary,
          details: { action, ...cleanDetails },
        });
        return;
      }
    } catch {
      // Ignore
    }
  }

  console.info(`[ADMIN_ACTION] ${summary} (${action} on ${targetCollection}/${targetId})`);
}
