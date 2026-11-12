/**
 * @module pages/auth/ResetPasswordPage
 * @description Secure token-based password reset completion page.
 * Validates single-use token with 15-30 min lifetime, enforces password strength,
 * and updates user credentials securely via Cloud Functions.
 */

import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';
import { getPasswordChecks } from '@/lib/validators';

export const ResetPasswordPage: React.FC = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en' : 'ar';
  const isEn = locale === 'en';

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const pwdChecks = getPasswordChecks(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!token) {
      setFormError(
        isEn
          ? 'Invalid or missing password reset token.'
          : 'رابط استعادة كلمة المرور غير صالح أو مفقود.'
      );
      return;
    }

    if (!pwdChecks.isValid) {
      setFormError(
        isEn
          ? 'Password must be at least 8 characters and include a letter and a number.'
          : 'يجب أن تتكون كلمة المرور من 8 خانات على الأقل وتحتوي على حرف ورقم.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError(isEn ? 'Passwords do not match.' : 'كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsSubmitting(true);
    try {
      const confirmReset = httpsCallable<{ token: string; newPassword: string }, { success: boolean; message: string }>(
        functions,
        'confirmPasswordResetWithToken'
      );
      await confirmReset({
        token,
        newPassword,
      });

      setIsSuccess(true);
      toast.success(
        isEn
          ? 'Password reset successfully! Please sign in.'
          : 'تم تعيين كلمة المرور الجديدة بنجاح!'
      );
    } catch (err: any) {
      const msg =
        err?.message ||
        (isEn
          ? 'This reset link has expired or has already been used.'
          : 'هذا الرابط منتهي الصلاحية أو تم استخدامه بالفعل.');
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-dark">
            {isEn ? 'Invalid Reset Link' : 'رابط غير صالح'}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {isEn
              ? 'The password reset link is missing its authentication token or has expired.'
              : 'رابط تعيين كلمة المرور غير صالح أو غير مكتمل. يرجى طلب رابط جديد.'}
          </p>
        </div>
        <div>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-[#512080] text-white font-bold hover:bg-[#43176d] transition-all"
          >
            {isEn ? 'Request New Reset Link' : 'طلب رابط جديد'}
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-dark">
            {isEn ? 'Password Updated!' : 'تم تحديث كلمة المرور بنجاح'}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {isEn
              ? 'Your password has been changed. For security, all other sessions have been terminated. You can now sign in.'
              : 'تم تغيير كلمة المرور الخاصة بك بنجاح. لدواعي الأمان، تم إنهاء كافة الجلسات السابقة. يمكنك الآن تسجيل الدخول.'}
          </p>
        </div>
        <div>
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-[#512080] text-white font-bold hover:bg-[#43176d] transition-all shadow-md shadow-[#512080]/15"
          >
            {isEn ? 'Sign In Now' : 'تسجيل الدخول الآن'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#512080]/10 text-[#512080] flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-dark">
          {isEn ? 'Create New Password' : 'تعيين كلمة مرور جديدة'}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {isEn
            ? 'Reset links expire after 20 minutes and can only be used once.'
            : 'الرابط صالح لمدة 20 دقيقة ويستخدم لمرة واحدة فقط.'}
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1 leading-relaxed">{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            label={isEn ? 'New Password' : 'كلمة المرور الجديدة'}
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setFormError(null);
            }}
            disabled={isSubmitting}
            leftIcon={Lock}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-gray-400 hover:text-gray-600 focus:outline-hidden"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {newPassword && (
            <div className="pt-1.5 space-y-1">
              <div className="flex gap-1 h-1">
                <div
                  className={`h-full flex-1 rounded-full transition-colors ${
                    pwdChecks.minLength ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`h-full flex-1 rounded-full transition-colors ${
                    pwdChecks.hasLetter ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`h-full flex-1 rounded-full transition-colors ${
                    pwdChecks.hasNumber ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
              </div>
              <p className="text-[11px] text-gray-500">
                {isEn
                  ? 'Must contain at least 8 characters, letters and numbers.'
                  : '8 خانات على الأقل، تتضمن حروفاً وأرقاماً.'}
              </p>
            </div>
          )}
        </div>

        <Input
          id="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          label={isEn ? 'Confirm New Password' : 'تأكيد كلمة المرور الجديدة'}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setFormError(null);
          }}
          disabled={isSubmitting}
          leftIcon={Lock}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((p) => !p)}
              className="text-gray-400 hover:text-gray-600 focus:outline-hidden"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2 font-bold"
          isLoading={isSubmitting}
          disabled={isSubmitting || !newPassword || !confirmPassword}
        >
          {isEn ? 'Save New Password' : 'حفظ كلمة المرور الجديدة'}
        </Button>
      </form>

      <div className="text-center pt-2">
        <Link
          to={ROUTES.LOGIN}
          className="text-xs text-gray-500 hover:text-[#512080] font-medium"
        >
          {isEn ? 'Return to login' : 'العودة لتسجيل الدخول'}
        </Link>
      </div>
    </div>
  );
};
