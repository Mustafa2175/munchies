/**
 * @module pages/admin/ReportsPage
 * @description Operational and sales analytics with interactive charts strictly in Arabic.
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Award, Calendar } from 'lucide-react';
import type { Order } from '@/types';
import { Card } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';

const COLORS = ['#512080', '#FFDA35', '#27834B', '#3B82F6', '#E84D45'];

export const ReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('munchies_orders') || '[]');
    setOrders(stored);
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  // Sales data for chart
  const salesData = [
    { name: 'السبت', sales: 1850, orders: 14 },
    { name: 'الأحد', sales: 2400, orders: 18 },
    { name: 'الإثنين', sales: 2100, orders: 16 },
    { name: 'الثلاثاء', sales: 2900, orders: 22 },
    { name: 'الأربعاء', sales: 3200, orders: 25 },
    { name: 'الخميس', sales: 4600, orders: 34 },
    { name: 'الجمعة', sales: 5100, orders: 40 },
  ];

  // Category sales breakdown
  const categoryData = [
    { name: 'سندوتشات مانشيز', value: 45 },
    { name: 'VIP منيو', value: 25 },
    { name: 'فات بير برجر', value: 15 },
    { name: 'فرايز ولوديد', value: 15 },
  ];

  const topSelling = [
    { name: 'مانشيز بيف برجر', count: 48, revenue: 6720 },
    { name: 'مانشيز استربس كريسبي', count: 42, revenue: 5670 },
    { name: 'فيلي تشيز استيك', count: 35, revenue: 6300 },
    { name: 'لوديد فرايز بالجبنة', count: 29, revenue: 3480 },
    { name: 'فات بير 50/50', count: 24, revenue: 4560 },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-[#26212B]">تقارير المبيعات والأداء</h1>
        <p className="text-xs text-gray-500 mt-1">
          تحليل الإيرادات، حجم الطلبات، والأصناف الأكثر طلباً ومبيعاً بفرع أسوان
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">إجمالي إيرادات الأسبوع</span>
            <span className="text-xl font-black text-[#27834B] mt-1 block">
              <CurrencyDisplay amount={22150} />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#27834B] flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">إجمالي عدد الطلبات</span>
            <span className="text-2xl font-black text-[#512080] mt-1 block number-ltr text-start">
              169 طلب
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F3EDFA] text-[#512080] flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">متوسط قيمة الطلب</span>
            <span className="text-xl font-black text-[#26212B] mt-1 block">
              <CurrencyDisplay amount={131} />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold block">أعلى يوم مبيعاً</span>
            <span className="text-xl font-black text-[#512080] mt-1 block">يوم الجمعة</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#512080] flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Revenue Bar Chart */}
        <Card className="lg:col-span-8 p-6 space-y-4">
          <h3 className="font-bold text-base text-[#26212B]">
            حجم المبيعات اليومية خلال الأسبوع (ج.م)
          </h3>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <XAxis dataKey="name" stroke="#9B95A3" fontSize={11} />
                <YAxis stroke="#9B95A3" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`${val} ج.م`, 'المبيعات']}
                  contentStyle={{
                    borderRadius: '12px',
                    direction: 'rtl',
                    fontFamily: 'inherit',
                  }}
                />
                <Bar dataKey="sales" fill="#512080" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Share Donut */}
        <Card className="lg:col-span-4 p-6 space-y-4">
          <h3 className="font-bold text-base text-[#26212B]">توزيع المبيعات حسب القسم</h3>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'النسبة']}
                  contentStyle={{
                    borderRadius: '12px',
                    direction: 'rtl',
                    fontFamily: 'inherit',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs">
            {categoryData.map((cat, idx) => (
              <div key={cat.name} className="flex justify-between items-center text-gray-600">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span>{cat.name}</span>
                </div>
                <span className="font-bold">{cat.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Selling Table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-[#26212B]">
              الأصناف الخمسة الأكثر مبيعاً
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[#F5F3F7] text-gray-500 font-bold">
              <tr>
                <th className="px-5 py-3 text-start">الترتيب</th>
                <th className="px-5 py-3 text-start">اسم الصنف</th>
                <th className="px-5 py-3 text-start">عدد مرات الطلب</th>
                <th className="px-5 py-3 text-start">إجمالي الإيرادات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topSelling.map((item, idx) => (
                <tr key={item.name} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-bold text-[#512080]">
                    #{idx + 1}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-[#26212B]">
                    {item.name}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 number-ltr text-start font-semibold">
                    {item.count} طلب
                  </td>
                  <td className="px-5 py-3.5 font-extrabold text-[#27834B]">
                    <CurrencyDisplay amount={item.revenue} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

