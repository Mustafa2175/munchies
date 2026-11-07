/**
 * @module lib/validators
 * @description Zod validation schemas for forms across the platform.
 */

import { z } from 'zod';

// Egyptian phone number regex: starts with 010, 011, 012, 015 followed by 8 digits
const EGYPT_PHONE_REGEX = /^(010|011|012|015)[0-9]{8}$/;

export const registerSchema = z
  .object({
    fullName: z.string().min(3, 'Full name must be at least 3 characters'),
    mobile: z.string().regex(EGYPT_PHONE_REGEX, 'Please enter a valid Egyptian mobile number (e.g. 01012345678)'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().regex(EGYPT_PHONE_REGEX, 'Valid mobile number required'),
  email: z.string().email('Valid email required'),
  orderType: z.enum(['pickup', 'delivery']),
  deliveryAddress: z
    .object({
      area: z.string().min(1, 'Area is required'),
      street: z.string().min(1, 'Street is required'),
      building: z.string().min(1, 'Building number is required'),
      floor: z.string().optional(),
      apartment: z.string().optional(),
      landmark: z.string().optional(),
    })
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

