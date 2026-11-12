/**
 * @module pages/admin/SettingsPage
 * @description Branch information, contact numbers, feature toggles strictly in Arabic.
 */

import React, { useState, useEffect } from 'react';
import { Save, ToggleLeft, ToggleRight, Truck, Store, Phone, Banknote } from 'lucide-react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getLocalizedText } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { logAdminAction } from '@/lib/auditLogger';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number>(25);
  const [phone, setPhone] = useState('01025707026');
  const [address, setAddress] = useState('حديقة الورد أمام الراية – فرع الكورنيش، أسوان');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load restaurant settings from Firestore in real-time
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'restaurant'),
      (snap) => {
        setIsLoading(false);
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.deliveryEnabled === 'boolean') {
            setDeliveryEnabled(data.deliveryEnabled);
          }
          if (typeof data.deliveryFee === 'number') {
            setDeliveryFee(data.deliveryFee);
          }
          if (data.phone) setPhone(String(data.phone));
          if (data.address) {
            setAddress(getLocalizedText(data.address, 'حديقة الورد أمام الراية – فرع الكورنيش، أسوان'));
          }
        }
      },
      (error) => {
        console.warn('Failed to subscribe to settings/restaurant:', error);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await setDoc(
        doc(db, 'settings', 'restaurant'),
        {
          deliveryEnabled,
          deliveryFee: Number(deliveryFee) || 25,
          phone: phone.trim(),
          address: address.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      logAdminAction(
        'update_settings',
        'settings',
        'restaurant',
        'تحديث إعدادات الفرع والتوصيل',
        {
          deliveryEnabled,
          deliveryFee: Number(deliveryFee) || 25,
          phone: phone.trim(),
        }
      ).catch(() => {});

      toast.success('تم حفظ إعدادات المطعم والتوصيل بنجاح');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      toast.error('حدث خطأ أثناء حفظ الإعدادات، يرجى التحقق من الصلاحيات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-dark">إعدادات الفرع والنظام</h1>
        <p className="text-xs text-gray-500 mt-1">
          بيانات التواصل مع فرع أسوان، تفعيل وتعطيل خدمات التوصيل والميزات
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Branch Info Card */}
          <Card className="xl:col-span-5 p-6 space-y-4">
            <h3 className="font-bold text-base text-dark pb-2 border-b border-gray-100 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <span>بيانات الفرع والخط الساخن</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            <Input
              label="رقم الهاتف والواتساب الخاص بالفرع"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="number-ltr tabular-nums"
              required
            />
            <Input
              label="عنوان الفرع بالتفصيل"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
        </Card>

          {/* Feature Flags: Fulfillment Types */}
          <Card className="xl:col-span-7 p-6 space-y-5">
          <h3 className="font-bold text-base text-dark pb-2 border-b border-gray-100 flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            <span>طرق الاستلام والخدمات المفعلة</span>
          </h3>

          {/* Pickup option */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">استلام من المطعم (Pickup)</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  يقوم الزبائن بالطلب أونلاين والاستلام مباشرة من فرع الكورنيش أمام الراية.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shrink-0">
              مفعل ومتاح دائماً
            </span>
          </div>

          {/* Delivery option toggle */}
          <div className="flex items-center justify-between py-4 border-t border-gray-100">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                deliveryEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Truck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-sm font-bold text-gray-800">توصيل ديليفري (Delivery)</h4>
                  <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    deliveryEnabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {deliveryEnabled ? 'مفعل ومتاح في أسوان' : 'معطل حالياً'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {deliveryEnabled
                    ? 'خدمة التوصيل مفعلة حالياً ومتاحة لجميع العملاء في أسوان على صفحة إتمام الطلب.'
                    : 'معطل حالياً لحين إعداد وتحديد مناطق ورسوم التوصيل بأسوان (ستظهر بطاقة التوصيل معطلة للزبائن).'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !deliveryEnabled;
                setDeliveryEnabled(next);
                toast(
                  next
                    ? 'تم تفعيل خدمة التوصيل (لا تنسَ الضغط على حفظ التغييرات)'
                    : 'تم إيقاف خدمة التوصيل (لا تنسَ الضغط على حفظ التغييرات)'
                );
              }}
              className="text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer p-1"
              title={deliveryEnabled ? 'إيقاف خدمة التوصيل' : 'تفعيل خدمة التوصيل'}
            >
              {deliveryEnabled ? (
                <ToggleRight className="w-10 h-10 text-emerald-600 hover:text-emerald-700 transition-colors" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-300 hover:text-gray-400 transition-colors" />
              )}
            </button>
          </div>

          {/* Delivery Fee Input (Only visible when delivery is enabled) */}
          {deliveryEnabled && (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>رسوم التوصيل الافتراضية داخل أسوان</span>
              </div>
              <div className="max-w-xs">
                <Input
                  label="رسوم التوصيل (ج.م)"
                  type="number"
                  min="0"
                  step="5"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                  className="number-ltr font-bold tabular-nums"
                />
              </div>
              <p className="text-[11px] text-gray-500">
                سيتم إضافة هذا المبلغ تلقائياً لملخص الحساب عند اختيار العميل لخدمة التوصيل.
              </p>
            </div>
          )}
          </Card>
        </div>

        <Button
          type="submit"
          variant="yellow"
          size="md"
          isLoading={isSaving}
          leftIcon={Save}
          className="font-black px-6 shadow-md shadow-yellow/20"
        >
          حفظ كافة التغييرات
        </Button>
      </form>
    </div>
  );
};
