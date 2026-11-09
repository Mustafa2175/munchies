/**
 * @module stores/productStore
 * @description Centralized Zustand store for products with localStorage persistence,
 * BroadcastChannel instant cross-tab sync, and optional Firestore live sync.
 * Serves as the single source of truth for both Admin and Customer interfaces.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collection, doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { PRODUCTS } from '@/data/mockData';
import type { Product } from '@/types';
import { useCartStore } from './cartStore';
import toast from 'react-hot-toast';

/** Key used in localStorage — shared with legacy admin code. */
const STORAGE_KEY = 'munchies_custom_products';

/** BroadcastChannel name for same-browser cross-tab sync. */
const CHANNEL_NAME = 'munchies_products_sync';

/**
 * Robust availability check that normalizes and handles all potential field names:
 * isAvailable, is_available, available, inStock, isActive.
 */
export function isProductAvailable(item?: Record<string, any> | null): boolean {
  if (!item) return false;
  if (item.isAvailable === false) return false;
  if (item.is_available === false) return false;
  if (item.available === false) return false;
  if (item.inStock === false) return false;
  if (item.isActive === false) return false;
  return true;
}

/**
 * Normalizes an object with all known availability keys set to the given boolean.
 */
function normalizeAvailability<T extends Record<string, any>>(product: T, available: boolean): T {
  return {
    ...product,
    isAvailable: available,
    is_available: available,
    available: available,
    inStock: available,
  };
}

/**
 * Inspects items in the cart against current product availability.
 * If any cart item is now unavailable, automatically removes it from the cart
 * and alerts the customer with a toast notification.
 */
export function syncCartWithProductAvailability(products: Product[]): void {
  try {
    const cart = useCartStore.getState();
    if (!cart || !cart.items || cart.items.length === 0) return;

    const removedItems: string[] = [];
    cart.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && !isProductAvailable(prod)) {
        cart.removeItem(item.id);
        const name = typeof item.name === 'object' && item.name?.ar ? item.name.ar : 'الصنف';
        removedItems.push(name);
      }
    });

    if (removedItems.length > 0) {
      removedItems.forEach((name) => {
        toast.error(`تمت إزالة "${name}" من سلة المشتريات لأنه أصبح غير متوفر حالياً`, {
          id: `unavailable-${name}`,
          duration: 4500,
        });
      });
    }
  } catch (err) {
    console.warn('Error syncing cart with product availability:', err);
  }
}

interface ProductState {
  products: Product[];

  // Actions
  setProducts: (products: Product[]) => void;
  toggleAvailability: (id: string) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;

  // Selectors / Getters
  getProductById: (id: string) => Product | undefined;
  getBestSellers: () => Product[];
  getByCategory: (categoryId: string) => Product[];
}

/**
 * Initialize from localStorage (supporting both raw array and Zustand persist shape).
 */
function getInitialProducts(): Product[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => normalizeAvailability(p, isProductAvailable(p)));
      }
      if (parsed && Array.isArray(parsed.state?.products) && parsed.state.products.length > 0) {
        return parsed.state.products.map((p: any) =>
          normalizeAvailability(p, isProductAvailable(p))
        );
      }
    }
  } catch {
    // fallback to mock data
  }
  return PRODUCTS.map((p) => normalizeAvailability(p, isProductAvailable(p)));
}

/** Lazily created BroadcastChannel for instant same-browser cross-tab sync. */
let _channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!_channel) {
    _channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return _channel;
}

function broadcastProducts(products: Product[]) {
  try {
    getChannel()?.postMessage({ type: 'PRODUCTS_UPDATED', products });
  } catch {
    // ignore
  }
}

/** Asynchronously sync availability changes to Firestore if connected */
async function syncToFirestore(productId: string, updates: Record<string, any>) {
  try {
    if (!db) return;
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, updates).catch(async () => {
      // If doc does not exist, set with merge
      await setDoc(docRef, updates, { merge: true });
    });
  } catch {
    // Graceful fallback in offline/demo mode
  }
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: getInitialProducts(),

      setProducts: (products) => {
        const normalized = products.map((p) =>
          normalizeAvailability(p, isProductAvailable(p))
        );
        set({ products: normalized });
        broadcastProducts(normalized);
        syncCartWithProductAvailability(normalized);
      },

      toggleAvailability: (id) => {
        const currentProducts = get().products;
        const target = currentProducts.find((p) => p.id === id);
        if (!target) return;

        const newStatus = !isProductAvailable(target);
        const updated = currentProducts.map((p) => {
          if (p.id !== id) return p;
          return normalizeAvailability(
            {
              ...p,
              updatedAt: new Date().toISOString(),
            },
            newStatus
          );
        });

        set({ products: updated });
        broadcastProducts(updated);
        syncCartWithProductAvailability(updated);

        // Async sync to Firestore
        syncToFirestore(id, {
          isAvailable: newStatus,
          is_available: newStatus,
          available: newStatus,
          inStock: newStatus,
          updatedAt: new Date().toISOString(),
        });
      },

      updateProduct: (id, updates) => {
        const updated = get().products.map((p) => {
          if (p.id !== id) return p;
          const merged = { ...p, ...updates, updatedAt: new Date().toISOString() };
          const avail = updates.isAvailable !== undefined ? updates.isAvailable : isProductAvailable(merged);
          return normalizeAvailability(merged, avail);
        });

        set({ products: updated });
        broadcastProducts(updated);
        syncCartWithProductAvailability(updated);

        syncToFirestore(id, { ...updates, updatedAt: new Date().toISOString() });
      },

      addProduct: (product) => {
        const normalized = normalizeAvailability(product, isProductAvailable(product));
        const updated = [normalized, ...get().products];
        set({ products: updated });
        broadcastProducts(updated);
        syncToFirestore(normalized.id, normalized);
      },

      removeProduct: (id) => {
        const updated = get().products.filter((p) => p.id !== id);
        set({ products: updated });
        broadcastProducts(updated);
      },

      getProductById: (id) => get().products.find((p) => p.id === id),
      getBestSellers: () => get().products.filter((p) => p.isBestSeller),
      getByCategory: (categoryId) =>
        categoryId === 'all'
          ? get().products
          : get().products.filter((p) => p.categoryId === categoryId),
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => {
        return (state, error) => {
          if (!error && state?.products) {
            syncCartWithProductAvailability(state.products);
          }
        };
      },
    }
  )
);

// ── 1. BroadcastChannel listener: when another tab updates products ──
try {
  const ch = getChannel();
  if (ch) {
    ch.addEventListener('message', (event) => {
      if (event.data?.type === 'PRODUCTS_UPDATED' && Array.isArray(event.data.products)) {
        useProductStore.setState({ products: event.data.products });
        syncCartWithProductAvailability(event.data.products);
      }
    });
  }
} catch {
  // Graceful degradation
}

// ── 2. Storage event listener: fallback when BroadcastChannel isn't used ──
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.state?.products)
          ? parsed.state.products
          : null;
        if (list && Array.isArray(list)) {
          const normalized = list.map((p) => normalizeAvailability(p, isProductAvailable(p)));
          useProductStore.setState({ products: normalized });
          syncCartWithProductAvailability(normalized);
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
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreMap = new Map<string, any>();
          snapshot.forEach((docSnap) => {
            firestoreMap.set(docSnap.id, docSnap.data());
          });

          const current = useProductStore.getState().products;
          let changed = false;
          const merged = current.map((p) => {
            const remote = firestoreMap.get(p.id);
            if (remote) {
              const remoteAvail = isProductAvailable(remote);
              if (isProductAvailable(p) !== remoteAvail) {
                changed = true;
                return normalizeAvailability({ ...p, ...remote }, remoteAvail);
              }
            }
            return p;
          });

          if (changed) {
            useProductStore.setState({ products: merged });
            syncCartWithProductAvailability(merged);
          }
        }
      },
      (err) => {
        // Non-fatal if offline or Firestore collection does not exist yet
        console.warn('Firestore live product sync info:', err.message);
      }
    );
  }
} catch {
  // Graceful degradation
}
