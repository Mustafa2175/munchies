/**
 * @module stores/offerStore
 * @description Centralized Zustand store for promotional offers with real-time Firestore sync.
 * Provides live onSnapshot listener from Firestore 'offers' collection with graceful
 * fallback to default curated offers.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { LocalizedText } from '@/types';

export interface PromotionOffer {
  id: string;
  title: LocalizedText | string;
  description: LocalizedText | string;
  badge?: LocalizedText | string;
  price?: number;
  originalPrice?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  image?: string;
  imageUrl?: string;
  code?: string;
  couponCode?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'munchies_offers_storage';

// Default authentic offers matching Munchie's promotions
export const DEFAULT_OFFERS: PromotionOffer[] = [
  {
    id: 'offer-munchies-combo',
    title: {
      ar: '2 برجر + بطاطس + مشروب',
      en: '2 Burgers + Fries + Drink',
    },
    description: {
      ar: 'وجبة التوفير العائلية: ٢ برجر بلدي مع صوص مانشيز السري، عبوة بطاطس مقرمشة، ومشروب غازي بارد.',
      en: 'Family value meal: 2 burgers with special Munchies sauce, crispy fries box and cold drink.',
    },
    badge: {
      ar: 'عرض توفير مانشيز',
      en: "Munchie's Saver Offer",
    },
    price: 249,
    originalPrice: 310,
    discountType: 'fixed',
    discountValue: 61,
    image: '/hero_burger_clean_cutout.png',
    imageUrl: '/hero_burger_clean_cutout.png',
    code: 'COMBO249',
    isActive: true,
  },
  {
    id: 'offer-fat-duo',
    title: {
      ar: 'عرض دبل فات بير',
      en: 'Fat Burger Duo Offer',
    },
    description: {
      ar: 'اطلب 2 ساندوتش فات بير واحصل على فرايز كب صوص ولتر كولا بسعر توفيري خاص.',
      en: 'Order 2 Fat Burgers and get cheese fries cup + 1L drink at a special price.',
    },
    badge: {
      ar: 'وفر 15%',
      en: 'Save 15%',
    },
    price: 295,
    originalPrice: 350,
    discountType: 'percentage',
    discountValue: 15,
    image: '/hero_burger_perfect.png',
    imageUrl: '/hero_burger_perfect.png',
    code: 'FATDUO',
    isActive: true,
  },
  {
    id: 'offer-golden-combo',
    title: {
      ar: 'كومبو بطاطس + كولا',
      en: 'Fries + Cola Combo',
    },
    description: {
      ar: 'اطلب أي برجر أو ساندوتش وأضف كومبو الفرايز والكولا بـ 35 جنيه بس بدلاً من 55 جنيه!',
      en: 'Add crispy fries and cola combo to any sandwich for only 35 EGP instead of 55 EGP!',
    },
    badge: {
      ar: 'توفير 20 جنيه',
      en: 'Save 20 EGP',
    },
    price: 35,
    originalPrice: 55,
    discountType: 'fixed',
    discountValue: 20,
    image: '/hero_food_blended.png',
    imageUrl: '/hero_food_blended.png',
    code: 'COMBO35',
    isActive: true,
  },
];

interface OfferState {
  offers: PromotionOffer[];
  isLoading: boolean;
  setOffers: (offers: PromotionOffer[]) => void;
  getActiveOffers: () => PromotionOffer[];
}

export function isOfferValid(offer: PromotionOffer): boolean {
  if (offer.isActive === false) return false;
  if (offer.endDate) {
    const end = new Date(offer.endDate);
    if (!isNaN(end.getTime()) && end.getTime() < Date.now()) {
      return false;
    }
  }
  return true;
}

export const useOfferStore = create<OfferState>()(
  persist(
    (set, get) => ({
      offers: DEFAULT_OFFERS,
      isLoading: false,

      setOffers: (offers) => set({ offers, isLoading: false }),

      getActiveOffers: () => {
        return get().offers.filter(isOfferValid);
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

// Real-time Firestore sync
try {
  if (db) {
    onSnapshot(
      collection(db, 'offers'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedOffers: PromotionOffer[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loadedOffers.push({
              id: docSnap.id,
              ...data,
              isActive: data.isActive !== false,
            } as PromotionOffer);
          });

          if (loadedOffers.length > 0) {
            useOfferStore.setState({ offers: loadedOffers, isLoading: false });
          }
        }
      },
      (err) => {
        // Non-fatal if offline
        console.warn('Firestore offers sync note:', err.message);
      }
    );
  }
} catch {
  // Graceful degradation
}

