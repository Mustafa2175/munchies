/**
 * @module pages/auth/RegisterPage
 * @description Customer registration page without OTP (email/password + full name + normalized Egyptian mobile).
 * Supports Arabic RTL and English LTR, password requirements indicator, redirect preservation,
 * and safe recovery if Auth account creation succeeded but Firestore profile save failed.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { User, Phone, Mail, Lock, UserPlus, Eye, EyeOff, AlertCircle, Check, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { mapAuthError } from '@/lib/authErrors';
import { getPasswordChecks, validateRegistrationFields } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { ROUTES, getSafeRedirectPath } from '@/config/routes';

export const RegisterPage: React.FC = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en' : 'ar';
  const isEn = locale === 'en';

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const register = useAuthStore((state) => state.register);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const needsProfileRecovery = useAuthStore((state) => state.needsProfileRecovery);
  const pendingRegistrationProfile = useAuthStore((state) => state.pendingRegistrationProfile);

  const [fullName, setFullName] = useState(pendingRegistrationProfile?.fullName || '');
  const [phone, setPhone] = useState(pendingRegistrationProfile?.phone || '');
  const [email, setEmail] = useState(pendingRegistrationProfile?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const redirectParam = searchParams.get('redirect');
  const stateFrom = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const fallbackFromState = stateFrom?.pathname ? `${stateFrom.pathname}${stateFrom.search || ''}` : null;
  const targetRedirect = getSafeRedirectPath(redirectParam || fallbackFromState, ROUTES.HOME);
  const querySuffix = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : '';

  const pwdChecks = getPasswordChecks(password);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors = validateRegistrationFields(
      { fullName, phone, email, password, confirmPassword },
      locale
    );
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await register({
        fullName,
        phone,
        email,
        password,
      });

      toast.success(
        isEn ? "Welcome to Munchie's! Your account is ready." : 'أهلاً بيك في مانشيز! تم إنشاء حسابك بنجاح'
      );
      navigate(targetRedirect, { replace: true });
    } catch (err: unknown) {
      setFormError(mapAuthError(err, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setFormError(null);
    setIsGoogleSubmitting(true);
    try {
      const result = await loginWithGoogle(true);
      toast.success(
        result.isNewAccount
          ? isEn
            ? "Welcome to Munchie's! Your Google account has been created."
            : 'أهلاً بيك في مانشيز! تم إنشاء حسابك باستخدام جوجل بنجاح'
          : isEn
          ? "Signed in with your existing Munchie's account!"
          : 'تم تسجيل دخولك بحساب جوجل بنجاح!'
      );
      navigate(targetRedirect, { replace: true });
    } catch (err: unknown) {
      setFormError(mapAuthError(err, locale));
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-black text-dark">
          {isEn ? 'Create Account' : 'إنشاء حساب جديد'}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {isEn
            ? 'Create your account in seconds with no OTP required'
            : 'اعمل حسابك في ثواني بدون كود تأكيد OTP واطلب على طول'}
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-danger-light border border-danger/25 text-danger text-xs font-semibold flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{formError}</span>
        </div>
      )}

      {needsProfileRecovery && !formError && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
          <span className="leading-relaxed">
            {isEn
              ? 'Your account login was created. Submit the form to finish saving your profile.'
              : 'تم إنشاء بيانات الدخول الخاصة بك. اضغط على الزر لإكمال حفظ ملفك الشخصي.'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <Input
          id="register-fullname"
          label={isEn ? 'Full Name' : 'الاسم بالكامل'}
          leftIcon={User}
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            clearFieldError('fullName');
          }}
          placeholder={isEn ? 'e.g. Ahmed Mohamed' : 'اكتب اسمك بالكامل'}
          autoComplete="name"
          error={fieldErrors.fullName}
          disabled={isSubmitting}
          required
        />

        <Input
          id="register-phone"
          label={isEn ? 'Phone Number' : 'رقم الموبايل'}
          type="tel"
          leftIcon={Phone}
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearFieldError('phone');
          }}
          placeholder="01012345678"
          autoComplete="tel"
          error={fieldErrors.phone}
          helperText={
            isEn
              ? 'Egyptian mobile number (010, 011, 012, or 015)'
              : 'رقم موبايل مصري (يبدأ بـ 010 أو 011 أو 012 أو 015)'
          }
          disabled={isSubmitting}
          className="number-ltr tabular-nums"
          dir="ltr"
          required
        />

        <Input
          id="register-email"
          label={isEn ? 'Email Address' : 'البريد الإلكتروني'}
          type="email"
          leftIcon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          placeholder="name@example.com"
          autoComplete="email"
          error={fieldErrors.email}
          disabled={isSubmitting}
          dir="ltr"
          required
        />

        <div className="space-y-2">
          <Input
            id="register-password"
            label={isEn ? 'Password' : 'كلمة المرور'}
            type={showPassword ? 'text' : 'password'}
            leftIcon={Lock}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError('password');
            }}
            placeholder="••••••••"
            autoComplete="new-password"
            error={fieldErrors.password}
            disabled={isSubmitting}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary transition-colors cursor-pointer"
                aria-label={
                  showPassword
                    ? isEn
                      ? 'Hide password'
                      : 'إخفاء كلمة المرور'
                    : isEn
                    ? 'Show password'
                    : 'إظهار كلمة المرور'
                }
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {/* Clear Password Requirements */}
          <div className="rounded-xl bg-[#F5F3F7] px-3 py-2.5 space-y-1 text-[11px]">
            <p className="font-bold text-dark mb-1">
              {isEn ? 'Password requirements:' : 'شروط كلمة المرور:'}
            </p>
            <div className="flex items-center gap-1.5">
              {pwdChecks.minLength ? (
                <Check className="w-3.5 h-3.5 text-success shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-medium-gray shrink-0" />
              )}
              <span className={pwdChecks.minLength ? 'text-success font-semibold' : 'text-gray-600'}>
                {isEn ? 'At least 8 characters' : '8 أحرف على الأقل'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {pwdChecks.hasLetter ? (
                <Check className="w-3.5 h-3.5 text-success shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-medium-gray shrink-0" />
              )}
              <span className={pwdChecks.hasLetter ? 'text-success font-semibold' : 'text-gray-600'}>
                {isEn ? 'Contains at least one letter' : 'تحتوي على حرف واحد على الأقل'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {pwdChecks.hasNumber ? (
                <Check className="w-3.5 h-3.5 text-success shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-medium-gray shrink-0" />
              )}
              <span className={pwdChecks.hasNumber ? 'text-success font-semibold' : 'text-gray-600'}>
                {isEn ? 'Contains at least one number' : 'تحتوي على رقم واحد على الأقل'}
              </span>
            </div>
          </div>
        </div>

        <Input
          id="register-confirm-password"
          label={isEn ? 'Confirm Password' : 'تأكيد كلمة المرور'}
          type={showConfirmPassword ? 'text' : 'password'}
          leftIcon={Lock}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            clearFieldError('confirmPassword');
          }}
          placeholder="••••••••"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
          disabled={isSubmitting}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary transition-colors cursor-pointer"
              aria-label={
                showConfirmPassword
                  ? isEn
                    ? 'Hide confirm password'
                    : 'إخفاء تأكيد كلمة المرور'
                  : isEn
                  ? 'Show confirm password'
                  : 'إظهار تأكيد كلمة المرور'
              }
              disabled={isSubmitting}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <Button
          type="submit"
          variant="yellow"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={isSubmitting || isGoogleSubmitting}
          leftIcon={UserPlus}
          className="font-black mt-2"
        >
          {isSubmitting
            ? isEn
              ? 'Creating account...'
              : 'جاري إنشاء الحساب...'
            : needsProfileRecovery
            ? isEn
              ? 'Complete Registration'
              : 'إكمال حفظ الحساب'
            : isEn
            ? 'Create Account'
            : 'إنشاء الحساب'}
        </Button>
      </form>

      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] font-bold text-medium-gray uppercase">
          {isEn ? 'OR' : 'أو'}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <GoogleAuthButton
        mode="register"
        isEn={isEn}
        isLoading={isGoogleSubmitting}
        disabled={isSubmitting}
        onClick={handleGoogleSignUp}
      />

      <div className="text-center text-xs text-gray-500 pt-3 border-t border-border">
        <span>{isEn ? 'Already have an account? ' : 'عندك حساب بالفعل؟ '}</span>
        <Link
          to={`${ROUTES.LOGIN}${querySuffix}`}
          className="text-[#512080] font-bold hover:underline"
        >
          {isEn ? 'Sign In' : 'تسجيل الدخول'}
        </Link>
      </div>
    </div>
  );
};
