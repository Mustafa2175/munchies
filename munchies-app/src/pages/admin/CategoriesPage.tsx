/**
 * @module pages/admin/CategoriesPage
 * @description Menu category reordering, active states, and editing strictly in Arabic.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Layers, Trash2 } from 'lucide-react';
import { CATEGORIES } from '@/data/mockData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState(() => {
    const stored = localStorage.getItem('munchies_categories');
    return stored ? JSON.parse(stored) : CATEGORIES.filter((c) => c.id !== 'all');
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryNameAr, setCategoryNameAr] = useState('');

  const saveCategories = (updated: any[]) => {
    setCategories(updated);
    localStorage.setItem('munchies_categories', JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryNameAr('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setCategoryNameAr(cat.name.ar);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      const updated = categories.filter((c: any) => c.id !== id);
      saveCategories(updated);
      toast.success('تم حذف القسم بنجاح');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryNameAr.trim()) {
      toast.error('يرجى كتابة اسم القسم');
      return;
    }

    if (editingCategory) {
      const updated = categories.map((c: any) =>
        c.id === editingCategory.id
          ? { ...c, name: { ar: categoryNameAr.trim(), en: categoryNameAr.trim() } }
          : c
      );
      saveCategories(updated);
      toast.success('تم تعديل القسم بنجاح');
    } else {
      const newCat = {
        id: `cat_${Date.now()}`,
        name: { ar: categoryNameAr.trim(), en: categoryNameAr.trim() },
        productCount: 0,
        sortOrder: categories.length + 1,
        isActive: true,
      };
      saveCategories([...categories, newCat]);
      toast.success('تمت إضافة القسم الجديد بنجاح');
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#26212B]">أقسام المنيو</h1>
          <p className="text-xs text-gray-500 mt-1">
            تنظيم وتنسيق أقسام قائمة الطعام وترتيب ظهورها في الموقع للزبائن
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenAdd}>
          إضافة قسم جديد
        </Button>
      </div>

      <Card className="divide-y divide-gray-100">
        {categories.map((cat: any, idx: number) => (
          <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
            <div className="flex items-center gap-3">
              <span className="w-6 text-xs text-gray-400 font-bold">{idx + 1}</span>
              <div className="w-10 h-10 rounded-xl bg-[#F5F3F7] text-[#512080] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#26212B]">{cat.name.ar}</h4>
                <span className="text-[11px] text-gray-400">{cat.productCount || 0} صنف</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                مفعل
              </span>
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#512080] hover:bg-purple-50 cursor-pointer"
                title="تعديل"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                title="حذف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'تعديل قسم بالمنيو' : 'إضافة قسم جديد'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم القسم بالعربية"
            value={categoryNameAr}
            onChange={(e) => setCategoryNameAr(e.target.value)}
            placeholder="مثال: مشروبات منعشة، صوصات إضافية..."
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingCategory ? 'حفظ التعديلات' : 'إضافة القسم'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
