/**
 * @module pages/admin/ProductsPage
 * @description Catalog manager with complete Add/Edit product modal strictly in Arabic.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Archive, Image as ImageIcon } from 'lucide-react';
import type { Product } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatPrice } from '@/lib/currency';
import { useProductStore } from '@/stores/productStore';
import { logAdminAction } from '@/lib/auditLogger';
import toast from 'react-hot-toast';

export const ProductsPage: React.FC = () => {
  const products = useProductStore((s) => s.products);
  const storeToggle = useProductStore((s) => s.toggleAvailability);
  const storeAdd = useProductStore((s) => s.addProduct);
  const storeUpdate = useProductStore((s) => s.updateProduct);
  const storeRemove = useProductStore((s) => s.removeProduct);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [nameAr, setNameAr] = useState('');
  const [descAr, setDescAr] = useState('');
  const [price, setPrice] = useState<number>(100);
  const [categoryId, setCategoryId] = useState('sandwiches');
  const [imageUrl, setImageUrl] = useState('');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const toggleAvailability = (id: string) => {
    storeToggle(id);
    toast.success('تم تحديث حالة توفر الصنف');
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setNameAr('');
    setDescAr('');
    setPrice(120);
    setCategoryId('sandwiches');
    setImageUrl('/hero_burger_clean_cutout.png');
    setIsBestSeller(false);
    setIsNew(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setNameAr(p.name.ar);
    setDescAr(p.description.ar);
    setPrice(p.price);
    setCategoryId(p.categoryId);
    setImageUrl(p.image);
    setIsBestSeller(!!p.isBestSeller);
    setIsNew(!!p.isNew);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الصنف من المنيو؟')) {
      storeRemove(id);
      logAdminAction('delete_product', 'products', id, 'حذف صنف من قائمة الطعام', { productId: id }).catch(() => {});
      toast.success('تم حذف الصنف من القائمة');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      toast.error('يرجى إدخال اسم الصنف باللغة العربية');
      return;
    }

    if (editingProduct) {
      // Update
      storeUpdate(editingProduct.id, {
        name: { ar: nameAr.trim(), en: editingProduct.name.en || nameAr.trim() },
        description: { ar: descAr.trim(), en: editingProduct.description.en || descAr.trim() },
        price: Number(price),
        categoryId,
        image: imageUrl.trim() || editingProduct.image,
        isBestSeller,
        isNew,
      });
      logAdminAction(
        'update_product',
        'products',
        editingProduct.id,
        `تعديل بيانات الصنف: ${nameAr.trim()} (${Number(price)} ج.م)`,
        { productId: editingProduct.id, name: nameAr.trim(), price: Number(price), categoryId }
      ).catch(() => {});
      toast.success('تم تحديث بيانات الصنف بنجاح!');
    } else {
      // Create new
      const newId = `prod_${Date.now()}`;
      const newProduct: Product = {
        id: newId,
        slug: newId,
        name: { ar: nameAr.trim(), en: nameAr.trim() },
        description: { ar: descAr.trim(), en: descAr.trim() },
        price: Number(price),
        categoryId,
        image: imageUrl.trim() || '/hero_burger_clean_cutout.png',
        isAvailable: true,
        isBestSeller,
        isNew,
        sortOrder: products.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storeAdd(newProduct);
      logAdminAction(
        'create_product',
        'products',
        newId,
        `إضافة صنف جديد إلى المنيو: ${nameAr.trim()} (${Number(price)} ج.م)`,
        { productId: newId, name: nameAr.trim(), price: Number(price), categoryId }
      ).catch(() => {});
      toast.success('تمت إضافة الصنف الجديد إلى المنيو بنجاح!');
    }

    setIsModalOpen(false);
  };

  const filtered = products.filter(
    (p) =>
      p.name.ar.includes(search) ||
      (p.name.en && p.name.en.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-dark">قائمة أصناف المنيو</h1>
          <p className="text-xs text-gray-500 mt-1">
            إدارة أطباق وساندوتشات مانشيز، الأسعار، الصور، وتحديد التوفر
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenAdd}>
          إضافة صنف جديد
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في الأصناف باسم الساندوتش..."
          className="w-full sm:w-72 text-xs rounded-xl border border-border bg-white py-2 px-3 focus:outline-none focus:border-primary"
        />
        <span className="text-xs text-gray-500 font-bold tabular-nums">{filtered.length} صنف</span>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-light-gray text-gray-500 font-bold">
              <tr>
                <th className="px-5 py-3 text-start">الصورة</th>
                <th className="px-5 py-3 text-start">اسم الصنف</th>
                <th className="px-5 py-3 text-start">القسم</th>
                <th className="px-5 py-3 text-start">السعر الحالي</th>
                <th className="px-5 py-3 text-start">حالة التوفر</th>
                <th className="px-5 py-3 text-start">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <img
                      src={product.image}
                      alt={product.name.ar}
                      className="w-10 h-10 rounded-xl object-cover border border-gray-100"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-dark">{product.name.ar}</span>
                      {product.isBestSeller && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-yellow text-dark">
                          الأكثر طلباً
                        </span>
                      )}
                      {product.isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-primary text-white">
                          جديد
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-[11px] truncate max-w-xs mt-0.5">
                      {product.description.ar}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600 font-medium">
                    {product.categoryId === 'sandwiches'
                      ? 'سندوتشات مانشيز'
                      : product.categoryId === 'vip-menu'
                      ? 'VIP منيو'
                      : product.categoryId === 'fat-burger'
                      ? 'فات بير برجر'
                      : product.categoryId === 'specialties'
                      ? 'أطباق خاصة'
                      : 'فرايز'}
                  </td>
                  <td className="px-5 py-3 font-extrabold text-primary">
                    <span className="font-bold tabular-nums number-ltr">{formatPrice(product.price)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleAvailability(product.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                        product.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-danger border border-red-200'
                      }`}
                    >
                      {product.isAvailable ? 'متاح للطلب' : 'غير متوفر'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100 cursor-pointer"
                        title="تعديل الصنف"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-danger hover:bg-gray-100 cursor-pointer"
                        title="حذف الصنف"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'تعديل صنف في المنيو' : 'إضافة صنف جديد للمنيو'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم الساندوتش أو الصنف"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="مثال: دبل برجر مشوي بالجبنة"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark mb-1.5">
                القسم التابع له
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs rounded-xl border border-border bg-white p-2.5 focus:outline-none focus:border-primary"
              >
                <option value="sandwiches">سندوتشات مانشيز</option>
                <option value="vip-menu">VIP منيو</option>
                <option value="fat-burger">فات بير برجر</option>
                <option value="specialties">أطباق خاصة ولوديد</option>
                <option value="fries-cup">فرايز كب</option>
                <option value="fries-cono">فرايز كونو</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark mb-1.5">
                السعر (ج.م)
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-border bg-white p-2.5 focus:outline-none focus:border-primary number-ltr tabular-nums"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark mb-1.5">
              الوصف والمكونات
            </label>
            <textarea
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
              rows={2}
              placeholder="مثال: برجر لحم بلدي + صوص مانشيز + شرائح شيدر وبطاطس..."
              className="w-full text-xs rounded-xl border border-border p-2.5 focus:outline-none focus:border-primary"
            />
          </div>

          <Input
            label="رابط صورة الصنف (Image URL)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            leftIcon={ImageIcon}
          />

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>تمييز كـ "الأكثر طلباً"</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>تمييز كـ "صنف جديد"</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" variant="yellow" size="sm" className="font-bold px-5">
              {editingProduct ? 'حفظ التعديلات' : 'إضافة الصنف للمنيو'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
