/**
 * @module pages/admin/OperationsPage
 * @description Responsive Restaurant Operations & Order Acceptance control panel (Automatic vs Manual mode).
 * Strictly in Arabic, evaluated in Africa/Cairo timezone, and synced in real-time with Firestore.
 */

import React, { useState, useMemo } from 'react';
import { Clock, Power, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useRestaurantStore,
  useRestaurantOperationsStatus,
  type OperatingMode,
  type OverrideReopenCondition,
  type WorkingHoursEntry,
} from '@/stores/restaurantStore';
import {
  computeNextScheduledOpening,
  formatTimeArabic12h,
  parseTimeToMinutes,
} from '@/lib/restaurantOperations';
import toast from 'react-hot-toast';

interface OperationsDraft {
  operatingMode?: OperatingMode;
  openingTime?: string;
  closingTime?: string;
  manualOpen?: boolean;
  manualOverrideClosed?: boolean;
  reopenCondition?: OverrideReopenCondition;
  closureMessage?: string;
  useCustomDailySchedule?: boolean;
  workingHours?: WorkingHoursEntry[];
}

export const OperationsPage: React.FC = () => {
  const storeOperatingMode = useRestaurantStore((s) => s.operatingMode);
  const storeOpeningTime = useRestaurantStore((s) => s.openingTime);
  const storeClosingTime = useRestaurantStore((s) => s.closingTime);
  const storeManualOpen = useRestaurantStore((s) => s.manualOpen);
  const storeManualOverrideClosed = useRestaurantStore((s) => s.manualOverrideClosed);
  const storeManualOverrideUntil = useRestaurantStore((s) => s.manualOverrideUntil);
  const storeClosureMessage = useRestaurantStore((s) => s.closureMessage);
  const storeUseCustomDailySchedule = useRestaurantStore((s) => s.useCustomDailySchedule);
  const storeWorkingHours = useRestaurantStore((s) => s.workingHours);
  const saveOperationsSettings = useRestaurantStore((s) => s.saveOperationsSettings);

  // Live evaluated status (updates every 15s and on any Firestore change)
  const liveStatus = useRestaurantOperationsStatus();

  // Draft overrides on top of live Firestore state
  const [draft, setDraft] = useState<OperationsDraft>({});
  const [advancedOpenOverride, setAdvancedOpenOverride] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const operatingMode = draft.operatingMode ?? storeOperatingMode;
  const openingTime = draft.openingTime ?? storeOpeningTime;
  const closingTime = draft.closingTime ?? storeClosingTime;
  const manualOpen = draft.manualOpen ?? storeManualOpen;
  const manualOverrideClosed = draft.manualOverrideClosed ?? storeManualOverrideClosed;
  const storeReopenCondition: OverrideReopenCondition = storeManualOverrideUntil
    ? 'until_next_open'
    : 'until_manual_reopen';
  const reopenCondition = draft.reopenCondition ?? storeReopenCondition;
  const closureMessage = draft.closureMessage ?? storeClosureMessage;
  const useCustomDailySchedule = draft.useCustomDailySchedule ?? storeUseCustomDailySchedule;
  const workingHours = draft.workingHours ?? storeWorkingHours;
  const showAdvancedSchedule = advancedOpenOverride ?? useCustomDailySchedule;

  const crossesMidnight = useMemo(() => {
    return parseTimeToMinutes(closingTime) < parseTimeToMinutes(openingTime);
  }, [openingTime, closingTime]);

  const computeOverrideUntilIso = (
    closed: boolean,
    condition: OverrideReopenCondition
  ): string | null => {
    if (!closed || condition !== 'until_next_open') return null;
    const next = computeNextScheduledOpening(
      {
        operatingMode: 'automatic',
        openingTime,
        closingTime,
        manualOpen,
        manualOverrideClosed: false,
        manualOverrideUntil: null,
        closureMessage,
        useCustomDailySchedule,
        workingHours,
      },
      new Date()
    );
    return next?.iso ?? null;
  };

  const hasUnsavedChanges = Object.keys(draft).length > 0;

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const nextOverrideClosed = operatingMode === 'automatic' ? manualOverrideClosed : false;
      const nextOverrideUntil = computeOverrideUntilIso(nextOverrideClosed, reopenCondition);

      await saveOperationsSettings({
        operatingMode,
        openingTime,
        closingTime,
        manualOpen,
        manualOverrideClosed: nextOverrideClosed,
        manualOverrideUntil: nextOverrideUntil,
        closureMessage: closureMessage.trim(),
        useCustomDailySchedule,
        workingHours,
      });
      setDraft({});
      toast.success('تم حفظ إعدادات التشغيل وتحديث حالة المطعم بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInstantManualToggle = async () => {
    const nextOpen = !manualOpen;
    setIsSaving(true);
    try {
      await saveOperationsSettings({
        operatingMode: 'manual',
        manualOpen: nextOpen,
        manualOverrideClosed: false,
        manualOverrideUntil: null,
        closureMessage: closureMessage.trim(),
      });
      setDraft({});
      toast.success(
        nextOpen ? 'تم فتح استقبال الطلبات فوراً' : 'تم إيقاف استقبال الطلبات فوراً'
      );
    } catch {
      toast.error('تعذر تحديث حالة استقبال الطلبات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInstantOverrideToggle = async (nextClosed: boolean) => {
    setIsSaving(true);
    try {
      const nextOverrideUntil = computeOverrideUntilIso(nextClosed, reopenCondition);
      await saveOperationsSettings({
        operatingMode: 'automatic',
        openingTime,
        closingTime,
        manualOverrideClosed: nextClosed,
        manualOverrideUntil: nextOverrideUntil,
        closureMessage: closureMessage.trim(),
        useCustomDailySchedule,
        workingHours,
      });
      setDraft({});
      toast.success(
        nextClosed
          ? 'تم تفعيل الإيقاف المؤقت لاستقبال الطلبات'
          : 'تم إلغاء الإيقاف المؤقت والعودة للتشغيل التلقائي'
      );
    } catch {
      toast.error('تعذر تحديث حالة الإيقاف المؤقت');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveSettings} className="w-full space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-dark">
            تشغيل المطعم واستقبال الطلبات
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            تحكم فوري في فتح وإغلاق استقبال الطلبات الجديدة (بتوقيت القاهرة) — لا يؤثر على الطلبات الجارية.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasUnsavedChanges && (
            <span className="text-xs font-bold text-amber-700 hidden md:inline">
              توجد تعديلات غير محفوظة
            </span>
          )}
          <Button
            type="submit"
            variant="yellow"
            size="md"
            isLoading={isSaving}
            leftIcon={Save}
            className="w-full sm:w-auto font-black px-6 rounded-md shadow-sm"
          >
            حفظ الإعدادات
          </Button>
        </div>
      </div>

      {/* 1. Full-Width Live Order Acceptance Status Banner */}
      <Card
        className={`p-4 sm:p-5 border-2 transition-colors ${
          liveStatus.isOpen
            ? 'border-emerald-200 bg-emerald-50/70'
            : liveStatus.reason === 'manual_override'
            ? 'border-amber-300 bg-amber-50/70'
            : 'border-red-200 bg-red-50/70'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                  liveStatus.isOpen
                    ? 'bg-emerald-600'
                    : liveStatus.reason === 'manual_override'
                    ? 'bg-amber-600'
                    : 'bg-danger'
                }`}
              />
              <h2 className="text-base sm:text-lg font-black text-dark">
                {liveStatus.isOpen ? 'استقبال الطلبات مفتوح' : 'استقبال الطلبات متوقف'}
              </h2>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  liveStatus.isOpen
                    ? 'bg-white text-emerald-700 border-emerald-200'
                    : liveStatus.reason === 'manual_override'
                    ? 'bg-white text-amber-800 border-amber-300'
                    : 'bg-white text-danger border-red-200'
                }`}
              >
                {liveStatus.reason === 'scheduled_open' && 'تلقائي حسب الجدول'}
                {liveStatus.reason === 'scheduled_closed' && 'إغلاق مجدول'}
                {liveStatus.reason === 'manual_override' && 'إيقاف مؤقت يدوي'}
                {liveStatus.reason === 'manual_open' && 'تحكم يدوي'}
                {liveStatus.reason === 'manual_closed' && 'تحكم يدوي'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {liveStatus.statusDescription}
            </p>
          </div>

          {/* Quick Live Action directly in banner */}
          <div className="shrink-0">
            {liveStatus.operatingMode === 'manual' ? (
              <Button
                type="button"
                variant={liveStatus.isOpen ? 'danger' : 'primary'}
                size="md"
                isLoading={isSaving}
                onClick={handleInstantManualToggle}
                className="w-full md:w-auto font-bold rounded-md px-5"
              >
                {liveStatus.isOpen ? 'إيقاف استقبال الطلبات' : 'فتح استقبال الطلبات'}
              </Button>
            ) : liveStatus.reason === 'manual_override' ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isSaving}
                onClick={() => handleInstantOverrideToggle(false)}
                className="w-full md:w-auto font-bold rounded-md px-5"
              >
                إلغاء الإيقاف المؤقت
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                size="md"
                isLoading={isSaving}
                onClick={() => handleInstantOverrideToggle(true)}
                className="w-full md:w-auto font-bold rounded-md px-5"
              >
                إيقاف مؤقت للطلبات
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Responsive Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* Right Column (lg:5): Mode Selector + Customer Closure Message */}
        <div className="lg:col-span-5 space-y-6 min-w-0">
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="pb-3 border-b border-border">
              <h3 className="text-base font-black text-dark">وضع التشغيل</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                اختر طريقة التحكم في فتح وإغلاق استقبال الطلبات
              </p>
            </div>

            <div className="space-y-3">
              {/* Automatic Mode */}
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, operatingMode: 'automatic' }))}
                className={`w-full text-right p-4 rounded-md border-2 transition-all cursor-pointer ${
                  operatingMode === 'automatic'
                    ? 'border-primary bg-primary-50/60'
                    : 'border-border bg-white hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-dark flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span>التشغيل التلقائي</span>
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      operatingMode === 'automatic' ? 'border-primary' : 'border-gray-300'
                    }`}
                  >
                    {operatingMode === 'automatic' && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  يفتح ويقفل استقبال الطلبات تلقائياً يومياً حسب وقت الفتح والإغلاق بتوقيت القاهرة، مع إمكانية الإيقاف المؤقت.
                </p>
              </button>

              {/* Manual Mode */}
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, operatingMode: 'manual' }))}
                className={`w-full text-right p-4 rounded-md border-2 transition-all cursor-pointer ${
                  operatingMode === 'manual'
                    ? 'border-primary bg-primary-50/60'
                    : 'border-border bg-white hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-dark flex items-center gap-2">
                    <Power className="w-4 h-4 text-primary shrink-0" />
                    <span>التحكم اليدوي</span>
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      operatingMode === 'manual' ? 'border-primary' : 'border-gray-300'
                    }`}
                  >
                    {operatingMode === 'manual' && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  تتحكم في فتح وإيقاف استقبال الطلبات بنفسك في أي وقت بدون الالتزام بجدول مواعيد.
                </p>
              </button>
            </div>
          </Card>

          {/* Closure Message Card */}
          <Card className="p-5 sm:p-6 space-y-3">
            <label
              htmlFor="closure-message-input"
              className="block text-sm font-black text-dark"
            >
              رسالة الإغلاق للزبائن
            </label>
            <p className="text-xs text-gray-500">
              تظهر للزبائن عند الإيقاف اليدوي أو الإيقاف المؤقت.
            </p>
            <textarea
              id="closure-message-input"
              rows={2}
              value={closureMessage}
              onChange={(e) => setDraft((d) => ({ ...d, closureMessage: e.target.value }))}
              className="w-full rounded-md border border-border bg-white p-3 text-xs sm:text-sm text-dark leading-relaxed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-y"
              placeholder="مثال: عذراً، استقبال الطلبات متوقف مؤقتاً وسنعاود الفتح قريباً."
            />
          </Card>
        </div>

        {/* Left Column (lg:7): Active Mode Controls */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          {operatingMode === 'automatic' ? (
            <Card className="p-5 sm:p-6 space-y-6">
              {/* Daily Schedule Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-black text-dark">مواعيد العمل اليومية</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    بتوقيت القاهرة (Africa/Cairo) — يدعم ساعات العمل الممتدة بعد منتصف الليل
                  </p>
                </div>
                {crossesMidnight && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-primary-50 text-primary border border-primary/20 self-start sm:self-auto shrink-0">
                    يمتد بعد منتصف الليل
                  </span>
                )}
              </div>

              {/* Opening & Closing Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="opening-time-input"
                    className="block text-xs font-bold text-dark mb-1.5"
                  >
                    وقت الفتح
                  </label>
                  <input
                    id="opening-time-input"
                    type="time"
                    dir="ltr"
                    value={openingTime}
                    onChange={(e) => setDraft((d) => ({ ...d, openingTime: e.target.value }))}
                    disabled={useCustomDailySchedule}
                    className="w-full h-11 rounded-md border border-border bg-white px-3 text-sm font-bold tabular-nums text-left focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                    required
                  />
                  <span className="text-[11px] text-gray-500 mt-1.5 block">
                    يفتح يومياً الساعة: <strong className="text-dark">{formatTimeArabic12h(openingTime)}</strong>
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="closing-time-input"
                    className="block text-xs font-bold text-dark mb-1.5"
                  >
                    وقت الإغلاق
                  </label>
                  <input
                    id="closing-time-input"
                    type="time"
                    dir="ltr"
                    value={closingTime}
                    onChange={(e) => setDraft((d) => ({ ...d, closingTime: e.target.value }))}
                    disabled={useCustomDailySchedule}
                    className="w-full h-11 rounded-md border border-border bg-white px-3 text-sm font-bold tabular-nums text-left focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                    required
                  />
                  <span className="text-[11px] text-gray-500 mt-1.5 block">
                    يغلق الساعة: <strong className="text-dark">{formatTimeArabic12h(closingTime)}</strong>
                    {crossesMidnight ? ' (اليوم التالي)' : ''}
                  </span>
                </div>
              </div>

              {/* Manual Override Section */}
              <div className="pt-5 border-t border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-dark">الإيقاف المؤقت اليدوي</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {manualOverrideClosed
                        ? 'الإيقاف المؤقت مفعل الآن وله أولوية على الجدول التلقائي.'
                        : 'إيقاف استقبال الطلبات مؤقتاً قبل وقت الإغلاق عند الضغط أو الصيانة.'}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={manualOverrideClosed ? 'primary' : 'danger'}
                    size="sm"
                    isLoading={isSaving}
                    onClick={() => handleInstantOverrideToggle(!manualOverrideClosed)}
                    className="w-full sm:w-auto shrink-0 font-bold rounded-md px-4 h-9"
                  >
                    {manualOverrideClosed ? 'إلغاء الإيقاف المؤقت' : 'إيقاف مؤقت الآن'}
                  </Button>
                </div>

                <div className="p-3.5 rounded-md bg-light-gray border border-border space-y-2">
                  <span className="text-xs font-bold text-dark block">
                    شرط إعادة الفتح عند تفعيل الإيقاف المؤقت:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, reopenCondition: 'until_manual_reopen' }))
                      }
                      className={`px-3 py-2 rounded-md text-xs font-bold border text-center transition-colors cursor-pointer ${
                        reopenCondition === 'until_manual_reopen'
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-white text-dark hover:border-primary/40'
                      }`}
                    >
                      حتى إعادة الفتح يدوياً
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, reopenCondition: 'until_next_open' }))
                      }
                      className={`px-3 py-2 rounded-md text-xs font-bold border text-center transition-colors cursor-pointer ${
                        reopenCondition === 'until_next_open'
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-white text-dark hover:border-primary/40'
                      }`}
                    >
                      حتى موعد الفتح القادم ({formatTimeArabic12h(openingTime)})
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Advanced Setting: Per-Day Custom Hours */}
              <div className="pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdvancedOpenOverride(!showAdvancedSchedule)}
                  className="flex items-center justify-between w-full text-xs font-bold text-gray-600 hover:text-dark cursor-pointer py-1"
                >
                  <span>إعداد متقدم: تخصيص ساعات مختلفة لأيام محددة</span>
                  {showAdvancedSchedule ? (
                    <ChevronUp className="w-4 h-4 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  )}
                </button>

                {showAdvancedSchedule && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-border/60">
                    <label className="flex items-center gap-2.5 text-xs font-bold text-dark cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomDailySchedule}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, useCustomDailySchedule: e.target.checked }))
                        }
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span>تفعيل مواعيد مخصصة لكل يوم بدلاً من المواعيد اليومية الموحدة</span>
                    </label>

                    {useCustomDailySchedule && (
                      <div className="divide-y divide-border border border-border rounded-md px-3 bg-white">
                        {workingHours.map((item, idx) => (
                          <div
                            key={item.day}
                            className="py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs"
                          >
                            <span className="w-20 font-bold text-dark">{item.day}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                dir="ltr"
                                value={item.open}
                                disabled={!item.active}
                                onChange={(e) => {
                                  const next = workingHours.map((row, rIdx) =>
                                    rIdx === idx ? { ...row, open: e.target.value } : row
                                  );
                                  setDraft((d) => ({ ...d, workingHours: next }));
                                }}
                                className="rounded-sm border border-border p-1.5 text-xs tabular-nums disabled:opacity-50"
                              />
                              <span className="text-gray-400">إلى</span>
                              <input
                                type="time"
                                dir="ltr"
                                value={item.close}
                                disabled={!item.active}
                                onChange={(e) => {
                                  const next = workingHours.map((row, rIdx) =>
                                    rIdx === idx ? { ...row, close: e.target.value } : row
                                  );
                                  setDraft((d) => ({ ...d, workingHours: next }));
                                }}
                                className="rounded-sm border border-border p-1.5 text-xs tabular-nums disabled:opacity-50"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const next = workingHours.map((row, rIdx) =>
                                  rIdx === idx ? { ...row, active: !row.active } : row
                                );
                                setDraft((d) => ({ ...d, workingHours: next }));
                              }}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                                item.active
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {item.active ? 'يعمل' : 'إجازة'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            /* Manual Mode Control Card */
            <Card className="p-5 sm:p-6 space-y-5">
              <div className="pb-3 border-b border-border">
                <h3 className="text-base font-black text-dark">
                  التحكم اليدوي في استقبال الطلبات
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  في هذا الوضع لا يغلق المطعم تلقائياً بناءً على أي جدول مواعيد.
                </p>
              </div>

              <div
                className={`p-5 rounded-md border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  manualOpen
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-red-200 bg-red-50/50'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 block">الحالة الحالية</span>
                  <h4
                    className={`text-lg font-black ${
                      manualOpen ? 'text-emerald-700' : 'text-danger'
                    }`}
                  >
                    {manualOpen ? 'استقبال الطلبات مفتوح' : 'استقبال الطلبات متوقف'}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {manualOpen
                      ? 'يمكن للعملاء إرسال طلبات جديدة الآن حتى تقوم بإيقافها.'
                      : 'الطلبات الجديدة متوقفة الآن ولن تُقبل حتى تقوم بفتحها.'}
                  </p>
                </div>

                <Button
                  type="button"
                  variant={manualOpen ? 'danger' : 'primary'}
                  size="lg"
                  isLoading={isSaving}
                  onClick={handleInstantManualToggle}
                  className="w-full sm:w-auto shrink-0 font-black rounded-md px-6"
                >
                  {manualOpen ? 'إيقاف استقبال الطلبات' : 'فتح استقبال الطلبات'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Save Bar on Mobile */}
      <div className="sm:hidden pt-1">
        {hasUnsavedChanges && (
          <p className="text-xs font-bold text-amber-700 mb-2 text-center">
            توجد تعديلات غير محفوظة
          </p>
        )}
        <Button
          type="submit"
          variant="yellow"
          size="lg"
          fullWidth
          isLoading={isSaving}
          leftIcon={Save}
          className="font-black rounded-md shadow-sm"
        >
          حفظ الإعدادات
        </Button>
      </div>
    </form>
  );
};
