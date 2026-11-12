/**
 * @module lib/i18n
 * @description Internationalization setup supporting Arabic (RTL default) and English (LTR).
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { SupportedLanguage } from '@/config/constants';

export const defaultNS = 'common';

export const resources = {
  ar: {
    common: {
      restaurantName: "Munchie's",
      restaurantTagline: "لو كبير عليك، اضغطه! 🍔",
      currency: "ج.م",
      nav: {
        home: "الرئيسية",
        menu: "المنيو",
        buildYourOwn: "اعمل ساندوتشك",
        offers: "العروض",
        about: "حكايتنا",
        contact: "كلمنا",
        orderNow: "اطلب دلوقتي",
        viewMenu: "شوف المنيو",
        cart: "السلة",
        login: "تسجيل الدخول",
        register: "حساب جديد",
        logout: "تسجيل خروج",
        profile: "حسابي",
        orders: "طلباتي",
        admin: "لوحة التحكم",
      },
      actions: {
        add: "إضافة",
        addToCart: "ضيف للسلة",
        customize: "ظبط طلبك على مزاجك",
        checkout: "كمّل طلبك",
        viewCart: "شوف السلة",
        backToMenu: "ارجع للمنيو",
        backToHome: "ارجع للرئيسية",
        close: "إغلاق",
        cancel: "إلغاء",
        confirm: "تأكيد",
        save: "حفظ",
        edit: "تعديل",
        delete: "حذف",
        search: "بحث",
        apply: "تطبيق",
      },
      status: {
        open: "مفتوح دلوقتي",
        closed: "معلش، إحنا قافلين دلوقتي. راجعنا قريب!",
        loading: "بنجهزلك كل حاجة...",
        available: "متاح",
        outOfStock: "خلص مننا مؤقتًا",
      },
      badges: {
        bestSeller: "الأكثر طلباً",
        new: "جديد",
        special: "مميز",
      },
      footer: {
        aboutText: "مطعم مانشيز في أسوان – أشهى ساندوتشات البرجر، الفات بير، والـ Loaded Fries بأعلى جودة ولحوم بلدية طازة 100%.",
        quickLinks: "روابط سريعة",
        contactUs: "الفرع والتواصل",
        location: "حديقة الورد أمام الراية – فرع الكورنيش، أسوان",
        phone: "01025707026",
        hours: "يومياً من 12:00 ظهراً حتى 3:00 فجراً",
        rights: "جميع الحقوق محفوظة لـ Munchie's © 2026",
        madeWith: "صُنع بكل ❤️ في أسوان",
      },
    },
    menu: {
      title: "منيو مانشيز",
      subtitle: "اختار اللي على مزاجك، وإحنا هنجهزهولك Fresh وسخن!",
      searchPlaceholder: "بتدور على حاجة معينة؟ اكتب اسمها هنا...",
      allCategories: "الكل",
      categories: {
        burgers: "برجر",
        sandwiches: "سندوتشات",
        fatBurger: "فات بير برجر",
        vipMenu: "VIP منيو",
        friesCup: "فرايز كب",
        friesCono: "فرايز كونو",
        other: "أصناف خاصة",
        additions: "إضافات",
      },
      emptySearch: "ملقيناش اللي بتدور عليه!",
      emptySearchSuggestion: "جرّب تدور بكلمة تانية.",
    },
    checkout: {
      title: "يلا نكمّل طلبك!",
      pickupTitle: "Pickup – استلام من الفرع",
      deliveryTitle: "Delivery – توصيل لحد عندك",
      pickupSubtitle: "الفرع: حديقة الورد أمام الراية – فرع الكورنيش",
      pickupTiming: "في أقرب وقت متاح",
      deliveryNotice: "خدمة الـ Delivery مش شغالة دلوقتي.. متاحة قريب في أسوان",
      cashNotice: "الدفع كاش عند الاستلام",
      customerInfo: "بياناتك",
      fullName: "اسمك إيه؟",
      mobile: "رقم موبايلك",
      email: "الإيميل",
      notes: "عندك أي ملاحظات على الطلب؟",
      summary: "ملخص طلبك",
      subtotal: "المجموع",
      deliveryFee: "رسوم التوصيل",
      free: "مجاني",
      discount: "الخصم",
      total: "الإجمالي",
      submitOrder: "أكّد الطلب",
      processing: "بنأكد طلبك...",
      emptyCart: "السلة لسه فاضية!",
      emptyNotice: "لسه مستني إيه؟ اختار أكلك المفضل وابدأ طلبك.",
      orderSuccess: "متقلقش، طلبك وصلنا!",
      orderNumber: "رقم الطلب",
      orderPlacedNotice: "استلمنا طلبك وفي انتظار تأكيد المطعم عشان نبدأ نجهزه.",
    },
  },
  en: {
    common: {
      restaurantName: "Munchie's",
      restaurantTagline: "Too Big? Smash It! 🍔",
      currency: "EGP",
      nav: {
        home: "Home",
        menu: "Menu",
        buildYourOwn: "Build Your Own",
        offers: "Offers",
        about: "Our Story",
        contact: "Contact Us",
        orderNow: "Order Now",
        viewMenu: "View Menu",
        cart: "Cart",
        login: "Sign In",
        register: "Create Account",
        logout: "Log Out",
        profile: "My Account",
        orders: "My Orders",
        admin: "Admin Portal",
      },
      actions: {
        add: "Add",
        addToCart: "Add to Cart",
        customize: "Customize Your Order",
        checkout: "Proceed to Checkout",
        viewCart: "View Cart",
        backToMenu: "Back to Menu",
        backToHome: "Back to Home",
        close: "Close",
        cancel: "Cancel",
        confirm: "Confirm",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        search: "Search",
        apply: "Apply",
      },
      status: {
        open: "Open Now",
        closed: "Sorry, we are currently closed. Check back soon!",
        loading: "Getting everything ready...",
        available: "Available",
        outOfStock: "Temporarily Out of Stock",
      },
      badges: {
        bestSeller: "Best Seller",
        new: "New",
        special: "Special",
      },
    },
  },
};

const savedLang = (() => {
  try {
    const val = localStorage.getItem('i18nextLng');
    return val === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
})();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'ar',
    defaultNS,
    interpolation: {
      escapeValue: false,
    },
  });

export function updateDocumentDirection(lang?: string) {
  if (typeof document === 'undefined') return;
  const active = lang === 'en' || (!lang && i18n.language === 'en') ? 'en' : 'ar';
  document.documentElement.setAttribute('dir', active === 'en' ? 'ltr' : 'rtl');
  document.documentElement.setAttribute('lang', active);
}

export function setAppLanguage(lang: SupportedLanguage) {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem('i18nextLng', lang);
  } catch {
    // ignore storage errors
  }
  updateDocumentDirection(lang);
}

updateDocumentDirection(savedLang);

/**
 * Safely resolves any string, LocalizedText, or nested object to a displayable string.
 * Guaranteed to NEVER return an object so React never throws "Objects are not valid as a React child".
 */
export function getLocalizedText(val: unknown, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const preferEn = i18n.language === 'en';
    if (preferEn) {
      if (typeof obj.en === 'string' && obj.en.trim()) return obj.en;
      if (typeof obj.ar === 'string' && obj.ar.trim()) return obj.ar;
    } else {
      if (typeof obj.ar === 'string' && obj.ar.trim()) return obj.ar;
      if (typeof obj.en === 'string' && obj.en.trim()) return obj.en;
    }
    if (obj.name) return getLocalizedText(obj.name, fallback);
    if (obj.title) return getLocalizedText(obj.title, fallback);
    if (obj.label) return getLocalizedText(obj.label, fallback);
  }
  return fallback;
}

export default i18n;
