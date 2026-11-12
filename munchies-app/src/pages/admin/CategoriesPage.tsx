/**
 * @module pages/admin/CategoriesPage
 * @description Menu category reordering, active states, and editing strictly in Arabic.
 * Features an interactive toggle badge for category active/inactive state with
 * real-time sync across Admin and Customer via Firestore + BroadcastChannel.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Layers, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useCategoryStore } from '@/stores/categoryStore';
import toast from 'react-hot-toast';

export const CategoriesPage: React.FC = () => {
  const categories = useCategoryStore((s) => s.categories);
  const addCategory = useCategoryStore((s) => s.addCategory);
  const updateCategory = useCategoryStore((s) => s.updateCategory);
  const removeCategory = useCategoryStore((s) => s.removeCategory);
  const toggleCategoryActive = useCategoryStore((s) => s.toggleCategoryActive);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryNameAr, setCategoryNameAr] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryNameAr('');
    setEditIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setCategoryNameAr(cat.name.ar);
    setEditIsActive(cat.isActive !== false);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      removeCategory(id);
      toast.success('تم حذف القسم بنجاح');
    }
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    toggleCategoryActive(id);
    if (currentActive) {
      toast.success('تم إيقاف القسم — لن يظهر كمتاح للطلب للزبائن الآن');
    } else {
      toast.success('تم تفعيل القسم — أصبح متاحاً للطلب للزبائن الآن');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryNameAr.trim()) {
      toast.error('يرجى كتابة اسم القسم');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: { ar: categoryNameAr.trim(), en: categoryNameAr.trim() },
        isActive: editIsActive,
      });
      toast.success('تم تعديل القسم بنجاح');
    } else {
      const newCat = {
        id: `cat_${Date.now()}`,
        name: { ar: categoryNameAr.trim(), en: categoryNameAr.trim() },
        productCount: 0,
        sortOrder: categories.length + 1,
        isActive: editIsActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;
      addCategory(newCat);
      toast.success('تمت إضافة القسم الجديد بنجاح');
    }

    setIsModalOpen(false);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-dark">أقسام المنيو</h1>
          <p className="text-xs text-gray-500 mt-1">
            تنظيم وتنسيق أقسام قائمة الطعام وترتيب ظهورها في الموقع للزبائن
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenAdd}>
          إضافة قسم جديد
        </Button>
      </div>

      <Card className="divide-y divide-gray-100">
        {categories.map((cat: any, idx: number) => {
          const isActive = cat.isActive !== false;

          return (
            <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className="w-6 text-xs text-gray-400 font-bold tabular-nums">{idx + 1}</span>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-light-gray text-primary'
                      : 'bg-red-50 text-red-400'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4
                    className={`font-bold text-xs transition-colors ${
                      isActive ? 'text-dark' : 'text-gray-400 line-through decoration-red-300'
                    }`}
                  >
                    {cat.name.ar}
                  </h4>
                  <span className="text-[11px] text-gray-400 tabular-nums">{cat.productCount || 0} صنف</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {/* Interactive Toggle Badge */}
                <button
                  onClick={() => handleToggleActive(cat.id, isActive)}
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] cursor-pointer transition-all duration-200 select-none active:scale-95 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:ring-2 hover:ring-emerald-200'
                      : 'bg-red-50 text-danger hover:bg-red-100 hover:ring-2 hover:ring-red-200'
                  }`}
                  title={isActive ? 'اضغط لإيقاف هذا القسم' : 'اضغط لتفعيل هذا القسم'}
                >
                  {isActive ? 'مفعل' : 'غير مفعل'}
                </button>
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 cursor-pointer"
                  title="تعديل"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-red-50 cursor-pointer"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
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

          {/* Active Toggle inside modal */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-border">
            <span className="text-xs font-bold text-dark">حالة القسم</span>
            <button
              type="button"
              onClick={() => setEditIsActive(!editIsActive)}
              className={`px-3 py-1 rounded-full font-bold text-[11px] cursor-pointer transition-all duration-200 select-none active:scale-95 ${
                editIsActive
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:ring-2 hover:ring-emerald-200 border border-emerald-200'
                  : 'bg-red-50 text-danger hover:bg-red-100 hover:ring-2 hover:ring-red-200 border border-red-200'
              }`}
            >
              {editIsActive ? 'مفعل' : 'غير مفعل'}
            </button>
          </div>

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
