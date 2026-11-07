/**
 * @module pages/admin/AuditLogPage
 * @description Audit trail recording administrative actions strictly in Arabic.
 */

import React from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const AuditLogPage: React.FC = () => {
  const logs = [
    {
      id: 'log-1',
      action: 'قبول طلب وتأكيده',
      actor: 'كاشير الفرع (أحمد)',
      target: 'طلب رقم ORD-1024',
      time: 'منذ 10 دقائق',
    },
    {
      id: 'log-2',
      action: 'تحديث سعر صنف',
      actor: 'مدير الفرع',
      target: 'مانشيز بيف -> 140 ج.م',
      time: 'منذ ساعتين',
    },
    {
      id: 'log-3',
      action: 'حفظ جدول مواعيد العمل',
      actor: 'الإدارة',
      target: 'مواعيد الأسبوع',
      time: 'أمس',
    },
    {
      id: 'log-4',
      action: 'تحديد الطلب كجاهز للاستلام',
      actor: 'شيف المطبخ',
      target: 'طلب رقم ORD-1020',
      time: 'أمس',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#26212B]">سجل الأمان والعمليات الإدارية</h1>
        <p className="text-xs text-gray-500 mt-1">
          سجل تتبعي لكافة العمليات الحساسة وقرارات المطبخ والإدارة
        </p>
      </div>

      <Card className="divide-y divide-gray-100">
        {logs.map((log) => (
          <div key={log.id} className="p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#512080] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#26212B] block">{log.action}</span>
                <span className="text-[11px] text-gray-500">
                  {log.actor} • {log.target}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              <span>{log.time}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};
