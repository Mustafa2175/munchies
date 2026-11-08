/**
 * @module pages/admin/ProductsPage
 * @description Catalog manager with complete Add/Edit product modal strictly in Arabic.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Archive, Image as ImageIcon } from 'lucide-react';
import { PRODUCTS } from '@/data/mockData';
import type { Product } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import toast from 'react-hot-toast';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('munchies_custom_products');
    return local ? JSON.parse(local) : PRODUCTS;
  });

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

  const saveProductsToStorage = (updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem('munchies_custom_products', JSON.stringify(updated));
  };

  const toggleAvailability = (id: string) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, isAvailable: !p.isAvailable } : p
    );
    saveProductsToStorage(updated);
    toast.success('تم تحديث حالة توفر الصنف');
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setNameAr('');
    setDescAr('');
    setPrice(120);
    setCategoryId('sandwiches');
    setImageUrl('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80');
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
      const updated = products.filter((p) => p.id !== id);
      saveProductsToStorage(updated);
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
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: { ar: nameAr.trim(), en: p.name.en || nameAr.trim() },
              description: { ar: descAr.trim(), en: p.description.en || descAr.trim() },
              price: Number(price),
              categoryId,
              image: imageUrl.trim() || p.image,
              isBestSeller,
              isNew,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      saveProductsToStorage(updated);
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
        image:
          imageUrl.trim() ||
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        isBestSeller,
        isNew,
        sortOrder: products.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveProductsToStorage([newProduct, ...products]);
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
          <h1 className="text-2xl font-black text-[#26212B]">قائمة أصناف المنيو</h1>
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
          className="w-full sm:w-72 text-xs rounded-xl border border-gray-200 bg-white py-2 px-3 focus:outline-none focus:border-[#512080]"
        />
        <span className="text-xs text-gray-500 font-bold">{filtered.length} صنف</span>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[#F5F3F7] text-gray-500 font-bold">
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
                      <span className="font-bold text-[#26212B]">{product.name.ar}</span>
                      {product.isBestSeller && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#FFDA35] text-[#26212B]">
                          الأكثر طلباً
                        </span>
                      )}
                      {product.isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#512080] text-white">
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
                  <td className="px-5 py-3 font-extrabold text-[#512080]">
                    <CurrencyDisplay amount={product.price} />
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleAvailability(product.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                        product.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {product.isAvailable ? 'متاح للطلب' : 'غير متوفر'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1 rounded-lg text-gray-400 hover:text-[#512080] hover:bg-gray-100"
                        title="تعديل الصنف"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100"
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
              <label className="block text-xs font-semibold text-[#26212B] mb-1.5">
                القسم التابع له
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 bg-white p-2.5 focus:outline-none focus:border-[#512080]"
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
              <label className="block text-xs font-semibold text-[#26212B] mb-1.5">
                السعر (ج.م)
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-gray-200 bg-white p-2.5 focus:outline-none focus:border-[#512080] number-ltr"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26212B] mb-1.5">
              الوصف والمكونات
            </label>
            <textarea
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
              rows={2}
              placeholder="مثال: برجر لحم بلدي + صوص مانشيز + شرائح شيدر وبطاطس..."
              className="w-full text-xs rounded-xl border border-gray-200 p-2.5 focus:outline-none focus:border-[#512080]"
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
                className="rounded border-gray-300 text-[#512080] focus:ring-[#512080]"
              />
              <span>تمييز كـ "الأكثر طلباً"</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="rounded border-gray-300 text-[#512080] focus:ring-[#512080]"
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
