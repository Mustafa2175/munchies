/**
 * @module pages/admin/OperationsPage
 * @description Working hours schedule and emergency manual closure switch strictly in Arabic.
 */

import React, { useState } from 'react';
import { Power } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export const OperationsPage: React.FC = () => {
  const [isManualClosed, setIsManualClosed] = useState(false);
  const [closureMessage, setClosureMessage] = useState(
    'عذراً، استلام الطلبات متوقف مؤقتاً لضغط العمل في المطبخ وسنعاود الاستقبال قريباً.'
  );

  const [schedule, setSchedule] = useState([
    { day: 'الأحد', open: '12:00', close: '03:00', active: true },
    { day: 'الإثنين', open: '12:00', close: '03:00', active: true },
    { day: 'الثلاثاء', open: '12:00', close: '03:00', active: true },
    { day: 'الأربعاء', open: '12:00', close: '03:00', active: true },
    { day: 'الخميس', open: '12:00', close: '03:00', active: true },
    { day: 'الجمعة', open: '13:00', close: '04:00', active: true },
    { day: 'السبت', open: '12:00', close: '03:00', active: true },
  ]);

  const toggleManualClosure = () => {
    const next = !isManualClosed;
    setIsManualClosed(next);
    toast.success(
      next
        ? 'تم إيقاف استقبال الطلبات يدوياً بنجاح.'
        : 'تمت إعادة فتح استقبال الطلبات والعودة للجدول التلقائي.'
    );
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#26212B]">تشغيل المطعم وساعات العمل</h1>
        <p className="text-xs text-gray-500 mt-1">
          جدولة مواعيد العمل الأسبوعية (توقيت مصر / القاهرة) مع مفتاح الإغلاق اليدوي الطارئ
        </p>
      </div>

      {/* Manual Emergency Closure Switch */}
      <Card className="p-6 border-2 border-amber-200 bg-amber-50/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isManualClosed ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#26212B]">
                حالة استقبال طلبات الزبائن:{' '}
                <span className={isManualClosed ? 'text-red-600' : 'text-emerald-700'}>
                  {isManualClosed ? 'مغلق يدوياً (متوقف)' : 'مفتوح ويستقبل طلبات (تلقائي)'}
                </span>
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {isManualClosed
                  ? 'تم تفعيل الإغلاق اليدوي: لا يمكن لأي عميل إرسال طلب جديد الآن.'
                  : 'المطعم يعمل بشكل طبيعي طبقاً لجدول المواعيد الأسبوعي.'}
              </p>
            </div>
          </div>

          <Button
            variant={isManualClosed ? 'primary' : 'danger'}
            size="md"
            onClick={toggleManualClosure}
            className="shrink-0 font-bold"
          >
            {isManualClosed ? 'إعادة فتح استقبال الطلبات' : 'إيقاف استقبال الطلبات فوراً'}
          </Button>
        </div>

        {isManualClosed && (
          <div className="pt-4 border-t border-amber-200/80 space-y-2">
            <label className="text-xs font-bold text-gray-700 block">
              الرسالة التي ستظهر للزبائن أثناء الإغلاق:
            </label>
            <input
              type="text"
              value={closureMessage}
              onChange={(e) => setClosureMessage(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-200 bg-white p-2.5 focus:outline-none focus:border-[#512080]"
            />
          </div>
        )}
      </Card>

      {/* Weekly Schedule */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-base text-[#26212B]">ساعات العمل الأسبوعية</h3>
            <span className="text-xs text-gray-400">التوقيت: أفريقيا / القاهرة (توقيت مصر)</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toast.success('تم حفظ جدول المواعيد')}
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
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                    item.active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
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
