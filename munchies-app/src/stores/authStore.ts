/**
 * @module stores/authStore
 * @description Zustand authentication store for customer and admin state.
 */

import { create } from 'zustand';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import type { User, AdminUser } from '@/types';
import type { AdminPermission } from '@/config/constants';

interface AuthState {
  user: User | null;
  adminUser: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setAdminUser: (admin: AdminUser | null) => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: AdminPermission) => boolean;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  adminUser: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  setAdminUser: (adminUser) => {
    set({
      adminUser,
      isAdmin: !!adminUser && adminUser.isActive,
    });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  hasPermission: (permission) => {
    const admin = get().adminUser;
    if (!admin || !admin.isActive) return false;
    if (admin.role === 'super_admin') return true;
    return admin.permissions?.includes(permission) ?? false;
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore signOut errors if not connected or offline
    }
    set({
      user: null,
      adminUser: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  },
}));

