/**
 * @module pages/auth/LoginPage
 * @description Customer Login page supporting Arabic RTL and English LTR, redirect preservation,
 * persistence toggle, mapped Firebase error handling, and missing-profile recovery.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, User, Phone, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { mapAuthError } from '@/lib/authErrors';
import { isValidEmail, normalizeEmail, validateProfileFields } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { ROUTES, getSafeRedirectPath } from '@/config/routes';

export const LoginPage: React.FC = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en' : 'ar';
  const isEn = locale === 'en';

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const completeProfileRecovery = useAuthStore((state) => state.completeProfileRecovery);
  const logout = useAuthStore((state) => state.logout);
  const needsProfileRecovery = useAuthStore((state) => state.needsProfileRecovery);
  const firebaseUser = useAuthStore((state) => state.firebaseUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Recovery form state (if Firebase Auth account exists without Firestore profile)
  const [recoveryName, setRecoveryName] = useState(firebaseUser?.displayName || '');
  const [recoveryPhone, setRecoveryPhone] = useState('');

  const redirectParam = searchParams.get('redirect');
  const stateFrom = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const fallbackFromState = stateFrom?.pathname ? `${stateFrom.pathname}${stateFrom.search || ''}` : null;
  const targetRedirect = getSafeRedirectPath(redirectParam || fallbackFromState, ROUTES.HOME);
  const querySuffix = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : '';

  const validateLoginForm = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      errors.email = isEn ? 'Email address is required' : 'البريد الإلكتروني مطلوب';
    } else if (!isValidEmail(cleanEmail)) {
      errors.email = isEn ? 'Please enter a valid email address' : 'صيغة البريد الإلكتروني غير صحيحة';
    }

    if (!password) {
      errors.password = isEn ? 'Password is required' : 'كلمة المرور مطلوبة';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateLoginForm()) return;

    setIsSubmitting(true);
    try {
      const result = await login(email, password, rememberMe);

      if (!result.profileExists) {
        setRecoveryName(useAuthStore.getState().firebaseUser?.displayName || '');
        setFormError(
          isEn
            ? 'Your account needs profile details to continue. Please enter your name and mobile number.'
            : 'يرجى إكمال الاسم ورقم الموبايل لإتمام إعداد حسابك.'
        );
        return;
      }

      toast.success(isEn ? "Welcome back to Munchie's!" : 'أهلاً بيك في مانشيز!');
      navigate(targetRedirect, { replace: true });
    } catch (err: unknown) {
      const message = mapAuthError(err, locale);
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors = validateProfileFields(
      { fullName: recoveryName, phone: recoveryPhone },
      locale
    );
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await completeProfileRecovery({
        fullName: recoveryName,
        phone: recoveryPhone,
      });
      toast.success(isEn ? 'Profile completed! Welcome back.' : 'تم حفظ بياناتك بنجاح! أهلاً بيك.');
      navigate(targetRedirect, { replace: true });
    } catch (err: unknown) {
      setFormError(mapAuthError(err, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setIsGoogleSubmitting(true);
    try {
      const result = await loginWithGoogle(rememberMe);
      toast.success(
        result.isNewAccount
          ? isEn
            ? "Welcome to Munchie's! Your Google account is ready."
            : 'تم إنشاء حسابك بجوجل بنجاح! أهلاً بيك في مانشيز'
          : isEn
          ? "Welcome back to Munchie's!"
          : 'أهلاً بيك في مانشيز!'
      );
      navigate(targetRedirect, { replace: true });
    } catch (err: unknown) {
      setFormError(mapAuthError(err, locale));
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  if (needsProfileRecovery && firebaseUser) {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-2xl bg-[#512080]/10 text-[#512080] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-dark">
            {isEn ? 'Complete Your Profile' : 'إكمال بيانات الحساب'}
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            {isEn
              ? `Signed in as ${firebaseUser.email}. Add your name and mobile number to finish setting up your account.`
              : `تم تسجيل الدخول بالبريد ${firebaseUser.email}. أكمل اسمك ورقم موبايلك للمتابعة.`}
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-danger-light border border-danger/25 text-danger text-xs font-semibold flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleRecoverySubmit} className="space-y-4" noValidate>
          <Input
            label={isEn ? 'Full Name' : 'الاسم بالكامل'}
            leftIcon={User}
            value={recoveryName}
            onChange={(e) => {
              setRecoveryName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: '' }));
            }}
            placeholder={isEn ? 'Enter your full name' : 'اكتب اسمك بالكامل'}
            error={fieldErrors.fullName}
            disabled={isSubmitting}
            required
          />

          <Input
            label={isEn ? 'Mobile Number' : 'رقم الموبايل'}
            type="tel"
            leftIcon={Phone}
            value={recoveryPhone}
            onChange={(e) => {
              setRecoveryPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: '' }));
            }}
            placeholder="01012345678"
            error={fieldErrors.phone}
            disabled={isSubmitting}
            className="number-ltr tabular-nums"
            required
          />

          <Button
            type="submit"
            variant="yellow"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="font-black"
          >
            {isEn ? 'Save & Continue' : 'حفظ البيانات والمتابعة'}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => logout()}
            className="text-xs font-bold text-medium-gray hover:text-primary cursor-pointer"
          >
            {isEn ? 'Use a different account' : 'استخدام حساب آخر'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-black text-dark">
          {isEn ? 'Sign In' : 'تسجيل الدخول'}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {isEn
            ? "Sign in to your Munchie's account to order and track your meals"
            : 'سجل دخولك في مانشيز عشان تكمل طلبك وتتابع كل طلباتك'}
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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="login-email"
          label={isEn ? 'Email Address' : 'البريد الإلكتروني'}
          type="email"
          leftIcon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
            if (formError) setFormError(null);
          }}
          placeholder="name@example.com"
          autoComplete="email"
          error={fieldErrors.email}
          disabled={isSubmitting}
          dir="ltr"
          required
        />

        <Input
          id="login-password"
          label={isEn ? 'Password' : 'كلمة المرور'}
          type={showPassword ? 'text' : 'password'}
          leftIcon={Lock}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
            if (formError) setFormError(null);
          }}
          placeholder="••••••••"
          autoComplete="current-password"
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

        <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-dark font-medium">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 rounded border-border text-[#512080] focus:ring-[#512080]"
            />
            <span>{isEn ? 'Remember me' : 'تذكرني'}</span>
          </label>

          <Link
            to={`${ROUTES.FORGOT_PASSWORD}${querySuffix}`}
            className="font-bold text-[#512080] hover:underline"
          >
            {isEn ? 'Forgot password?' : 'نسيت كلمة المرور؟'}
          </Link>
        </div>

        <Button
          type="submit"
          variant="yellow"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={isSubmitting || isGoogleSubmitting}
          leftIcon={LogIn}
          className="font-black mt-2"
        >
          {isSubmitting
            ? isEn
              ? 'Signing in...'
              : 'جاري تسجيل الدخول...'
            : isEn
            ? 'Sign In'
            : 'تسجيل الدخول'}
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
        mode="login"
        isEn={isEn}
        isLoading={isGoogleSubmitting}
        disabled={isSubmitting}
        onClick={handleGoogleSignIn}
      />

      <div className="text-center text-xs text-gray-500 pt-3 border-t border-border">
        <span>{isEn ? "Don't have an account? " : 'لسه معندكش حساب؟ '}</span>
        <Link
          to={`${ROUTES.REGISTER}${querySuffix}`}
          className="text-[#512080] font-bold hover:underline"
        >
          {isEn ? 'Create Account' : 'إنشاء حساب جديد'}
        </Link>
      </div>
    </div>
  );
};
