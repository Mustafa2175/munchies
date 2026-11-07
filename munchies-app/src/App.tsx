/**
 * @module App
 * @description Master router, layout hierarchy, and global toast notifications.
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuthStore } from '@/stores/authStore';
import { updateDocumentDirection } from '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';

// Layouts
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute, AdminRoute } from '@/components/shared/ProtectedRoute';

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

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

// Admin Pages
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { OrdersPage } from '@/pages/admin/OrdersPage';
import { ProductsPage } from '@/pages/admin/ProductsPage';
import { CategoriesPage } from '@/pages/admin/CategoriesPage';
import { OperationsPage } from '@/pages/admin/OperationsPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';

export function App() {
  const { i18n } = useTranslation();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    updateDocumentDirection();
  }, []);

  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(
        auth,
        (firebaseUser) => {
          if (firebaseUser) {
            setUser({
              uid: firebaseUser.uid,
              fullName: firebaseUser.displayName || 'Customer',
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '01025707026',
              role: 'customer',
              preferredLanguage: (i18n.language as any) || 'ar',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any);
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
  }, [setUser, setLoading, i18n.language]);

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
        {/* Customer Experience */}
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
          <Route path={ROUTES.ORDER_TRACKING} element={<OrderTrackingPage />} />
          <Route path="/order/:id" element={<OrderTrackingPage />} />
          <Route path="/orders" element={<AccountPage />} />
          <Route
            path={ROUTES.PROFILE}
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Authentication */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Admin Dashboard */}
        <Route element={<AdminLayout />}>
          <Route path={ROUTES.ADMIN} element={<DashboardPage />} />
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.ADMIN_ORDERS} element={<OrdersPage />} />
          <Route path={ROUTES.ADMIN_PRODUCTS} element={<ProductsPage />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path={ROUTES.ADMIN_CATEGORIES} element={<CategoriesPage />} />
          <Route path="/admin/categories" element={<CategoriesPage />} />
          <Route path="/admin/operations" element={<OperationsPage />} />
          <Route path={ROUTES.ADMIN_SETTINGS} element={<SettingsPage />} />
          <Route path={ROUTES.ADMIN_AUDIT_LOG} element={<AuditLogPage />} />
          <Route path={ROUTES.ADMIN_ANALYTICS} element={<DashboardPage />} />
        </Route>

        {/* Catch-all redirect to Home */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
