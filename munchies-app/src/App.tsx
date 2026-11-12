/**
 * @module App
 * @description Master router, layout hierarchy, centralized Firebase auth initialization, and global toast notifications.
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { initAuthListener } from '@/stores/authStore';
import { updateDocumentDirection } from '@/lib/i18n';
import { ROUTES } from '@/config/routes';

// Layouts
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  ProtectedRoute,
  GuestOnlyRoute,
  AdminRoute,
  AdminEntryGuard,
} from '@/components/shared/ProtectedRoute';

// Customer Pages
import { HomePage } from '@/pages/customer/HomePage';
import { MenuPage } from '@/pages/customer/MenuPage';
import { ProductDetailsPage } from '@/pages/customer/ProductDetailsPage';
import { CartPage } from '@/pages/customer/CartPage';
import { CheckoutPage } from '@/pages/customer/CheckoutPage';
import { OrderTrackingPage } from '@/pages/customer/OrderTrackingPage';
import { OffersPage } from '@/pages/customer/OffersPage';
import { BuildYourOwnPage } from '@/pages/customer/BuildYourOwnPage';
import { AccountPage } from '@/pages/customer/AccountPage';
import { AccountOrdersPage } from '@/pages/customer/AccountOrdersPage';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { AdminLoginPage } from '@/pages/auth/AdminLoginPage';

// Admin Pages
import { OrdersPage } from '@/pages/admin/OrdersPage';
import { ProductsPage } from '@/pages/admin/ProductsPage';
import { CategoriesPage } from '@/pages/admin/CategoriesPage';
import { OperationsPage } from '@/pages/admin/OperationsPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';
import { SalesAnalyticsPage } from '@/pages/admin/SalesAnalyticsPage';

export function App() {
  useEffect(() => {
    updateDocumentDirection();
  }, []);

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, []);

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
          {/* Public Browsing & Cart */}
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.MENU} element={<MenuPage />} />
          <Route path={ROUTES.PRODUCT} element={<ProductDetailsPage />} />
          <Route path="/product/:slug" element={<ProductDetailsPage />} />
          <Route path={ROUTES.OFFERS} element={<OffersPage />} />
          <Route path="/build-your-own" element={<BuildYourOwnPage />} />
          <Route path={ROUTES.CART} element={<CartPage />} />

          {/* Customer Protected Routes */}
          <Route
            path={ROUTES.CHECKOUT}
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ACCOUNT}
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ACCOUNT_ORDERS}
            element={
              <ProtectedRoute>
                <AccountOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Navigate to={ROUTES.ACCOUNT_ORDERS} replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Navigate to={ROUTES.ACCOUNT} replace />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ORDER_TRACKING}
            element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.TRACK_ORDER}
            element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track-order/:id"
            element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Customer Authentication Pages */}
        <Route element={<AuthLayout />}>
          <Route
            path={ROUTES.LOGIN}
            element={
              <GuestOnlyRoute>
                <LoginPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path={ROUTES.REGISTER}
            element={
              <GuestOnlyRoute>
                <RegisterPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={
              <GuestOnlyRoute>
                <ForgotPasswordPage />
              </GuestOnlyRoute>
            }
          />
          <Route path="/auth/login" element={<Navigate to={ROUTES.LOGIN} replace />} />
          <Route path="/auth/register" element={<Navigate to={ROUTES.REGISTER} replace />} />
          <Route path="/auth/forgot-password" element={<Navigate to={ROUTES.FORGOT_PASSWORD} replace />} />

          {/* Dedicated Admin Portal Login */}
          <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
        </Route>

        {/* Admin Dashboard */}
        <Route path={ROUTES.ADMIN} element={<AdminEntryGuard />} />

        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
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
