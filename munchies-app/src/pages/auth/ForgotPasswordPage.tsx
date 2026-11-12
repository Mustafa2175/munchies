/**
 * @module pages/auth/ForgotPasswordPage
 * @description Firebase password reset recovery form supporting Arabic RTL and English LTR.
 */

import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { extractErrorCode, mapAuthError } from '@/lib/authErrors';
import { isValidEmail, normalizeEmail } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';

export const ForgotPasswordPage: React.FC = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en' : 'ar';
  const isEn = locale === 'en';

  const [searchParams] = useSearchParams();
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const redirectParam = searchParams.get('redirect');
  const querySuffix = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      setFieldError(isEn ? 'Email address is required' : 'البريد الإلكتروني مطلوب');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setFieldError(isEn ? 'Please enter a valid email address' : 'صيغة البريد الإلكتروني غير صحيحة');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(cleanEmail);
      setIsSent(true);
      toast.success(
        isEn
          ? 'Password reset email sent! Check your inbox.'
          : 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني'
      );
    } catch (err: unknown) {
      const code = extractErrorCode(err);
      // Avoid account enumeration while still surfacing rate limits, invalid email, or network failures
      if (code === 'auth/user-not-found') {
        setIsSent(true);
      } else {
        setFormError(mapAuthError(err, locale));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-11 h-11 rounded-2xl bg-[#512080]/10 text-[#512080] flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-dark">
          {isEn ? 'Reset Password' : 'نسيت كلمة المرور؟'}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {isEn
            ? "Enter your email address and we'll send you a link to reset your password"
            : 'اكتب بريدك الإلكتروني وهنبعتلك رابط استعادة كلمة المرور في ثواني'}
        </p>
      </div>

      {isSent ? (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
          <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm text-emerald-900 font-black">
              {isEn ? 'Check your email' : 'راجع بريدك الإلكتروني'}
            </p>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {isEn
                ? `If an account exists for ${normalizeEmail(email)}, you will receive a password reset link shortly.`
                : `إذا كان هناك حساب مسجل بالبريد ${normalizeEmail(email)}، ستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور خلال لحظات.`}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <Link to={`${ROUTES.LOGIN}${querySuffix}`}>
              <Button size="md" variant="primary" fullWidth className="font-bold">
                {isEn ? 'Back to Sign In' : 'العودة لتسجيل الدخول'}
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsSent(false);
                setFormError(null);
              }}
              className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer py-1"
            >
              {isEn ? 'Try another email' : 'تجربة بريد إلكتروني آخر'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {formError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-danger-light border border-danger/25 text-danger text-xs font-semibold flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="forgot-email"
              label={isEn ? 'Email Address' : 'البريد الإلكتروني'}
              type="email"
              leftIcon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError(undefined);
                if (formError) setFormError(null);
              }}
              placeholder="name@example.com"
              autoComplete="email"
              error={fieldError}
              disabled={isSubmitting}
              dir="ltr"
              required
            />

            <Button
              type="submit"
              variant="yellow"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              disabled={isSubmitting}
              leftIcon={KeyRound}
              className="font-black"
            >
              {isSubmitting
                ? isEn
                  ? 'Sending...'
                  : 'جاري الإرسال...'
                : isEn
                ? 'Send Reset Link'
                : 'إرسال رابط الاستعادة'}
            </Button>
          </form>
        </>
      )}

      <div className="text-center pt-2 border-t border-border">
        <Link
          to={`${ROUTES.LOGIN}${querySuffix}`}
          className="inline-flex items-center gap-1.5 text-xs text-[#512080] font-bold hover:underline"
        >
          <ArrowRight className={`w-4 h-4 ${isEn ? 'rotate-180' : ''}`} />
          <span>{isEn ? 'Back to Sign In' : 'العودة لتسجيل الدخول'}</span>
        </Link>
      </div>
    </div>
  );
};
