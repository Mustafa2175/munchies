/**
 * @module pages/admin/SettingsPage
 * @description Branch information, contact numbers, feature toggles strictly in Arabic.
 */

import React, { useState } from 'react';
import { Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [phone, setPhone] = useState('01025707026');
  const [address, setAddress] = useState('حديقة الورد أمام الراية – فرع الكورنيش، أسوان');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('تم حفظ إعدادات المطعم بنجاح');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#26212B]">إعدادات الفرع والنظام</h1>
        <p className="text-xs text-gray-500 mt-1">
          بيانات التواصل مع فرع أسوان، تفعيل وتعطيل خدمات التوصيل والميزات
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-base text-[#26212B] pb-2 border-b border-gray-100">
            بيانات الفرع والخط الساخن
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="رقم الهاتف والواتساب الخاص بالفرع"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="number-ltr"
            />
            <Input
              label="عنوان الفرع بالتفصيل"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </Card>

        {/* Feature Flags */}
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-base text-[#26212B] pb-2 border-b border-gray-100">
            طرق الاستلام والخدمات المفعلة
          </h3>

          <div className="flex items-center justify-between py-2">
            <div>
              <h4 className="text-xs font-bold text-gray-800">استلام من المطعم (Pickup)</h4>
              <p className="text-[11px] text-gray-500">
                يقوم الزبائن بالطلب أونلاين والاستلام مباشرة من فرع الكورنيش.
              </p>
            </div>
            <span className="text-xs font-bold text-[#27834B] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              مفعل ومتاح (المرحلة الأولى)
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <h4 className="text-xs font-bold text-gray-800">توصيل ديليفري (Delivery)</h4>
              <p className="text-[11px] text-gray-500">
                معطل حالياً لحين إعداد وتحديد مناطق ورسوم التوصيل بأسوان.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeliveryEnabled(!deliveryEnabled);
                toast(
                  deliveryEnabled
                    ? 'تم إيقاف خدمة التوصيل'
                    : 'تم تفعيل التوصيل (تنبيه: تأكد من ضبط رسوم المناطق)'
                );
              }}
              className="text-xs font-bold text-gray-500 hover:text-gray-700"
            >
              {deliveryEnabled ? (
                <ToggleRight className="w-8 h-8 text-[#512080]" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-300" />
              )}
            </button>
          </div>
        </Card>

        <Button type="submit" variant="primary" size="md" leftIcon={Save}>
          حفظ كافة التغييرات
        </Button>
      </form>
    </div>
  );
};
