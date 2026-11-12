/**
 * @module App
 * @description Master router, layout hierarchy, and global toast notifications.
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { useAuthStore } from '@/stores/authStore';
import { updateDocumentDirection } from '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import type { AdminUser } from '@/types';

// Layouts
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminRoute, AdminEntryGuard } from '@/components/shared/ProtectedRoute';

// Customer Pages
import { HomePage } from '@/pages/customer/HomePage';
import { MenuPage } from '@/pages/customer/MenuPage';
import { ProductDetailsPage } from '@/pages/customer/ProductDetailsPage';
import { CartPage } from '@/pages/customer/CartPage';
import { CheckoutPage } from '@/pages/customer/CheckoutPage';
import { OrderTrackingPage } from '@/pages/customer/OrderTrackingPage';
import { OffersPage } from '@/pages/customer/OffersPage';
import { BuildYourOwnPage } from '@/pages/customer/BuildYourOwnPage';
import { AboutPage } from '@/pages/customer/AboutPage';
import { ContactPage } from '@/pages/customer/ContactPage';
import { AccountPage } from '@/pages/customer/AccountPage';

// Admin Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';

// Admin Pages
import { OrdersPage } from '@/pages/admin/OrdersPage';
import { ProductsPage } from '@/pages/admin/ProductsPage';
import { CategoriesPage } from '@/pages/admin/CategoriesPage';
import { OperationsPage } from '@/pages/admin/OperationsPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';
import { SalesAnalyticsPage } from '@/pages/admin/SalesAnalyticsPage';

export function App() {
  const { i18n } = useTranslation();
  const setUser = useAuthStore((state) => state.setUser);
  const setAdminUser = useAuthStore((state) => state.setAdminUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    updateDocumentDirection();
  }, []);

  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          if (firebaseUser) {
            // Check if admin user in Firestore
            try {
              const adminSnap = await getDoc(doc(db, 'adminUsers', firebaseUser.uid));
              if (adminSnap.exists()) {
                const adminData = { uid: firebaseUser.uid, ...adminSnap.data() } as AdminUser;
                if (adminData.isActive) {
                  setAdminUser(adminData);
                  setUser({
                    uid: firebaseUser.uid,
                    fullName: adminData.name || adminData.displayName || firebaseUser.displayName || 'مدير مانشيز',
                    email: firebaseUser.email || '',
                    phone: firebaseUser.phoneNumber || adminData.phone || '01025707026',
                    role: 'admin',
                    preferredLanguage: (i18n.language as any) || 'ar',
                    createdAt: adminData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  } as any);
                  setLoading(false);
                  return;
                }
              }
            } catch (err) {
              console.warn('Error checking admin state on auth change:', err);
            }

            setUser({
              uid: firebaseUser.uid,
              fullName: firebaseUser.displayName || 'عميل مانشيز',
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '01025707026',
              role: 'customer',
              preferredLanguage: (i18n.language as any) || 'ar',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any);
          } else {
            setUser(null);
            setAdminUser(null);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firebase auth status note:', error);
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn('Firebase auth listener note:', e);
      setLoading(false);
    }

    return () => unsub();
  }, [setUser, setAdminUser, setLoading, i18n.language]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '16px',
            background: '#26212B',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          },
        }}
      />

      <Routes>
        {/* Customer Experience - 100% Public & Guest Checkout */}
        <Route element={<CustomerLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.MENU} element={<MenuPage />} />
          <Route path={ROUTES.PRODUCT} element={<ProductDetailsPage />} />
          <Route path="/product/:slug" element={<ProductDetailsPage />} />
          <Route path={ROUTES.OFFERS} element={<OffersPage />} />
          <Route path="/build-your-own" element={<BuildYourOwnPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />
          <Route path={ROUTES.CART} element={<CartPage />} />
          <Route path={ROUTES.CHECKOUT} element={<CheckoutPage />} />
          <Route path={ROUTES.TRACK_ORDER} element={<OrderTrackingPage />} />
          <Route path={ROUTES.ORDER_TRACKING} element={<OrderTrackingPage />} />
          <Route path="/order/:id" element={<OrderTrackingPage />} />
          <Route path="/orders/:id" element={<OrderTrackingPage />} />
          <Route path="/track-order" element={<OrderTrackingPage />} />
          <Route path="/track-order/:id" element={<OrderTrackingPage />} />
          <Route path="/orders" element={<AccountPage />} />
          <Route path={ROUTES.PROFILE} element={<Navigate to={ROUTES.HOME} replace />} />
        </Route>

        {/* Dedicated Admin Portal Login */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.ADMIN_LOGIN} element={<LoginPage />} />
          <Route path="/login" element={<Navigate to={ROUTES.ADMIN_LOGIN} replace />} />
          <Route path="/auth/login" element={<Navigate to={ROUTES.ADMIN_LOGIN} replace />} />
          <Route path="/auth/*" element={<Navigate to={ROUTES.ADMIN_LOGIN} replace />} />
        </Route>

        {/* Admin Dashboard */}
        {/* Exact /admin entry forces logout and redirects to login */}
        <Route path={ROUTES.ADMIN} element={<AdminEntryGuard />} />

        {/* Admin sub-routes — protected by AdminRoute */}
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<OrdersPage />} />
          <Route path={ROUTES.ADMIN_ORDERS} element={<OrdersPage />} />
          <Route path={ROUTES.ADMIN_PRODUCTS} element={<ProductsPage />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path={ROUTES.ADMIN_CATEGORIES} element={<CategoriesPage />} />
          <Route path="/admin/categories" element={<CategoriesPage />} />
          <Route path="/admin/operations" element={<OperationsPage />} />
          <Route path={ROUTES.ADMIN_SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.ADMIN_AUDIT_LOG} element={<AuditLogPage />} />
          <Route path={ROUTES.ADMIN_ANALYTICS} element={<SalesAnalyticsPage />} />
        </Route>

        {/* Catch-all redirect to Home */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
