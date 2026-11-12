/**
 * @module pages/customer/AccountPage
 * @description Customer account management: view/edit profile, change password/email with reauthentication,
 * view account creation date, recent orders link, and logout. Supports Arabic RTL and English LTR.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  Lock,
  LogOut,
  Save,
  Eye,
  EyeOff,
  ShoppingBag,
  ArrowLeft,
  Shield,
  Check,
  Circle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/stores/authStore';
import { mapAuthError } from '@/lib/authErrors';
import { parseDate, formatDate } from '@/lib/date';
import {
  getPasswordChecks,
  isValidEmail,
  normalizeEmail,
  validateProfileFields,
} from '@/lib/validators';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OrderCard } from '@/components/order/OrderCard';
import { ROUTES } from '@/config/routes';
import type { Order } from '@/types';

export const AccountPage: React.FC = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en' : 'ar';
  const isEn = locale === 'en';
  const navigate = useNavigate();

  const {
    user,
    customerProfile,
    firebaseUser,
    logout,
    updateCustomerProfile,
    changeCustomerPassword,
    requestEmailChange,
  } = useAuthStore();

  const activeProfile = customerProfile || user;
  const hasPasswordProvider =
    firebaseUser?.providerData?.some((provider) => provider.providerId === 'password') ?? false;

  // Profile form (use nullable overrides so profile updates reflect immediately without effect setState)
  const [fullNameOverride, setFullNameOverride] = useState<string | null>(null);
  const [phoneOverride, setPhoneOverride] = useState<string | null>(null);
  const fullName = fullNameOverride ?? activeProfile?.fullName ?? '';
  const phone = phoneOverride ?? activeProfile?.phone ?? '';
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Email change form (collapsible)
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSentMessage, setEmailSentMessage] = useState<string | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Recent orders
  const [ordersSnapshot, setOrdersSnapshot] = useState<{ uid: string; items: Order[] } | null>(null);
  const currentUid = activeProfile?.uid;
  const recentOrders = currentUid && ordersSnapshot?.uid === currentUid ? ordersSnapshot.items : [];
  const isLoadingOrders = Boolean(currentUid) && ordersSnapshot?.uid !== currentUid;

  // Subscribe only to the authenticated customer's orders
  useEffect(() => {
    if (!currentUid) return;

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', currentUid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Order))
          .sort((a, b) => {
            const ta = parseDate(a.createdAt)?.getTime() || 0;
            const tb = parseDate(b.createdAt)?.getTime() || 0;
            return tb - ta;
          });
        setOrdersSnapshot({ uid: currentUid, items: list });
      },
      (err) => {
        console.warn('Error loading customer orders:', err);
        setOrdersSnapshot({ uid: currentUid, items: [] });
      }
    );

    return () => unsub();
  }, [currentUid]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateProfileFields({ fullName, phone }, locale);
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingProfile(true);
    try {
      await updateCustomerProfile({ fullName, phone });
      setFullNameOverride(null);
      setPhoneOverride(null);
      toast.success(
        isEn ? 'Your profile has been updated.' : 'تم تحديث بيانات حسابك بنجاح'
      );
    } catch (err: unknown) {
      toast.error(mapAuthError(err, locale));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const pwdChecks = getPasswordChecks(newPassword);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError(isEn ? 'Current password is required.' : 'يرجى إدخال كلمة المرور الحالية.');
      return;
    }
    if (!pwdChecks.isValid) {
      setPasswordError(
        isEn
          ? 'New password must be at least 8 characters and include a letter and a number.'
          : 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل وتتضمن حرفاً ورقماً.'
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(
        isEn ? 'New passwords do not match.' : 'كلمة المرور الجديدة وتأكيدها غير متطابقين.'
      );
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeCustomerPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success(
        isEn ? 'Password updated successfully.' : 'تم تغيير كلمة المرور بنجاح'
      );
    } catch (err: unknown) {
      setPasswordError(mapAuthError(err, locale));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSentMessage(null);

    const cleanNewEmail = normalizeEmail(newEmail);
    if (!cleanNewEmail || !isValidEmail(cleanNewEmail)) {
      setEmailError(isEn ? 'Please enter a valid new email address.' : 'صيغة البريد الإلكتروني الجديد غير صحيحة.');
      return;
    }
    if (!emailConfirmPassword) {
      setEmailError(isEn ? 'Please enter your current password to confirm.' : 'يرجى إدخال كلمة المرور الحالية للتأكيد.');
      return;
    }

    setIsChangingEmail(true);
    try {
      await requestEmailChange(cleanNewEmail, emailConfirmPassword);
      setEmailConfirmPassword('');
      setNewEmail('');
      setEmailSentMessage(
        isEn
          ? `A verification link has been sent to ${cleanNewEmail}. Your email will update once you confirm it.`
          : `تم إرسال رابط تأكيد إلى ${cleanNewEmail}. سيتم تحديث بريدك الإلكتروني فور تأكيد الرابط.`
      );
      toast.success(
        isEn ? 'Verification link sent to your new email.' : 'تم إرسال رابط التحقق إلى بريدك الجديد'
      );
    } catch (err: unknown) {
      setEmailError(mapAuthError(err, locale));
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success(isEn ? 'Signed out successfully.' : 'تم تسجيل الخروج بنجاح');
    navigate(ROUTES.HOME, { replace: true });
  };

  const createdAtDisplay = formatDate(
    activeProfile?.createdAt || firebaseUser?.metadata?.creationTime,
    locale
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Profile Header */}
      <Card className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#512080] text-[#FFDA35] flex items-center justify-center font-black text-2xl shadow-md shrink-0">
            {(activeProfile?.fullName || 'م').charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-dark truncate">
              {activeProfile?.fullName || (isEn ? "Munchie's Customer" : 'عميل مانشيز')}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-medium-gray">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#512080]" />
                <span dir="ltr">{activeProfile?.email || firebaseUser?.email}</span>
              </span>
              {activeProfile?.phone && (
                <span className="inline-flex items-center gap-1.5 number-ltr">
                  <Phone className="w-3.5 h-3.5 text-[#512080]" />
                  <span dir="ltr">{activeProfile.phone}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#512080]" />
                <span>
                  {isEn ? 'Member since: ' : 'تاريخ الانضمام: '}
                  <strong className="text-dark">{createdAtDisplay}</strong>
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-danger hover:bg-danger-light font-bold"
            leftIcon={LogOut}
          >
            {isEn ? 'Log Out' : 'تسجيل الخروج'}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Start Column: Edit Profile & Email */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <div className="w-8 h-8 rounded-xl bg-[#512080]/10 text-[#512080] flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-dark">
                  {isEn ? 'Profile Details' : 'البيانات الشخصية'}
                </h2>
                <p className="text-[11px] text-medium-gray">
                  {isEn ? 'Keep your contact information up to date' : 'حدّث اسمك ورقم موبايلك عشان نتابع معاك طلباتك بسهولة'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
              <Input
                id="account-fullname"
                label={isEn ? 'Full Name' : 'الاسم بالكامل'}
                leftIcon={UserIcon}
                value={fullName}
                onChange={(e) => {
                  setFullNameOverride(e.target.value);
                  if (profileErrors.fullName) setProfileErrors((p) => ({ ...p, fullName: '' }));
                }}
                error={profileErrors.fullName}
                disabled={isSavingProfile}
                required
              />

              <Input
                id="account-phone"
                label={isEn ? 'Phone Number' : 'رقم الموبايل'}
                type="tel"
                leftIcon={Phone}
                value={phone}
                onChange={(e) => {
                  setPhoneOverride(e.target.value);
                  if (profileErrors.phone) setProfileErrors((p) => ({ ...p, phone: '' }));
                }}
                placeholder="01012345678"
                helperText={
                  !activeProfile?.phone
                    ? isEn
                      ? 'Add an Egyptian mobile number (010, 011, 012, 015) for faster checkout'
                      : 'أضف رقم موبايل مصري (010 أو 011 أو 012 أو 015) لتسهيل إتمام الطلبات'
                    : undefined
                }
                error={profileErrors.phone}
                disabled={isSavingProfile}
                className="number-ltr tabular-nums"
                dir="ltr"
                required
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-semibold text-dark">
                    {isEn ? 'Email Address' : 'البريد الإلكتروني'}
                  </span>
                  {hasPasswordProvider && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingEmail((prev) => !prev);
                        setEmailError(null);
                        setEmailSentMessage(null);
                      }}
                      className="text-xs font-bold text-[#512080] hover:underline cursor-pointer"
                    >
                      {isEditingEmail
                        ? isEn
                          ? 'Cancel'
                          : 'إلغاء'
                        : isEn
                        ? 'Change Email'
                        : 'تغيير البريد الإلكتروني'}
                    </button>
                  )}
                </div>
                <Input
                  id="account-email"
                  type="email"
                  leftIcon={Mail}
                  value={activeProfile?.email || firebaseUser?.email || ''}
                  disabled
                  dir="ltr"
                />
              </div>

              <Button
                type="submit"
                variant="yellow"
                size="md"
                fullWidth
                isLoading={isSavingProfile}
                disabled={isSavingProfile}
                leftIcon={Save}
                className="font-black"
              >
                {isEn ? 'Save Profile Changes' : 'حفظ التعديلات'}
              </Button>
            </form>

            {/* Optional Email Change Form with Reauthentication */}
            {isEditingEmail && (
              <form
                onSubmit={handleRequestEmailChange}
                className="pt-4 mt-4 border-t border-border space-y-3 bg-[#F5F3F7] p-4 rounded-xl"
                noValidate
              >
                <p className="text-xs font-bold text-dark">
                  {isEn ? 'Update Email Address' : 'تحديث البريد الإلكتروني'}
                </p>
                {emailError && (
                  <div className="p-2.5 rounded-xl bg-danger-light border border-danger/25 text-danger text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{emailError}</span>
                  </div>
                )}
                {emailSentMessage && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    {emailSentMessage}
                  </div>
                )}
                <Input
                  label={isEn ? 'New Email Address' : 'البريد الإلكتروني الجديد'}
                  type="email"
                  leftIcon={Mail}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                  dir="ltr"
                  disabled={isChangingEmail}
                  required
                />
                <Input
                  label={isEn ? 'Current Password (required)' : 'كلمة المرور الحالية (للتأكيد)'}
                  type="password"
                  leftIcon={Lock}
                  value={emailConfirmPassword}
                  onChange={(e) => setEmailConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isChangingEmail}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  fullWidth
                  isLoading={isChangingEmail}
                  disabled={isChangingEmail}
                  className="font-bold"
                >
                  {isEn ? 'Send Verification Link' : 'إرسال رابط تأكيد البريد الجديد'}
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Right/End Column: Security / Change Password */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <div className="w-8 h-8 rounded-xl bg-[#512080]/10 text-[#512080] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-dark">
                  {hasPasswordProvider
                    ? isEn
                      ? 'Change Password'
                      : 'تغيير كلمة المرور'
                    : isEn
                    ? 'Account Security'
                    : 'أمان الحساب'}
                </h2>
                <p className="text-[11px] text-medium-gray">
                  {hasPasswordProvider
                    ? isEn
                      ? 'Confirm your current password before setting a new one'
                      : 'أدخل كلمة المرور الحالية لتأكيد هويتك ثم اختر كلمة مرور جديدة'
                    : isEn
                    ? 'Protected by your Google Account'
                    : 'حسابك محمي عبر تسجيل الدخول بحساب جوجل'}
                </p>
              </div>
            </div>

            {!hasPasswordProvider ? (
              <div className="p-4 rounded-xl bg-[#F5F3F7] border border-border space-y-2">
                <p className="text-sm font-bold text-dark">
                  {isEn ? 'Signed in with Google' : 'مسجل الدخول باستخدام جوجل (Google)'}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isEn
                    ? 'Your email and password security settings are managed directly through your Google Account.'
                    : 'يتم إدارة البريد الإلكتروني وكلمة المرور والأمان مباشرة من خلال حساب جوجل الخاص بك.'}
                </p>
              </div>
            ) : (
              <>
            {passwordError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-danger-light border border-danger/25 text-danger text-xs font-semibold flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5" noValidate>
              <Input
                id="account-current-password"
                label={isEn ? 'Current Password' : 'كلمة المرور الحالية'}
                type={showCurrentPwd ? 'text' : 'password'}
                leftIcon={Lock}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isChangingPassword}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd((p) => !p)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary cursor-pointer"
                    aria-label={isEn ? 'Toggle current password visibility' : 'إظهار أو إخفاء كلمة المرور'}
                  >
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Input
                id="account-new-password"
                label={isEn ? 'New Password' : 'كلمة المرور الجديدة'}
                type={showNewPwd ? 'text' : 'password'}
                leftIcon={Lock}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isChangingPassword}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowNewPwd((p) => !p)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary cursor-pointer"
                    aria-label={isEn ? 'Toggle new password visibility' : 'إظهار أو إخفاء كلمة المرور'}
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <div className="rounded-xl bg-[#F5F3F7] px-3 py-2 space-y-1 text-[11px]">
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
                  {pwdChecks.hasLetter && pwdChecks.hasNumber ? (
                    <Check className="w-3.5 h-3.5 text-success shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-medium-gray shrink-0" />
                  )}
                  <span
                    className={
                      pwdChecks.hasLetter && pwdChecks.hasNumber
                        ? 'text-success font-semibold'
                        : 'text-gray-600'
                    }
                  >
                    {isEn ? 'Includes letters and numbers' : 'تحتوي على حروف وأرقام'}
                  </span>
                </div>
              </div>

              <Input
                id="account-confirm-password"
                label={isEn ? 'Confirm New Password' : 'تأكيد كلمة المرور الجديدة'}
                type={showConfirmPwd ? 'text' : 'password'}
                leftIcon={Lock}
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isChangingPassword}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd((p) => !p)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary cursor-pointer"
                    aria-label={isEn ? 'Toggle confirm password visibility' : 'إظهار أو إخفاء كلمة المرور'}
                  >
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                isLoading={isChangingPassword}
                disabled={isChangingPassword}
                className="font-bold"
              >
                {isEn ? 'Update Password' : 'تحديث كلمة المرور'}
              </Button>
            </form>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#512080]" />
            <h2 className="text-xl font-black text-dark">
              {isEn ? 'My Recent Orders' : 'أحدث طلباتي'}
            </h2>
          </div>

          <Link
            to={ROUTES.ACCOUNT_ORDERS}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#512080] hover:underline"
          >
            <span>{isEn ? `View All (${recentOrders.length})` : `عرض كل الطلبات (${recentOrders.length})`}</span>
            <ArrowLeft className={`w-3.5 h-3.5 ${isEn ? 'rotate-180' : ''}`} />
          </Link>
        </div>

        {isLoadingOrders ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-light-gray animate-pulse border border-border" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-medium-gray mx-auto" />
            <h3 className="text-base font-black text-dark">
              {isEn ? 'No orders yet' : 'لسه مفيش طلبات سابقة!'}
            </h3>
            <p className="text-xs text-medium-gray">
              {isEn ? 'Explore our menu and place your first order!' : 'المطبخ جاهز... اختار اللي على مزاجك من المنيو واطلب دلوقتي.'}
            </p>
            <div className="pt-1">
              <Link to={ROUTES.MENU}>
                <Button variant="yellow" size="sm" className="font-black">
                  {isEn ? 'Browse Menu' : 'شوف المنيو'}
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentOrders.slice(0, 4).map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
