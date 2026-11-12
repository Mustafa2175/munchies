/**
 * @module pages/auth/AdminLoginPage
 * @description Dedicated Admin Portal Login form strictly for authorized staff.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, LogIn, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { useAuthStore } from '@/stores/authStore';
import { mapAuthError } from '@/lib/authErrors';
import { logFailedLogin, clearLocalFailedAttempts, logAdminAction } from '@/lib/auditLogger';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';
import type { AdminUser } from '@/types';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);
  const setAdminUser = useAuthStore((state) => state.setAdminUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || ROUTES.ADMIN_DASHBOARD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('يرجى إدخال البريد وكلمة المرور');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setIsLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const uid = userCred.user.uid;

      const adminDocRef = doc(db, 'adminUsers', uid);
      const adminSnap = await getDoc(adminDocRef);

      if (adminSnap.exists()) {
        const adminData = { uid, ...adminSnap.data() } as AdminUser;
        if (adminData.isActive) {
          // Successful login: clear failed tracker and log action
          clearLocalFailedAttempts(cleanEmail);
          setSecurityAlert(null);

          logAdminAction(
            'admin_login',
            'adminUsers',
            uid,
            `تسجيل دخول ناجح إلى لوحة التحكم الإدارية`
          ).catch(() => {});

          setAdminUser(adminData);
          setUser({
            uid,
            fullName: adminData.name || adminData.displayName || userCred.user.displayName || 'مدير مانشيز',
            email: userCred.user.email || cleanEmail,
            phone: userCred.user.phoneNumber || adminData.phone || '01025707026',
            role: 'admin',
            preferredLanguage: 'ar',
            createdAt: adminData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          toast.success('مرحباً بك في لوحة تحكم المطعم');
          const target =
            from.startsWith('/admin') && from !== ROUTES.ADMIN && from !== ROUTES.ADMIN_LOGIN
              ? from
              : ROUTES.ADMIN_DASHBOARD;
          navigate(target, { replace: true });
          return;
        }
      }

      await signOut(auth);
      setAdminUser(null);
      setUser(null);

      // Record failed login attempt for non-admin user trying to access admin portal
      const alertRes = await logFailedLogin(cleanEmail, 'auth/unauthorized-admin-access');
      if (alertRes.isRepeatedAlert && alertRes.alertMessage) {
        setSecurityAlert(alertRes.alertMessage);
      }

      toast.error('هذا الحساب ليس لديه صلاحيات المسؤول للوصول إلى لوحة الإدارة');
    } catch (err: unknown) {
      console.error('Admin login error:', err);

      // Extract error code without exposing raw password/tokens
      const errCode = (err as { code?: string })?.code || 'auth/invalid-credential';
      const alertRes = await logFailedLogin(cleanEmail, errCode);

      if (alertRes.isRepeatedAlert && alertRes.alertMessage) {
        setSecurityAlert(alertRes.alertMessage);
        toast.error(alertRes.alertMessage, { duration: 6000 });
      } else {
        toast.error(mapAuthError(err, 'ar'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary text-yellow flex items-center justify-center mx-auto mb-3 shadow-md">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-dark">
          بوابة إدارة المطعم
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          لوحة تحكم مانشيز – يرجى تسجيل الدخول بحساب المسؤول
        </p>
      </div>

      {securityAlert && (
        <div className="p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 flex items-start gap-3 animate-shake">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-danger" />
          <div className="text-xs space-y-1">
            <span className="font-black block text-danger-800">تحذير أمني عالي الأهمية</span>
            <p className="leading-relaxed">{securityAlert}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="البريد الإلكتروني للمسؤول"
          type="email"
          leftIcon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@munchies.com"
          autoComplete="email"
          required
        />

        <Input
          label="كلمة المرور"
          type={showPassword ? 'text' : 'password'}
          leftIcon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary transition-colors cursor-pointer"
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <Button
          type="submit"
          variant="yellow"
          size="lg"
          fullWidth
          isLoading={isLoading}
          leftIcon={LogIn}
          className="font-black mt-2"
        >
          دخول لوحة التحكم
        </Button>
      </form>
    </div>
  );
};

