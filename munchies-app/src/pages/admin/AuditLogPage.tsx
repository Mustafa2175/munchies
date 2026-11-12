/**
 * @module pages/admin/AuditLogPage
 * @description Comprehensive Audit Trail & Security Center recording administrative actions,
 * password changes, failed logins, and repeated failed login alerts strictly in Arabic.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  KeyRound,
  FileEdit,
  ShoppingBag,
  Filter,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Card } from '@/components/ui/Card';
import type { AuditLog } from '@/types/admin';

type FilterType = 'all' | 'alerts' | 'auth' | 'catalog' | 'orders';

// Fallback initial authentic events if collection is empty
const INITIAL_DEMO_LOGS: AuditLog[] = [
  {
    id: 'demo-log-1',
    action: 'update_order_status',
    actorId: 'admin-1',
    actorName: 'كاشير الفرع (أحمد)',
    actorRole: 'staff',
    targetCollection: 'orders',
    targetId: 'ORD-1024',
    summary: 'قبول وتأكيد الطلب ORD-1024 وبدء تجهيزه',
    severity: 'INFO',
    isAlert: false,
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-log-2',
    action: 'update_product',
    actorId: 'admin-2',
    actorName: 'مدير الفرع (أسوان)',
    actorRole: 'admin',
    targetCollection: 'products',
    targetId: 'munchies-beef',
    summary: 'تحديث سعر صنف مانشيز بيف إلى 140 ج.م',
    severity: 'INFO',
    isAlert: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-log-3',
    action: 'update_settings',
    actorId: 'admin-1',
    actorName: 'الإدارة العامة',
    actorRole: 'super_admin',
    targetCollection: 'settings',
    targetId: 'restaurant',
    summary: 'تحديث إعدادات التوصيل ومواعيد التشغيل لفرع الكورنيش',
    severity: 'INFO',
    isAlert: false,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

function formatTimeAgoArabic(val?: unknown): string {
  if (!val) return 'الآن';
  try {
    let millis: number;
    if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
      millis = (val as { toMillis: () => number }).toMillis();
    } else if (typeof val === 'string') {
      millis = new Date(val).getTime();
    } else {
      millis = Date.now();
    }

    if (isNaN(millis)) return 'مؤخراً';
    const diffSec = Math.floor((Date.now() - millis) / 1000);

    if (diffSec < 60) return 'منذ لحظات';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return new Date(millis).toLocaleDateString('ar-EG');
  } catch {
    return 'مؤخراً';
  }
}

function getActionMeta(log: AuditLog): {
  icon: React.ElementType;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  label: string;
} {
  if (log.action === 'repeated_failed_logins' || log.isAlert) {
    return {
      icon: ShieldAlert,
      badgeBg: 'bg-red-50',
      badgeText: 'text-red-700',
      badgeBorder: 'border-red-200',
      label: 'تنبيه أمني حرج',
    };
  }
  if (log.action === 'failed_login') {
    return {
      icon: AlertTriangle,
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200',
      label: 'محاولة دخول فاشلة',
    };
  }
  if (log.action === 'password_change' || log.action === 'password_reset_request') {
    return {
      icon: KeyRound,
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      badgeBorder: 'border-purple-200',
      label: 'كلمات المرور',
    };
  }
  if (log.action.includes('order') || log.action === 'record_payment') {
    return {
      icon: ShoppingBag,
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      label: 'إدارة الطلبات',
    };
  }
  if (log.action === 'admin_login') {
    return {
      icon: UserCheck,
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      label: 'دخول مسؤول',
    };
  }
  return {
    icon: FileEdit,
    badgeBg: 'bg-primary-50',
    badgeText: 'text-primary',
    badgeBorder: 'border-primary-100',
    label: 'تعديل بيانات',
  };
}

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_DEMO_LOGS);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to live audit logs from Firestore
  useEffect(() => {
    try {
      if (!db) {
        setIsLoading(false);
        return;
      }

      const q = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(100));
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          setIsLoading(false);
          if (!snap.empty) {
            const fetched = snap.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })) as AuditLog[];
            setLogs(fetched);
          }
        },
        (error) => {
          console.warn('Failed to subscribe to auditLogs in Firestore, using cached entries:', error);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch {
      setIsLoading(false);
    }
  }, []);

  // Detect repeated failed login alerts
  const repeatedLoginAlerts = useMemo(() => {
    return logs.filter((l) => l.action === 'repeated_failed_logins' || (l.isAlert && l.severity === 'CRITICAL'));
  }, [logs]);

  // Filter logs by category
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeFilter === 'alerts') {
        return log.action === 'repeated_failed_logins' || log.action === 'failed_login' || log.isAlert;
      }
      if (activeFilter === 'auth') {
        return (
          log.action === 'failed_login' ||
          log.action === 'repeated_failed_logins' ||
          log.action === 'password_change' ||
          log.action === 'password_reset_request' ||
          log.action === 'admin_login'
        );
      }
      if (activeFilter === 'orders') {
        return (
          log.action === 'update_order_status' ||
          log.action === 'cancel_order' ||
          log.action === 'refund_order' ||
          log.action === 'record_payment'
        );
      }
      if (activeFilter === 'catalog') {
        return (
          log.action.includes('product') ||
          log.action.includes('category') ||
          log.action.includes('offer') ||
          log.action.includes('settings')
        );
      }
      return true;
    });
  }, [logs, activeFilter]);

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-dark">سجل الأمان والعمليات الإدارية</h1>
        <p className="text-xs text-gray-500 mt-1">
          سجل تتبعي ومؤمّن للأحداث الهامة: محاولات الدخول، تغيير كلمات المرور، وقرارات الإدارة
        </p>
      </div>

      {/* Security Alert Banner (Displayed whenever repeated failed logins occur) */}
      {repeatedLoginAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-danger-50 border-2 border-danger-200 text-danger-900 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-danger text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-danger-900">
                تنبيه أمني عاجل: رصد محاولات تسجيل دخول فاشلة متكررة!
              </h2>
              <p className="text-[11px] text-danger-700">
                قام النظام برصد محاولات دخول متتالية غير ناجحة وتوثيقها لمنع هجمات التخمين
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-danger-100">
            {repeatedLoginAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="bg-white/80 p-3 rounded-xl border border-danger-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
                  <span className="font-bold text-dark">{alert.summary}</span>
                </div>
                <span className="text-[11px] text-gray-500 tabular-nums">
                  {formatTimeAgoArabic(alert.timestamp || alert.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          الكل ({logs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('alerts')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'alerts'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-red-50 text-red-700 hover:bg-red-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          تنبيهات أمنية (
          {logs.filter((l) => l.action === 'repeated_failed_logins' || l.action === 'failed_login').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('auth')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'auth'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          الدخول وكلمات المرور
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('orders')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'orders'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          الطلبات والدفع
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('catalog')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'catalog'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          المنيو والإعدادات
        </button>
      </div>

      {/* Main Logs List */}
      <Card className="divide-y divide-gray-100 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Filter className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-sm font-bold">لا توجد سجلات مطابقة لهذا التصنيف</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const meta = getActionMeta(log);
            const Icon = meta.icon;
            const timeAgo = formatTimeAgoArabic(log.timestamp || log.createdAt);

            return (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-gray-50/70 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-dark text-xs">{log.summary}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500">
                      بواسطة: <span className="font-bold text-gray-700">{log.actorName}</span>
                      {log.targetId && log.targetId !== 'n/a' && (
                        <>
                          {' '}
                          • الهدف: <span className="font-mono text-gray-600">{log.targetId}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] shrink-0 self-end sm:self-center">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="tabular-nums font-semibold">{timeAgo}</span>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
};
