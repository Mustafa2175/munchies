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
      restaurantName: "مانشيز",
      restaurantTagline: "مزاجك للأكل؟ إحنا جاهزين!",
      currency: "ج.م",
      nav: {
        home: "الرئيسية",
        menu: "المنيو",
        buildYourOwn: "اصنع ساندوتشك",
        offers: "العروض",
        about: "عن مانشيز",
        contact: "تواصل معنا",
        orderNow: "اطلب الآن",
        cart: "السلة",
        login: "تسجيل الدخول",
        register: "إنشاء حساب",
        logout: "تسجيل الخروج",
        profile: "حسابي",
        orders: "طلباتي",
        admin: "لوحة التحكم"
      },
      actions: {
        add: "إضافة",
        addToCart: "أضف للسلة",
        customize: "تخصيص",
        checkout: "إتمام الطلب",
        viewCart: "عرض السلة",
        backToMenu: "العودة للمنيو",
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
        open: "مفتوح الآن",
        closed: "مغلق حالياً",
        available: "متاح",
        outOfStock: "نفذ مؤقتاً"
      },
      badges: {
        bestSeller: "الأكثر طلباً",
        new: "جديد",
        special: "مميز"
      },
      footer: {
        aboutText: "مطعم مانشيز بأسوان - أشهى ساندوتشات البرجر، الفات بير، وفرايز لوديد بأعلى جودة ولحوم بلدية طازجة 100%.",
        quickLinks: "روابط سريعة",
        contactUs: "الفرع والتواصل",
        location: "حديقة الورد أمام الراية – فرع الكورنيش، أسوان",
        phone: "01025707026",
        hours: "يومياً من 12:00 ظهراً حتى 3:00 فجراً",
        rights: "جميع الحقوق محفوظة لمطعم مانشيز © 2026",
        madeWith: "صنع بكل ❤️ في أسوان"
      }
    },
    menu: {
      title: "قائمة طعام مانشيز",
      subtitle: "اختر ما يروق لمزاجك من أطباقنا اللذيذة والطازجة",
      searchPlaceholder: "ابحث في السندوتشات، البرجر، الإضافات...",
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
      emptySearch: "لم يتم العثور على نتائج تطابق بحثك"
    },
    checkout: {
      title: "إتمام الطلب",
      pickupTitle: "استلام من المطعم (Pickup)",
      pickupSubtitle: "الفرع: حديقة الورد أمام الراية – فرع الكورنيش",
      pickupTiming: "أقرب وقت متاح (ASAP)",
      deliveryNotice: "خدمة التوصيل غير مفعلة حالياً ومتاحة قريباً في أسوان",
      cashNotice: "الدفع نقداً عند الاستلام",
      customerInfo: "بيانات العميل",
      fullName: "الاسم الكامل",
      mobile: "رقم الموبايل",
      email: "البريد الإلكتروني",
      notes: "ملاحظات إضافية للمطبخ",
      summary: "ملخص الحساب",
      subtotal: "المجموع الفرعي",
      deliveryFee: "رسوم التوصيل",
      free: "مجاني",
      discount: "الخصم",
      total: "الإجمالي المطلوب",
      submitOrder: "تأكيد وإرسال الطلب",
      emptyCart: "سلة المشتريات فارغة",
      emptyNotice: "أضف أشهى الساندوتشات والبطاطس لتبدأ طلبك الآن!",
      orderSuccess: "تم إرسال طلبك بنجاح!",
      orderNumber: "رقم الطلب",
      orderPlacedNotice: "تم استلام طلبك وبانتظار موافقة المطعم لبدء التحضير."
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

export default i18n;
