/**
 * @module lib/i18n
 * @description Internationalization setup locked strictly to Arabic (RTL).
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
        buildYourOwn: "اصنع ساندوتشك",
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
        admin: "لوحة التحكم"
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
        apply: "تطبيق"
      },
      status: {
        open: "مفتوح دلوقتي",
        closed: "معلش، إحنا قافلين دلوقتي. راجعنا قريب!",
        loading: "بنجهزلك كل حاجة...",
        available: "متاح",
        outOfStock: "خلص مننا مؤقتًا"
      },
      badges: {
        bestSeller: "الأكثر طلباً",
        new: "جديد",
        special: "مميز"
      },
      footer: {
        aboutText: "مطعم مانشيز في أسوان – أشهى ساندوتشات البرجر، الفات بير، والـ Loaded Fries بأعلى جودة ولحوم بلدية طازة 100%.",
        quickLinks: "روابط سريعة",
        contactUs: "الفرع والتواصل",
        location: "حديقة الورد أمام الراية – فرع الكورنيش، أسوان",
        phone: "01025707026",
        hours: "يومياً من 12:00 ظهراً حتى 3:00 فجراً",
        rights: "جميع الحقوق محفوظة لـ Munchie's © 2026",
        madeWith: "صُنع بكل ❤️ في أسوان"
      }
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
        additions: "إضافات"
      },
      emptySearch: "ملقيناش اللي بتدور عليه!",
      emptySearchSuggestion: "جرّب تدور بكلمة تانية."
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
      orderPlacedNotice: "استلمنا طلبك وفي انتظار تأكيد المطعم عشان نبدأ نجهزه."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar',
    fallbackLng: 'ar',
    defaultNS,
    interpolation: {
      escapeValue: false,
    },
  });

// Always lock language to Arabic and clean any old cache
try {
  localStorage.setItem('i18nextLng', 'ar');
} catch {}

export function updateDocumentDirection() {
  document.documentElement.setAttribute('dir', 'rtl');
  document.documentElement.setAttribute('lang', 'ar');
}

updateDocumentDirection();

/**
 * Safely resolves any string, LocalizedText, or nested object to a displayable Arabic string.
 * Guaranteed to NEVER return an object so React never throws "Objects are not valid as a React child".
 */
export function getLocalizedText(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (typeof val.ar === 'string' && val.ar.trim()) return val.ar;
    if (typeof val.en === 'string' && val.en.trim()) return val.en;
    if (val.name) return getLocalizedText(val.name, fallback);
    if (val.title) return getLocalizedText(val.title, fallback);
    if (val.label) return getLocalizedText(val.label, fallback);
  }
  return fallback;
}

export default i18n;
