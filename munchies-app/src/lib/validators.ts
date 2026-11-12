/**
 * @module lib/validators
 * @description Normalization helpers and bilingual Zod validation schemas for Munchie's forms.
 */

import { z } from 'zod';

// Egyptian phone number regex: starts with 010, 011, 012, 015 followed by 8 digits
export const EGYPT_PHONE_REGEX = /^(010|011|012|015)[0-9]{8}$/;

/**
 * Converts Arabic-Indic (٠-٩) and Eastern Arabic (۰-۹) digits to ASCII 0-9.
 */
export function normalizeArabicDigits(value: string): string {
  return String(value || '')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * Trims and collapses repeated whitespace in customer names.
 */
export function normalizeFullName(value: string): string {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

/**
 * Normalizes email addresses consistently (trimmed and lowercased).
 */
export function normalizeEmail(value: string): string {
  return String(value || '').trim().toLowerCase();
}

/**
 * Normalizes Egyptian mobile numbers to 11-digit local format `01XXXXXXXXX`.
 * Supports inputs with spaces, dashes, Arabic digits, `+20`, `0020`, or `20` prefixes.
 */
export function normalizeEgyptianPhone(value: string): string {
  const ascii = normalizeArabicDigits(value);
  let digits = ascii.replace(/[\s\-().+]/g, '');

  if (digits.startsWith('0020') && digits.length === 14) {
    digits = `0${digits.slice(4)}`;
  } else if (digits.startsWith('20') && digits.length === 12) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = `0${digits}`;
  }

  return digits;
}

export function isValidEgyptianPhone(value: string): boolean {
  return EGYPT_PHONE_REGEX.test(normalizeEgyptianPhone(value));
}

export function isValidEmail(value: string): boolean {
  return z.string().email().safeParse(normalizeEmail(value)).success;
}

export function isValidFullName(value: string): boolean {
  const normalized = normalizeFullName(value);
  return normalized.length >= 3 && normalized.length <= 80;
}

export interface PasswordStrengthChecks {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

export function getPasswordChecks(password: string): PasswordStrengthChecks {
  const minLength = password.length >= 8;
  const hasLetter = /[A-Za-z\u0600-\u06FF]/.test(password);
  const hasNumber = /[0-9\u0660-\u0669]/.test(password);
  return {
    minLength,
    hasLetter,
    hasNumber,
    isValid: minLength && hasLetter && hasNumber,
  };
}

export function validateRegistrationFields(
  input: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
  },
  locale: 'ar' | 'en' = 'ar'
): Record<string, string> {
  const errors: Record<string, string> = {};
  const ar = locale === 'ar';

  const cleanName = normalizeFullName(input.fullName);
  if (!cleanName) {
    errors.fullName = ar ? 'الاسم بالكامل مطلوب' : 'Full name is required';
  } else if (cleanName.length < 3) {
    errors.fullName = ar
      ? 'الاسم بالكامل يجب أن يكون 3 أحرف على الأقل'
      : 'Full name must be at least 3 characters';
  } else if (cleanName.length > 80) {
    errors.fullName = ar
      ? 'الاسم بالكامل طويل جداً (الحد الأقصى 80 حرفاً)'
      : 'Full name must not exceed 80 characters';
  }

  const cleanPhone = normalizeEgyptianPhone(input.phone);
  if (!input.phone.trim()) {
    errors.phone = ar ? 'رقم الموبايل مطلوب' : 'Mobile number is required';
  } else if (!EGYPT_PHONE_REGEX.test(cleanPhone)) {
    errors.phone = ar
      ? 'من فضلك أدخل رقم موبايل مصري صحيح (مثال: 01012345678)'
      : 'Please enter a valid Egyptian mobile number (e.g. 01012345678)';
  }

  const cleanEmail = normalizeEmail(input.email);
  if (!cleanEmail) {
    errors.email = ar ? 'البريد الإلكتروني مطلوب' : 'Email address is required';
  } else if (!isValidEmail(cleanEmail)) {
    errors.email = ar
      ? 'صيغة البريد الإلكتروني غير صحيحة'
      : 'Please enter a valid email address';
  }

  const pwdChecks = getPasswordChecks(input.password);
  if (!input.password) {
    errors.password = ar ? 'كلمة المرور مطلوبة' : 'Password is required';
  } else if (!pwdChecks.isValid) {
    errors.password = ar
      ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف ورقم'
      : 'Password must be at least 8 characters and include a letter and a number';
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = ar ? 'تأكيد كلمة المرور مطلوب' : 'Please confirm your password';
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = ar
      ? 'كلمة المرور وتأكيد كلمة المرور غير متطابقين'
      : 'Passwords do not match';
  }

  return errors;
}

export function validateProfileFields(
  input: { fullName: string; phone: string },
  locale: 'ar' | 'en' = 'ar'
): Record<string, string> {
  const errors: Record<string, string> = {};
  const ar = locale === 'ar';

  const cleanName = normalizeFullName(input.fullName);
  if (!cleanName) {
    errors.fullName = ar ? 'الاسم بالكامل مطلوب' : 'Full name is required';
  } else if (cleanName.length < 3 || cleanName.length > 80) {
    errors.fullName = ar
      ? 'الاسم بالكامل يجب أن يكون بين 3 و 80 حرفاً'
      : 'Full name must be between 3 and 80 characters';
  }

  const cleanPhone = normalizeEgyptianPhone(input.phone);
  if (!input.phone.trim()) {
    errors.phone = ar ? 'رقم الموبايل مطلوب' : 'Mobile number is required';
  } else if (!EGYPT_PHONE_REGEX.test(cleanPhone)) {
    errors.phone = ar
      ? 'من فضلك أدخل رقم موبايل مصري صحيح (مثال: 01012345678)'
      : 'Please enter a valid Egyptian mobile number (e.g. 01012345678)';
  }

  return errors;
}

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Full name must be at least 3 characters').max(80),
    mobile: z
      .string()
      .transform(normalizeEgyptianPhone)
      .refine((v) => EGYPT_PHONE_REGEX.test(v), 'Please enter a valid Egyptian mobile number (e.g. 01012345678)'),
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  phone: z
    .string()
    .transform(normalizeEgyptianPhone)
    .refine((v) => EGYPT_PHONE_REGEX.test(v), 'Valid mobile number required'),
  email: z.string().email('Valid email required'),
  orderType: z.enum(['pickup', 'delivery']),
  deliveryAddress: z
    .union([
      z.string().trim().min(5, 'Address is required'),
      z.object({
        area: z.string().optional(),
        street: z.string().min(1, 'Street is required'),
        building: z.string().optional(),
        floor: z.string().optional(),
        apartment: z.string().optional(),
        landmark: z.string().optional(),
      }),
    ])
    .optional(),
  paymentMethod: z.literal('cash'),
  specialInstructions: z.string().max(200, 'Max 200 characters').optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const productSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  descriptionAr: z.string().min(1, 'Arabic description is required'),
  descriptionEn: z.string().min(1, 'English description is required'),
  price: z.number().min(0, 'Price must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  image: z.string().url('Image URL required').or(z.string().min(1)),
  isAvailable: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

export type ProductFormValues = z.infer<typeof productSchema>;
