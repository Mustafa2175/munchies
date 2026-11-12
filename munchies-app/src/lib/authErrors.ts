/**
 * @module lib/authErrors
 * @description Maps Firebase Auth, Firestore, and custom auth error codes to user-friendly Arabic and English messages.
 * Never exposes raw Firebase error strings to customers.
 */

export type AuthLocale = 'ar' | 'en';

interface LocalizedErrorEntry {
  ar: string;
  en: string;
}

const ERROR_MESSAGES: Record<string, LocalizedErrorEntry> = {
  'auth/invalid-credential': {
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    en: 'Incorrect email or password.',
  },
  'auth/invalid-login-credentials': {
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    en: 'Incorrect email or password.',
  },
  'auth/wrong-password': {
    ar: 'كلمة المرور غير صحيحة.',
    en: 'Incorrect password.',
  },
  'auth/user-not-found': {
    ar: 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.',
    en: 'No account found with this email address.',
  },
  'auth/invalid-email': {
    ar: 'صيغة البريد الإلكتروني غير صحيحة.',
    en: 'Please enter a valid email address.',
  },
  'auth/email-already-in-use': {
    ar: 'هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول أو استعادة كلمة المرور.',
    en: 'This email address is already registered. Please sign in or reset your password.',
  },
  'auth/weak-password': {
    ar: 'كلمة المرور ضعيفة جداً. يجب أن تتكون من 8 أحرف على الأقل وتتضمن حرفاً ورقماً.',
    en: 'Password is too weak. Please use at least 8 characters with letters and numbers.',
  },
  'auth/too-many-requests': {
    ar: 'تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.',
    en: 'Too many failed attempts. Please wait a moment before trying again.',
  },
  'auth/network-request-failed': {
    ar: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
    en: 'Network error. Please check your internet connection and try again.',
  },
  'auth/user-disabled': {
    ar: 'تم تعطيل هذا الحساب. يرجى التواصل مع خدمة العملاء.',
    en: 'This account has been disabled. Please contact support.',
  },
  'auth/requires-recent-login': {
    ar: 'لأسباب أمنية، يرجى تأكيد كلمة المرور الحالية لإتمام هذه العملية.',
    en: 'For security reasons, please re-enter your current password to continue.',
  },
  'auth/operation-not-allowed': {
    ar: 'هذه العملية غير مفعلة حالياً.',
    en: 'This sign-in method is currently disabled.',
  },
  'auth/missing-password': {
    ar: 'يرجى إدخال كلمة المرور.',
    en: 'Please enter your password.',
  },
  'auth/invalid-new-email': {
    ar: 'البريد الإلكتروني الجديد غير صالح.',
    en: 'The new email address is invalid.',
  },
  'auth/popup-closed-by-user': {
    ar: 'تم إغلاق نافذة تسجيل الدخول بجوجل قبل إتمام العملية.',
    en: 'Google sign-in popup was closed before completing.',
  },
  'auth/cancelled-popup-request': {
    ar: 'تم إلغاء الطلب السابق. يرجى المحاولة مرة أخرى.',
    en: 'The previous sign-in request was cancelled. Please try again.',
  },
  'auth/popup-blocked': {
    ar: 'المتصفح منع فتح نافذة جوجل. يرجى السماح بالنوافذ المنبثقة والمحاولة مرة أخرى.',
    en: 'Your browser blocked the Google sign-in popup. Please allow popups and try again.',
  },
  'auth/account-exists-with-different-credential': {
    ar: 'هذا البريد الإلكتروني مسجل بالفعل بطريقة دخول أخرى. يرجى تسجيل الدخول بالبريد وكلمة المرور.',
    en: 'An account already exists with this email using a different sign-in method. Please sign in with email and password.',
  },
  'auth/unauthorized-domain': {
    ar: 'هذا النطاق غير مصرح له بتسجيل الدخول عبر جوجل حالياً.',
    en: 'This domain is not authorized for Google sign-in.',
  },
  'auth/user-cancelled': {
    ar: 'تم إلغاء تسجيل الدخول بحساب جوجل.',
    en: 'Google sign-in was cancelled.',
  },
  'app/missing-email': {
    ar: 'تعذر الحصول على البريد الإلكتروني من حساب جوجل.',
    en: 'Could not retrieve an email address from your Google account.',
  },
  'permission-denied': {
    ar: 'ليس لديك صلاحية لإتمام هذه العملية.',
    en: 'You do not have permission to perform this action.',
  },
  'unavailable': {
    ar: 'الخدمة غير متاحة مؤقتاً. يرجى المحاولة بعد قليل.',
    en: 'Service is temporarily unavailable. Please try again shortly.',
  },
  'app/profile-save-failed': {
    ar: 'تم إنشاء حسابك، لكن حدثت مشكلة في حفظ بياناتك. اضغط على الزر مرة أخرى لإكمال حفظ البيانات دون إنشاء حساب جديد.',
    en: 'Your account was created, but saving your profile failed. Click submit again to finish saving your profile without creating a duplicate account.',
  },
  'app/profile-missing': {
    ar: 'بيانات حسابك غير مكتملة. يرجى إكمال الاسم ورقم الموبايل للمتابعة.',
    en: 'Your profile details are incomplete. Please complete your name and phone number to continue.',
  },
  'app/account-disabled': {
    ar: 'تم تعطيل هذا الحساب. يرجى التواصل مع إدارة مانشيز.',
    en: 'This account has been disabled. Please contact Munchie’s support.',
  },
  'app/unauthenticated': {
    ar: 'يجب تسجيل الدخول أولاً لإتمام هذه العملية.',
    en: 'You must be signed in to perform this action.',
  },
  'app/not-admin': {
    ar: 'هذا الحساب ليس لديه صلاحيات المسؤول للوصول إلى لوحة الإدارة.',
    en: 'This account does not have admin privileges.',
  },
  'app/same-password': {
    ar: 'كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية.',
    en: 'New password must be different from your current password.',
  },
  'app/same-email': {
    ar: 'البريد الإلكتروني الجديد مطابق للبريد الحالي.',
    en: 'The new email is the same as your current email.',
  },
};

const DEFAULT_ERROR: LocalizedErrorEntry = {
  ar: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.',
  en: 'An unexpected error occurred. Please try again.',
};

/**
 * Extracts a known error code from Firebase or custom AuthAppError and maps it to a localized message.
 */
export function mapAuthError(error: unknown, locale: AuthLocale = 'ar'): string {
  const code = extractErrorCode(error);
  const entry = (code && ERROR_MESSAGES[code]) || DEFAULT_ERROR;
  return entry[locale];
}

export function extractErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const errObj = error as { code?: unknown };
  if (typeof errObj.code === 'string') {
    // Firestore codes sometimes come prefixed or unprefixed
    return errObj.code;
  }
  return null;
}

export class AuthAppError extends Error {
  public readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = 'AuthAppError';
    this.code = code;
  }
}

