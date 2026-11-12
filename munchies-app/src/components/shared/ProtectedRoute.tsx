/**
 * @module components/shared/ProtectedRoute
 * @description Route guards for customer-protected routes, guest-only auth routes, and admin routes.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
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
  const [isVerifyingServerRole, setIsVerifyingServerRole] = useState(true);
  const [isServerRoleValid, setIsServerRoleValid] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function checkServerRole() {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        if (isCurrent) {
          setIsServerRoleValid(false);
          setIsVerifyingServerRole(false);
        }
        return;
      }

      try {
        // Query server-side Firestore adminUsers collection directly
        const adminSnap = await getDoc(doc(db, 'adminUsers', currentUser.uid));
        if (adminSnap.exists() && adminSnap.data()?.isActive === true) {
          if (isCurrent) {
            setIsServerRoleValid(true);
            setIsVerifyingServerRole(false);
          }
        } else {
          if (isCurrent) {
            setIsServerRoleValid(false);
            setIsVerifyingServerRole(false);
          }
        }
      } catch (err) {
        console.warn('Server-side admin role check error:', err);
        if (isCurrent) {
          setIsServerRoleValid(false);
          setIsVerifyingServerRole(false);
        }
      }
    }

    if (!isLoading) {
      if (isAuthenticated && isAdmin) {
        checkServerRole();
      } else {
        setIsServerRoleValid(false);
        setIsVerifyingServerRole(false);
      }
    }

    return () => {
      isCurrent = false;
    };
  }, [isLoading, isAuthenticated, isAdmin]);

  if (isLoading || isVerifyingServerRole) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !isAdmin || !isServerRoleValid) {
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
