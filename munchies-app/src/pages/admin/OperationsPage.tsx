/**
 * @module pages/admin/OperationsPage
 * @description Working hours schedule and emergency manual closure switch strictly in Arabic.
 * Synced in real-time with Firestore, BroadcastChannel, and customer storefront.
 */

import React, { useState, useEffect } from 'react';
import { Power, Save, Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRestaurantStore, type WorkingHoursEntry } from '@/stores/restaurantStore';
import toast from 'react-hot-toast';

export const OperationsPage: React.FC = () => {
  const storeIsManualClosed = useRestaurantStore((state) => state.isManualClosed);
  const storeClosureMessage = useRestaurantStore((state) => state.closureMessage);
  const storeWorkingHours = useRestaurantStore((state) => state.workingHours);
  const toggleManualClosure = useRestaurantStore((state) => state.toggleManualClosure);
  const saveScheduleToFirestore = useRestaurantStore((state) => state.saveScheduleToFirestore);

  // Local editing state for schedule & message
  const [closureMessage, setClosureMessage] = useState(storeClosureMessage);
  const [schedule, setSchedule] = useState<WorkingHoursEntry[]>(storeWorkingHours);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isTogglingClosure, setIsTogglingClosure] = useState(false);

  // Keep local state in sync when remote Firestore store updates
  useEffect(() => {
    setClosureMessage(storeClosureMessage);
  }, [storeClosureMessage]);

  useEffect(() => {
    setSchedule(storeWorkingHours);
  }, [storeWorkingHours]);

  const handleToggleManualClosure = async () => {
    setIsTogglingClosure(true);
    const nextState = !storeIsManualClosed;
    try {
      await toggleManualClosure(nextState, closureMessage);
      toast.success(
        nextState
          ? 'تم إيقاف استقبال الطلبات يدوياً فوراً في كافة صفحات الزبائن.'
          : 'تمت إعادة فتح استقبال الطلبات والعودة للجدول التلقائي بنجاح.'
      );
    } catch {
      toast.error('حدث خطأ أثناء تحديث حالة التشغيل');
    } finally {
      setIsTogglingClosure(false);
    }
  };

  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      await saveScheduleToFirestore(schedule);
      toast.success('تم حفظ جدول المواعيد وتحديث النظام بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء حفظ جدول المواعيد');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#26212B]">تشغيل المطعم وساعات العمل</h1>
        <p className="text-xs text-gray-500 mt-1">
          جدولة مواعيد العمل الأسبوعية (توقيت مصر / القاهرة) مع مفتاح الإغلاق اليدوي الطارئ والربط اللحظي بموقع الزبائن
        </p>
      </div>

      {/* Manual Emergency Closure Switch */}
      <Card className="p-6 border-2 border-amber-200 bg-amber-50/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                storeIsManualClosed ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#26212B]">
                حالة استقبال طلبات الزبائن:{' '}
                <span className={storeIsManualClosed ? 'text-red-600' : 'text-emerald-700'}>
                  {storeIsManualClosed ? 'مغلق يدوياً (متوقف)' : 'مفتوح ويستقبل طلبات (تلقائي)'}
                </span>
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {storeIsManualClosed
                  ? 'تم تفعيل الإغلاق اليدوي: لا يمكن لأي عميل إضافة أصناف أو إرسال طلب جديد الآن.'
                  : 'المطعم يعمل بشكل طبيعي طبقاً لجدول المواعيد الأسبوعي.'}
              </p>
            </div>
          </div>

          <Button
            variant={storeIsManualClosed ? 'primary' : 'danger'}
            size="md"
            onClick={handleToggleManualClosure}
            isLoading={isTogglingClosure}
            className="shrink-0 font-bold"
          >
            {storeIsManualClosed ? 'إعادة فتح استقبال الطلبات' : 'إيقاف استقبال الطلبات فوراً'}
          </Button>
        </div>

        {storeIsManualClosed && (
          <div className="pt-4 border-t border-amber-200/80 space-y-2">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>الرسالة التي ستظهر للزبائن في الشريط العلوي أثناء الإغلاق:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={closureMessage}
                onChange={(e) => setClosureMessage(e.target.value)}
                className="flex-1 text-xs rounded-xl border border-gray-200 bg-white p-2.5 focus:outline-none focus:border-[#512080]"
                placeholder="أدخل رسالة الإغلاق للزبائن..."
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  toggleManualClosure(true, closureMessage);
                  toast.success('تم تحديث رسالة الإغلاق');
                }}
              >
                تحديث الرسالة
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Weekly Schedule */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-base text-[#26212B] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#512080]" />
              <span>ساعات العمل الأسبوعية</span>
            </h3>
            <span className="text-xs text-gray-400">التوقيت: أفريقيا / القاهرة (توقيت مصر)</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={Save}
            isLoading={isSavingSchedule}
            onClick={handleSaveSchedule}
            className="font-bold"
          >
            حفظ الجدول
          </Button>
        </div>

        <div className="divide-y divide-gray-100">
          {schedule.map((item, idx) => (
            <div key={item.day} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div className="w-28 font-bold text-gray-700">{item.day}</div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={item.open}
                  onChange={(e) => {
                    const next = [...schedule];
                    next[idx].open = e.target.value;
                    setSchedule(next);
                  }}
                  className="rounded-lg border border-gray-200 p-1.5 text-xs number-ltr"
                />
                <span className="text-gray-400 font-bold">إلى</span>
                <input
                  type="time"
                  value={item.close}
                  onChange={(e) => {
                    const next = [...schedule];
                    next[idx].close = e.target.value;
                    setSchedule(next);
                  }}
                  className="rounded-lg border border-gray-200 p-1.5 text-xs number-ltr"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...schedule];
                    next[idx].active = !next[idx].active;
                    setSchedule(next);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                    item.active
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {item.active ? 'يعمل' : 'مغلق'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
