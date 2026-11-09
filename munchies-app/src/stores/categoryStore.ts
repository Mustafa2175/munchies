/**
 * @module stores/categoryStore
 * @description Centralized Zustand store for menu categories with real-time sync.
 * Provides Firestore onSnapshot (cross-device), BroadcastChannel (cross-tab),
 * and localStorage persistence. Serves as the single source of truth for both
 * Admin and Customer, including category active/inactive state.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { CATEGORIES } from '@/data/mockData';
import type { Category } from '@/types';

/** Key used in localStorage for Zustand persist. */
const STORAGE_KEY = 'munchies_categories';

/** BroadcastChannel name for same-browser cross-tab sync. */
const CHANNEL_NAME = 'munchies_categories_sync';

/** Firestore collection path for categories. */
const FIRESTORE_COLLECTION = 'categories';

// ─── BroadcastChannel helpers ────────────────────────────────────────────────

let _channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!_channel) {
    _channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return _channel;
}

function broadcastCategories(categories: Category[]) {
  try {
    getChannel()?.postMessage({ type: 'CATEGORIES_UPDATED', categories });
  } catch {
    // ignore
  }
}

/** Asynchronously sync a category update to Firestore. */
async function syncCategoryToFirestore(categoryId: string, updates: Record<string, any>) {
  try {
    if (!db) return;
    const docRef = doc(db, FIRESTORE_COLLECTION, categoryId);
    await updateDoc(docRef, updates).catch(async () => {
      await setDoc(docRef, updates, { merge: true });
    });
  } catch {
    // Graceful fallback in offline/demo mode
  }
}

// ─── Store Interface ─────────────────────────────────────────────────────────

interface CategoryState {
  categories: Category[];

  // Actions
  setCategories: (categories: Category[]) => void;
  toggleCategoryActive: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;

  // Selectors
  getCategoryById: (id: string) => Category | undefined;
  getActiveCategories: () => Category[];
  isCategoryActive: (id: string) => boolean;
}

/**
 * Initialize from localStorage (supporting both the old raw array format
 * from CategoriesPage and the new Zustand persist shape).
 */
function getInitialCategories(): Category[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Old format: raw array saved by CategoriesPage
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: any) => ({
          ...c,
          isActive: c.isActive !== false,
        }));
      }
      // Zustand persist format
      if (parsed && Array.isArray(parsed.state?.categories) && parsed.state.categories.length > 0) {
        return parsed.state.categories.map((c: any) => ({
          ...c,
          isActive: c.isActive !== false,
        }));
      }
    }
  } catch {
    // fallback to mock data
  }
  return CATEGORIES.filter((c) => c.id !== 'all');
}

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: getInitialCategories(),

      setCategories: (categories) => {
        set({ categories });
        broadcastCategories(categories);
      },

      toggleCategoryActive: (id) => {
        const current = get().categories;
        const target = current.find((c) => c.id === id);
        if (!target) return;

        const newStatus = target.isActive === false ? true : false;
        const updated = current.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            isActive: newStatus,
            updatedAt: new Date().toISOString(),
          } as Category;
        });

        set({ categories: updated });
        broadcastCategories(updated);

        // Sync to Firestore
        syncCategoryToFirestore(id, {
          isActive: newStatus,
          updatedAt: new Date().toISOString(),
        });
      },

      addCategory: (category) => {
        const updated = [...get().categories, category];
        set({ categories: updated });
        broadcastCategories(updated);
        syncCategoryToFirestore(category.id, category as any);
      },

      updateCategory: (id, updates) => {
        const updated = get().categories.map((c) => {
          if (c.id !== id) return c;
          return { ...c, ...updates, updatedAt: new Date().toISOString() } as Category;
        });
        set({ categories: updated });
        broadcastCategories(updated);
        syncCategoryToFirestore(id, { ...updates, updatedAt: new Date().toISOString() });
      },

      removeCategory: (id) => {
        const updated = get().categories.filter((c) => c.id !== id);
        set({ categories: updated });
        broadcastCategories(updated);
      },

      getCategoryById: (id) => get().categories.find((c) => c.id === id),
      getActiveCategories: () => get().categories.filter((c) => c.isActive !== false),
      isCategoryActive: (id) => {
        const cat = get().categories.find((c) => c.id === id);
        return cat ? cat.isActive !== false : true;
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

// ── 1. BroadcastChannel listener: instant cross-tab sync ──
try {
  const ch = getChannel();
  if (ch) {
    ch.addEventListener('message', (event) => {
      if (event.data?.type === 'CATEGORIES_UPDATED' && Array.isArray(event.data.categories)) {
        useCategoryStore.setState({ categories: event.data.categories });
      }
    });
  }
} catch {
  // Graceful degradation
}

// ── 2. Storage event listener: fallback cross-tab sync ──
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.state?.categories)
          ? parsed.state.categories
          : null;
        if (list && Array.isArray(list)) {
          useCategoryStore.setState({ categories: list });
        }
      } catch {
        // ignore
      }
    }
  });
}

// ── 3. Firestore onSnapshot real-time listener (cross-device sync) ──
try {
  if (db) {
    onSnapshot(
      collection(db, FIRESTORE_COLLECTION),
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreMap = new Map<string, any>();
          snapshot.forEach((docSnap) => {
            firestoreMap.set(docSnap.id, docSnap.data());
          });

          const current = useCategoryStore.getState().categories;
          let changed = false;
          const merged = current.map((c) => {
            const remote = firestoreMap.get(c.id);
            if (remote && typeof remote.isActive === 'boolean') {
              if ((c.isActive !== false) !== remote.isActive) {
                changed = true;
                return { ...c, ...remote, isActive: remote.isActive } as Category;
              }
            }
            return c;
          });

          if (changed) {
            useCategoryStore.setState({ categories: merged });
          }
        }
      },
      (err) => {
        console.warn('Firestore category sync info:', err.message);
      }
    );
  }
} catch {
  // Graceful degradation
}

// ─── Convenient Utility Hooks & Functions ────────────────────────────────────

/**
 * Synchronously checks if a category is active from current store state.
 */
export function isCategoryActive(categoryId?: string): boolean {
  if (!categoryId || categoryId === 'all') return true;
  const cat = useCategoryStore.getState().categories.find((c) => c.id === categoryId);
  return cat ? cat.isActive !== false : true;
}

/**
 * React hook to reactively check if a specific category is active.
 */
export function useIsCategoryActive(categoryId?: string): boolean {
  return useCategoryStore((s) => {
    if (!categoryId || categoryId === 'all') return true;
    const cat = s.categories.find((c) => c.id === categoryId);
    return cat ? cat.isActive !== false : true;
  });
}

/**
 * Returns the Arabic name of a category by ID.
 */
export function getCategoryName(categoryId?: string): string {
  if (!categoryId || categoryId === 'all') return 'الكل';
  const cat = useCategoryStore.getState().categories.find((c) => c.id === categoryId);
  return cat?.name?.ar || categoryId;
}


