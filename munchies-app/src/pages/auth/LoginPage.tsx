/**
 * @module pages/auth/LoginPage
 * @description Dedicated Admin Portal Login form strictly for authorized staff.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';
import type { AdminUser } from '@/types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);
  const setAdminUser = useAuthStore((state) => state.setAdminUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || ROUTES.ADMIN_DASHBOARD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('يرجى إدخال البريد وكلمة المرور');
      return;
    }

    setIsLoading(true);
    try {
      // Authenticate against Firebase Authentication
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;

      // Verify that the user exists and is active in adminUsers
      const adminDocRef = doc(db, 'adminUsers', uid);
      const adminSnap = await getDoc(adminDocRef);

      if (adminSnap.exists()) {
        const adminData = { uid, ...adminSnap.data() } as AdminUser;
        if (adminData.isActive) {
          setAdminUser(adminData);
          setUser({
            uid,
            fullName: adminData.name || adminData.displayName || userCred.user.displayName || 'مدير مانشيز',
            email: userCred.user.email || email.trim(),
            phone: userCred.user.phoneNumber || adminData.phone || '01025707026',
            role: 'admin',
            preferredLanguage: 'ar',
            createdAt: adminData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any);

          toast.success('مرحباً بك في لوحة تحكم المطعم');
          const target = from.startsWith('/admin') && from !== ROUTES.ADMIN && from !== ROUTES.ADMIN_LOGIN
            ? from
            : ROUTES.ADMIN_DASHBOARD;
          navigate(target, { replace: true });
          return;
        }
      }

      // Not an active admin -> revoke session immediately
      await signOut(auth);
      setAdminUser(null);
      setUser(null);
      toast.error('هذا الحساب ليس لديه صلاحيات المسؤول للوصول إلى لوحة الإدارة');
    } catch (err: any) {
      console.error('Admin login error:', err);
      let message = 'بيانات الدخول غير صحيحة';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'تم تجاوز عدد محاولات الدخول المسموح بها، يرجى المحاولة لاحقاً';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت';
      } else if (err.message) {
        message = err.message;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#512080] text-[#FFDA35] flex items-center justify-center mx-auto mb-3 shadow-md">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-[#26212B]">
          بوابة إدارة المطعم
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          لوحة تحكم مانشيز – يرجى تسجيل الدخول بحساب المسؤول
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="البريد الإلكتروني للمسؤول"
          type="email"
          leftIcon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@munchies.com"
          required
        />

        <Input
          label="كلمة المرور"
          type="password"
          leftIcon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
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
