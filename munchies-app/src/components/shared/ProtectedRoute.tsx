/**
 * @module components/shared/ProtectedRoute
 * @description Requires customer authentication. Preserves location state for redirect back.
 */

import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/config/routes';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#512080] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#512080] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not admin, redirect to admin login
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * Guard placed on the exact `/admin` route.
 * Forces a fresh login every time the user directly navigates to `/admin`
 * (e.g. typing it in the address bar, opening a new tab, or refreshing on `/admin`).
 * After login, internal admin sub-route navigation works normally.
 */
export const AdminEntryGuard: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const logoutTriggered = useRef(false);

  useEffect(() => {
    if (!logoutTriggered.current) {
      logoutTriggered.current = true;
      logout();
    }
  }, [logout]);

  return <Navigate to={ROUTES.ADMIN_LOGIN} state={{ from: { pathname: ROUTES.ADMIN_DASHBOARD } }} replace />;
};

