/**
 * @module stores/authStore
 * @description Centralized Zustand authentication store with Firebase Auth as single source of truth.
 * Handles customer registration, login, persistence, password reset, profile updates,
 * password/email changes with reauthentication, and partial registration recovery.
 */

import { create } from 'zustand';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/config/firebase';
import { AuthAppError } from '@/lib/authErrors';
import {
  isValidEgyptianPhone,
  normalizeEgyptianPhone,
  normalizeEmail,
  normalizeFullName,
} from '@/lib/validators';
import { logPasswordChange, logPasswordResetRequest } from '@/lib/auditLogger';
import type { AdminPermission } from '@/config/constants';
import type { AdminUser, User } from '@/types';

export interface RegisterPayload {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

export interface PendingRegistrationProfile {
  fullName: string;
  phone: string;
  email: string;
}

interface AuthState {
  user: User | null;
  customerProfile: User | null;
  adminUser: AdminUser | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  needsProfileRecovery: boolean;
  pendingRegistrationProfile: PendingRegistrationProfile | null;

  // State setters
  setUser: (user: User | null) => void;
  setCustomerProfile: (profile: User | null) => void;
  setAdminUser: (admin: AdminUser | null) => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: AdminPermission) => boolean;

  // Auth lifecycle actions
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ isAdmin: boolean; profileExists: boolean }>;
  loginWithGoogle: (
    rememberMe?: boolean
  ) => Promise<{ isAdmin: boolean; isNewAccount: boolean }>;
  register: (payload: RegisterPayload) => Promise<void>;
  completeProfileRecovery: (payload: { fullName: string; phone: string }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateCustomerProfile: (payload: { fullName: string; phone: string }) => Promise<void>;
  changeCustomerPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestEmailChange: (newEmail: string, currentPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Guard to prevent onAuthStateChanged race conditions while login/register is writing/checking Firestore
let authMutationInFlight = 0;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

function getSafePhotoURL(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (trimmed.length <= 500 && /^https?:\/\/.+/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

function buildGoogleCustomerName(fbUser: FirebaseUser, cleanEmail: string): string {
  const normalized = normalizeFullName(fbUser.displayName || '');
  if (normalized.length >= 2) {
    return normalized.slice(0, 80);
  }
  const emailLocal = normalizeFullName(cleanEmail.split('@')[0] || '');
  if (emailLocal.length >= 2) {
    return emailLocal.slice(0, 80);
  }
  return 'عميل مانشيز';
}

function extractOptionalEgyptianPhone(fbUser: FirebaseUser): string {
  if (!fbUser.phoneNumber) return '';
  const normalized = normalizeEgyptianPhone(fbUser.phoneNumber);
  return isValidEgyptianPhone(normalized) ? normalized : '';
}

function normalizeCustomerDoc(uid: string, data: Record<string, any>, fbUser?: FirebaseUser | null): User {
  const fullName =
    data.fullName ||
    data.displayName ||
    fbUser?.displayName ||
    'عميل مانشيز';

  return {
    uid,
    fullName,
    displayName: data.displayName || fullName,
    email: data.email || fbUser?.email || '',
    phone: data.phone || '',
    photoURL: data.photoURL || getSafePhotoURL(fbUser?.photoURL),
    role: data.role || 'customer',
    authProvider: data.authProvider,
    isActive: data.isActive !== false,
    preferredLanguage: data.preferredLanguage || 'ar',
    addresses: Array.isArray(data.addresses) ? data.addresses : [],
    favouriteProductIds: Array.isArray(data.favouriteProductIds) ? data.favouriteProductIds : [],
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

async function fetchAdminDoc(uid: string): Promise<AdminUser | null> {
  try {
    const adminSnap = await getDoc(doc(db, 'adminUsers', uid));
    if (!adminSnap.exists()) return null;
    const adminData = { uid, ...adminSnap.data() } as AdminUser;
    return adminData.isActive ? adminData : null;
  } catch {
    return null;
  }
}

async function fetchCustomerDoc(uid: string): Promise<User | null> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return null;
  return normalizeCustomerDoc(uid, userSnap.data(), auth.currentUser);
}

async function hydrateSessionFromFirebaseUser(fbUser: FirebaseUser): Promise<void> {
  try {
    const [customerDoc, adminDoc] = await Promise.all([
      withTimeout(
        fetchCustomerDoc(fbUser.uid).catch((err) => {
          console.warn('Could not load customer profile:', err);
          return null;
        }),
        5000,
        null
      ),
      withTimeout(fetchAdminDoc(fbUser.uid), 5000, null),
    ]);

    // If the customer profile exists and has been explicitly disabled, revoke session immediately
    if (customerDoc && customerDoc.isActive === false && !adminDoc) {
      await signOut(auth).catch(() => {});
      useAuthStore.setState({
        firebaseUser: null,
        user: null,
        customerProfile: null,
        adminUser: null,
        isAuthenticated: false,
        isAdmin: false,
        needsProfileRecovery: false,
        isLoading: false,
      });
      return;
    }

    // Keep Firestore email synced if user confirmed an email change via verifyBeforeUpdateEmail
    if (customerDoc && fbUser.email && customerDoc.email !== normalizeEmail(fbUser.email)) {
      const updatedEmail = normalizeEmail(fbUser.email);
      updateDoc(doc(db, 'users', fbUser.uid), {
        email: updatedEmail,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
      customerDoc.email = updatedEmail;
    }

    if (adminDoc) {
      const adminProfile: User = customerDoc || {
        uid: fbUser.uid,
        fullName: adminDoc.name || adminDoc.displayName || fbUser.displayName || 'مدير مانشيز',
        displayName: adminDoc.displayName || adminDoc.name || fbUser.displayName || 'مدير مانشيز',
        email: fbUser.email || adminDoc.email || '',
        phone: fbUser.phoneNumber || adminDoc.phone || '01025707026',
        role: 'admin',
        isActive: true,
        preferredLanguage: 'ar',
        addresses: [],
        createdAt: adminDoc.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useAuthStore.setState({
        firebaseUser: fbUser,
        adminUser: adminDoc,
        isAdmin: true,
        customerProfile: customerDoc,
        user: adminProfile,
        isAuthenticated: true,
        needsProfileRecovery: false,
        pendingRegistrationProfile: null,
        isLoading: false,
      });
      return;
    }

    if (customerDoc) {
      useAuthStore.setState({
        firebaseUser: fbUser,
        adminUser: null,
        isAdmin: false,
        customerProfile: customerDoc,
        user: customerDoc,
        isAuthenticated: true,
        needsProfileRecovery: false,
        pendingRegistrationProfile: null,
        isLoading: false,
      });
      return;
    }

    // Firebase Auth user exists, but Firestore profile doc is missing (partial registration recovery state)
    useAuthStore.setState({
      firebaseUser: fbUser,
      adminUser: null,
      isAdmin: false,
      customerProfile: null,
      user: null,
      isAuthenticated: false,
      needsProfileRecovery: true,
      isLoading: false,
    });
  } catch (err) {
    console.warn('Error hydrating session from Firebase user:', err);
    useAuthStore.setState({ isLoading: false });
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  customerProfile: null,
  adminUser: null,
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  needsProfileRecovery: false,
  pendingRegistrationProfile: null,

  setUser: (user) => {
    set({
      user,
      customerProfile: user?.role === 'customer' ? user : get().customerProfile,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  setCustomerProfile: (customerProfile) => {
    set({
      customerProfile,
      user: customerProfile || get().user,
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

  login: async (email, password, rememberMe = true) => {
    const cleanEmail = normalizeEmail(email);
    authMutationInFlight += 1;
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCred.user;

      const [customerDoc, adminDoc] = await Promise.all([
        fetchCustomerDoc(fbUser.uid),
        fetchAdminDoc(fbUser.uid),
      ]);

      if (customerDoc && customerDoc.isActive === false && !adminDoc) {
        await signOut(auth).catch(() => {});
        set({
          firebaseUser: null,
          user: null,
          customerProfile: null,
          adminUser: null,
          isAuthenticated: false,
          isAdmin: false,
          needsProfileRecovery: false,
          isLoading: false,
        });
        throw new AuthAppError('app/account-disabled');
      }

      if (adminDoc) {
        const adminProfile: User = customerDoc || {
          uid: fbUser.uid,
          fullName: adminDoc.name || adminDoc.displayName || fbUser.displayName || 'مدير مانشيز',
          displayName: adminDoc.displayName || adminDoc.name || fbUser.displayName || 'مدير مانشيز',
          email: fbUser.email || cleanEmail,
          phone: fbUser.phoneNumber || adminDoc.phone || '01025707026',
          role: 'admin',
          isActive: true,
          preferredLanguage: 'ar',
          addresses: [],
          createdAt: adminDoc.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          firebaseUser: fbUser,
          adminUser: adminDoc,
          isAdmin: true,
          customerProfile: customerDoc,
          user: adminProfile,
          isAuthenticated: true,
          needsProfileRecovery: false,
          pendingRegistrationProfile: null,
          isLoading: false,
        });

        return { isAdmin: true, profileExists: true };
      }

      if (!customerDoc) {
        set({
          firebaseUser: fbUser,
          adminUser: null,
          isAdmin: false,
          customerProfile: null,
          user: null,
          isAuthenticated: false,
          needsProfileRecovery: true,
          isLoading: false,
        });
        return { isAdmin: false, profileExists: false };
      }

      // Sync email if updated externally
      if (fbUser.email && customerDoc.email !== normalizeEmail(fbUser.email)) {
        const syncedEmail = normalizeEmail(fbUser.email);
        await updateDoc(doc(db, 'users', fbUser.uid), {
          email: syncedEmail,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
        customerDoc.email = syncedEmail;
      }

      set({
        firebaseUser: fbUser,
        adminUser: null,
        isAdmin: false,
        customerProfile: customerDoc,
        user: customerDoc,
        isAuthenticated: true,
        needsProfileRecovery: false,
        pendingRegistrationProfile: null,
        isLoading: false,
      });

      return { isAdmin: false, profileExists: true };
    } finally {
      authMutationInFlight = Math.max(0, authMutationInFlight - 1);
    }
  },

  loginWithGoogle: async (rememberMe = true) => {
    authMutationInFlight += 1;
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });

      const userCred = await signInWithPopup(auth, provider);
      const fbUser = userCred.user;
      const additionalInfo = getAdditionalUserInfo(userCred);
      const cleanEmail = normalizeEmail(fbUser.email || '');

      if (!cleanEmail) {
        await signOut(auth).catch(() => {});
        throw new AuthAppError('app/missing-email');
      }

      const [customerDoc, adminDoc] = await Promise.all([
        fetchCustomerDoc(fbUser.uid),
        fetchAdminDoc(fbUser.uid),
      ]);

      if (customerDoc && customerDoc.isActive === false && !adminDoc) {
        await signOut(auth).catch(() => {});
        set({
          firebaseUser: null,
          user: null,
          customerProfile: null,
          adminUser: null,
          isAuthenticated: false,
          isAdmin: false,
          needsProfileRecovery: false,
          isLoading: false,
        });
        throw new AuthAppError('app/account-disabled');
      }

      if (adminDoc) {
        const adminProfile: User = customerDoc || {
          uid: fbUser.uid,
          fullName: adminDoc.name || adminDoc.displayName || fbUser.displayName || 'مدير مانشيز',
          displayName: adminDoc.displayName || adminDoc.name || fbUser.displayName || 'مدير مانشيز',
          email: cleanEmail,
          phone: extractOptionalEgyptianPhone(fbUser) || adminDoc.phone || '01025707026',
          photoURL: getSafePhotoURL(fbUser.photoURL),
          role: 'admin',
          isActive: true,
          preferredLanguage: 'ar',
          addresses: [],
          createdAt: adminDoc.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          firebaseUser: fbUser,
          adminUser: adminDoc,
          isAdmin: true,
          customerProfile: customerDoc,
          user: adminProfile,
          isAuthenticated: true,
          needsProfileRecovery: false,
          pendingRegistrationProfile: null,
          isLoading: false,
        });

        return { isAdmin: true, isNewAccount: false };
      }

      const safePhoto = getSafePhotoURL(fbUser.photoURL);

      // Existing customer signing in with Google
      if (customerDoc) {
        const updates: Record<string, unknown> = {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (customerDoc.email !== cleanEmail) {
          updates.email = cleanEmail;
          customerDoc.email = cleanEmail;
        }
        if (safePhoto && customerDoc.photoURL !== safePhoto) {
          updates.photoURL = safePhoto;
          customerDoc.photoURL = safePhoto;
        }
        await updateDoc(doc(db, 'users', fbUser.uid), updates).catch(() => {});

        set({
          firebaseUser: fbUser,
          adminUser: null,
          isAdmin: false,
          customerProfile: customerDoc,
          user: customerDoc,
          isAuthenticated: true,
          needsProfileRecovery: false,
          pendingRegistrationProfile: null,
          isLoading: false,
        });

        return { isAdmin: false, isNewAccount: Boolean(additionalInfo?.isNewUser) };
      }

      // First-time Google account creation -> create Firestore customer profile
      const cleanName = buildGoogleCustomerName(fbUser, cleanEmail);
      const cleanPhone = extractOptionalEgyptianPhone(fbUser);

      const profileDocData: Record<string, unknown> = {
        uid: fbUser.uid,
        fullName: cleanName,
        displayName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        role: 'customer',
        authProvider: 'google',
        isActive: true,
        preferredLanguage: 'ar',
        addresses: [],
        favouriteProductIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };
      if (safePhoto) {
        profileDocData.photoURL = safePhoto;
      }

      try {
        await setDoc(doc(db, 'users', fbUser.uid), profileDocData);
      } catch (firestoreErr) {
        console.error('Failed to create Google customer profile:', firestoreErr);
        set({
          firebaseUser: fbUser,
          user: null,
          customerProfile: null,
          adminUser: null,
          isAuthenticated: false,
          isAdmin: false,
          needsProfileRecovery: true,
          pendingRegistrationProfile: {
            fullName: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
          },
          isLoading: false,
        });
        throw new AuthAppError('app/profile-save-failed');
      }

      const savedProfile =
        (await fetchCustomerDoc(fbUser.uid).catch(() => null)) ||
        normalizeCustomerDoc(
          fbUser.uid,
          {
            ...profileDocData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          fbUser
        );

      set({
        firebaseUser: fbUser,
        user: savedProfile,
        customerProfile: savedProfile,
        adminUser: null,
        isAdmin: false,
        isAuthenticated: true,
        needsProfileRecovery: false,
        pendingRegistrationProfile: null,
        isLoading: false,
      });

      return { isAdmin: false, isNewAccount: true };
    } finally {
      authMutationInFlight = Math.max(0, authMutationInFlight - 1);
    }
  },

  register: async ({ fullName, phone, email, password }) => {
    const cleanName = normalizeFullName(fullName);
    const cleanPhone = normalizeEgyptianPhone(phone);
    const cleanEmail = normalizeEmail(email);

    authMutationInFlight += 1;
    try {
      await setPersistence(auth, browserLocalPersistence);

      // Partial-failure recovery: if Firebase Auth user was already created in this session
      // for the same email and their Firestore profile hasn't been saved yet, reuse it.
      let fbUser: FirebaseUser | null = auth.currentUser;
      const isRecoveringSameUser =
        fbUser !== null &&
        normalizeEmail(fbUser.email || '') === cleanEmail &&
        get().needsProfileRecovery;

      if (!isRecoveringSameUser) {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        fbUser = userCred.user;
      }

      if (!fbUser) {
        throw new AuthAppError('app/unauthenticated');
      }

      if (fbUser.displayName !== cleanName) {
        await updateProfile(fbUser, { displayName: cleanName });
      }

      const profileDocData = {
        uid: fbUser.uid,
        fullName: cleanName,
        displayName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        role: 'customer',
        authProvider: 'password',
        isActive: true,
        preferredLanguage: 'ar',
        addresses: [],
        favouriteProductIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'users', fbUser.uid), profileDocData);
      } catch (firestoreErr) {
        console.error('Failed to create customer Firestore profile:', firestoreErr);
        // Save pending metadata in memory (never password) so retry creates profile safely
        set({
          firebaseUser: fbUser,
          user: null,
          customerProfile: null,
          adminUser: null,
          isAuthenticated: false,
          isAdmin: false,
          needsProfileRecovery: true,
          pendingRegistrationProfile: {
            fullName: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
          },
          isLoading: false,
        });
        throw new AuthAppError('app/profile-save-failed');
      }

      // Fetch saved document (so serverTimestamp resolves cleanly) or construct local fallback
      const savedProfile =
        (await fetchCustomerDoc(fbUser.uid).catch(() => null)) ||
        normalizeCustomerDoc(
          fbUser.uid,
          {
            ...profileDocData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          fbUser
        );

      set({
        firebaseUser: fbUser,
        user: savedProfile,
        customerProfile: savedProfile,
        adminUser: null,
        isAdmin: false,
        isAuthenticated: true,
        needsProfileRecovery: false,
        pendingRegistrationProfile: null,
        isLoading: false,
      });
    } finally {
      authMutationInFlight = Math.max(0, authMutationInFlight - 1);
    }
  },

  completeProfileRecovery: async ({ fullName, phone }) => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      throw new AuthAppError('app/unauthenticated');
    }

    const cleanName = normalizeFullName(fullName);
    const cleanPhone = normalizeEgyptianPhone(phone);
    const cleanEmail = normalizeEmail(fbUser.email || '');

    authMutationInFlight += 1;
    try {
      if (fbUser.displayName !== cleanName) {
        await updateProfile(fbUser, { displayName: cleanName });
      }

      const profileDocData = {
        uid: fbUser.uid,
        fullName: cleanName,
        displayName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        role: 'customer',
        authProvider: 'password',
        isActive: true,
        preferredLanguage: 'ar',
        addresses: [],
        favouriteProductIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', fbUser.uid), profileDocData);

      const savedProfile =
        (await fetchCustomerDoc(fbUser.uid).catch(() => null)) ||
        normalizeCustomerDoc(
          fbUser.uid,
          {
            ...profileDocData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          fbUser
        );

      set({
        firebaseUser: fbUser,
        user: savedProfile,
        customerProfile: savedProfile,
        adminUser: null,
        isAdmin: false,
        isAuthenticated: true,
        needsProfileRecovery: false,
        pendingRegistrationProfile: null,
        isLoading: false,
      });
    } finally {
      authMutationInFlight = Math.max(0, authMutationInFlight - 1);
    }
  },

  logout: async () => {
    // 1. Attempt server-side refresh token revocation via Cloud Function (fire-and-forget failsafe)
    if (auth.currentUser) {
      try {
        const revokeFn = httpsCallable(functions, 'revokeUserSession');
        await withTimeout(revokeFn().catch(() => {}), 1500, null);
      } catch {
        // Non-blocking: proceed with client-side credential destruction
      }
    }

    // 2. Invalidate local session credentials from IndexedDB and memory
    try {
      await signOut(auth);
    } catch {
      // Ignore signOut errors if offline
    }

    // 3. Purge all authenticated state from client memory
    set({
      firebaseUser: null,
      user: null,
      customerProfile: null,
      adminUser: null,
      isAuthenticated: false,
      isAdmin: false,
      needsProfileRecovery: false,
      pendingRegistrationProfile: null,
      isLoading: false,
    });
  },

  resetPassword: async (email) => {
    const cleanEmail = normalizeEmail(email);
    try {
      const requestReset = httpsCallable(functions, 'requestPasswordResetToken');
      await requestReset({ email: cleanEmail });
    } catch (fnErr) {
      // Fallback to standard Firebase sendPasswordResetEmail if callable function is unavailable
      await sendPasswordResetEmail(auth, cleanEmail);
    }
    logPasswordResetRequest(cleanEmail).catch(() => {});
  },

  updateCustomerProfile: async ({ fullName, phone }) => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      throw new AuthAppError('app/unauthenticated');
    }

    const cleanName = normalizeFullName(fullName);
    const cleanPhone = normalizeEgyptianPhone(phone);

    await updateProfile(fbUser, { displayName: cleanName });

    const userRef = doc(db, 'users', fbUser.uid);
    await updateDoc(userRef, {
      fullName: cleanName,
      displayName: cleanName,
      phone: cleanPhone,
      updatedAt: serverTimestamp(),
    });

    const refreshed = await fetchCustomerDoc(fbUser.uid).catch(() => null);
    const current = get().customerProfile || get().user;
    const nextProfile: User =
      refreshed ||
      normalizeCustomerDoc(
        fbUser.uid,
        {
          ...(current || {}),
          fullName: cleanName,
          displayName: cleanName,
          phone: cleanPhone,
          updatedAt: new Date().toISOString(),
        },
        fbUser
      );

    set({
      customerProfile: nextProfile,
      user: get().isAdmin ? get().user : nextProfile,
    });
  },

  changeCustomerPassword: async (currentPassword, newPassword) => {
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.email) {
      throw new AuthAppError('app/unauthenticated');
    }
    if (currentPassword === newPassword) {
      throw new AuthAppError('app/same-password');
    }

    const credential = EmailAuthProvider.credential(fbUser.email, currentPassword);
    await reauthenticateWithCredential(fbUser, credential);
    await updatePassword(fbUser, newPassword);

    // Invalidate any active password reset tokens for this user
    try {
      const invalidateFn = httpsCallable(functions, 'invalidateUserPasswordResetTokens');
      await invalidateFn();
    } catch {
      // Non-blocking
    }

    logPasswordChange(fbUser.email).catch(() => {});
  },

  requestEmailChange: async (newEmail, currentPassword) => {
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.email) {
      throw new AuthAppError('app/unauthenticated');
    }

    const cleanNewEmail = normalizeEmail(newEmail);
    if (cleanNewEmail === normalizeEmail(fbUser.email)) {
      throw new AuthAppError('app/same-email');
    }

    const credential = EmailAuthProvider.credential(fbUser.email, currentPassword);
    await reauthenticateWithCredential(fbUser, credential);
    await verifyBeforeUpdateEmail(fbUser, cleanNewEmail);
  },

  refreshProfile: async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    await hydrateSessionFromFirebaseUser(fbUser);
  },
}));

// ─── Singleton Auth State Listener ────────────────────────────────────────────

let activeListeners = 0;
let unsubscribeFirebaseAuth: (() => void) | null = null;
let authReadyFallbackTimer: ReturnType<typeof setTimeout> | null = null;

function clearAuthReadyFallback() {
  if (authReadyFallbackTimer) {
    clearTimeout(authReadyFallbackTimer);
    authReadyFallbackTimer = null;
  }
}

function attachFirebaseAuthListener() {
  if (unsubscribeFirebaseAuth) return;

  try {
    // Failsafe: never allow initial auth loading state to hang indefinitely
    authReadyFallbackTimer = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        useAuthStore.setState({ isLoading: false });
      }
    }, 4000);

    unsubscribeFirebaseAuth = onAuthStateChanged(
      auth,
      async (fbUser) => {
        clearAuthReadyFallback();

        // If login() or register() is actively running, let it finalize the store state
        if (authMutationInFlight > 0) return;

        if (!fbUser) {
          useAuthStore.setState({
            firebaseUser: null,
            user: null,
            customerProfile: null,
            adminUser: null,
            isAuthenticated: false,
            isAdmin: false,
            needsProfileRecovery: false,
            isLoading: false,
          });
          return;
        }

        await hydrateSessionFromFirebaseUser(fbUser);
      },
      (error) => {
        clearAuthReadyFallback();
        console.warn('Firebase auth listener error:', error);
        useAuthStore.setState({ isLoading: false });
      }
    );
  } catch (err) {
    clearAuthReadyFallback();
    console.warn('Failed to attach Firebase auth listener:', err);
    useAuthStore.setState({ isLoading: false });
  }
}

// Automatically attach once in browser environments (prevents Vite HMR from stranding isLoading: true)
if (typeof window !== 'undefined') {
  attachFirebaseAuthListener();
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearAuthReadyFallback();
    if (unsubscribeFirebaseAuth) {
      unsubscribeFirebaseAuth();
      unsubscribeFirebaseAuth = null;
    }
    activeListeners = 0;
  });
}

/**
 * Initializes the single global Firebase `onAuthStateChanged` listener.
 * Safe against React StrictMode double-mounts and Vite HMR reloads.
 */
export function initAuthListener(): () => void {
  activeListeners += 1;
  attachFirebaseAuthListener();

  return () => {
    activeListeners = Math.max(0, activeListeners - 1);
    if (activeListeners === 0 && unsubscribeFirebaseAuth) {
      clearAuthReadyFallback();
      unsubscribeFirebaseAuth();
      unsubscribeFirebaseAuth = null;
    }
  };
}
