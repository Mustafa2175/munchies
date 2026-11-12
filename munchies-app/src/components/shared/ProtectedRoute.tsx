/**
 * @module components/shared/ProtectedRoute
 * @description Route guards for customer-protected routes, guest-only auth routes, and admin routes.
 */

import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { auth } from '@/config/firebase';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES, getSafeRedirectPath } from '@/config/routes';

const LoadingSpinner: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-[#512080] border-t-transparent rounded-full animate-spin" />
  </div>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, needsProfileRecovery } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || needsProfileRecovery) {
    const intendedDestination = `${location.pathname}${location.search}`;
    const loginUrl = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(intendedDestination)}`;
    return <Navigate to={loginUrl} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const GuestOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, needsProfileRecovery } = useAuthStore();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Only show a brief spinner while hydrating an existing Firebase Auth session
  if (isLoading && auth.currentUser) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated && !needsProfileRecovery) {
    const redirectParam = searchParams.get('redirect');
    const stateFrom = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    const statePath = stateFrom?.pathname ? `${stateFrom.pathname}${stateFrom.search || ''}` : null;
    const target = getSafeRedirectPath(redirectParam || statePath, ROUTES.HOME);
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * Guard placed on the exact `/admin` route.
 * Forces a fresh login every time the user directly navigates to `/admin`.
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

  return (
    <Navigate
      to={ROUTES.ADMIN_LOGIN}
      state={{ from: { pathname: ROUTES.ADMIN_DASHBOARD } }}
      replace
    />
  );
};
