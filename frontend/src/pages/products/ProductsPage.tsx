import { useEffect, useMemo, useState } from "react";
import { Edit2, Package, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { EmptyState } from "../../components/feedback/EmptyState";
import { LoadingSkeleton } from "../../components/feedback/LoadingSkeleton";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { categoriesService } from "../../services/categoriesService";
import { productsService, type ProductPayload } from "../../services/productsService";
import type { Category, Product } from "../../types";

const emptyForm: ProductPayload = {
  name: "",
  categoryId: "",
  barcode: "",
  sku: "",
  description: "",
  imageUrl: "",
  purchasePrice: 0,
  sellingPrice: 0,
  unitType: "قطعة",
  minStock: 0,
  expiryDate: "",
};

export function ProductsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("products.create");
  const canUpdate = hasPermission("products.update");
  const canDelete = hasPermission("products.delete");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductPayload>(emptyForm);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        productsService.getProducts({ search, categoryId, status: status as Product["status"] | undefined, limit: 100, sortBy: "createdAt", sortDir: "desc" }),
        categoriesService.getCategories(),
      ]);
      setProducts(productResponse.items);
      setCategories(categoryResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activeCategories = useMemo(() => categories.filter((category) => category.status === "ACTIVE"), [categories]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setModalOpen(true);
    setForm({
      name: product.name,
      categoryId: product.categoryId ?? "",
      barcode: product.barcode ?? "",
      sku: product.sku ?? "",
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      unitType: product.unitType,
      minStock: product.minStock,
      expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : "",
    });
  };

  const closeModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId || null,
        barcode: form.barcode || null,
        sku: form.sku || null,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        expiryDate: form.expiryDate || null,
      };
      if (editing) {
        await productsService.updateProduct(editing.id, payload);
        setNotice("تم تحديث المنتج");
      } else {
        await productsService.createProduct(payload);
        setNotice("تم إضافة المنتج");
      }
      closeModal();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ المنتج");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (product: Product) => {
    await productsService.updateProductStatus(product.id, product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
    setNotice("تم تحديث حالة المنتج");
    await load();
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`حذف المنتج "${product.name}"؟`)) return;
    await productsService.deleteProduct(product.id);
    setNotice("تم حذف المنتج");
    await load();
  };

  return (
    <div>
      <PageHeader
        title="المنتجات"
        description="كتالوج منتجات حقيقي مرتبط بالمتجر الحالي."
        actions={canCreate ? <AppButton icon={Plus} onClick={openCreate}>إضافة منتج</AppButton> : null}
      />
      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_220px_180px_auto]">
        <TextInput placeholder="بحث بالاسم أو الباركود أو SKU" value={search} onChange={(event) => setSearch(event.target.value)} />
        <SelectInput value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">كل التصنيفات</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </SelectInput>
        <SelectInput value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">كل الحالات</option>
          <option value="ACTIVE">نشط</option>
          <option value="INACTIVE">غير نشط</option>
        </SelectInput>
        <AppButton variant="outline" icon={Search} onClick={load}>بحث</AppButton>
      </div>
      {notice && <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{notice}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {loading ? <LoadingSkeleton /> : products.length === 0 ? (
        <EmptyState icon={Package} title="لا توجد منتجات" description="ابدأ بإضافة أول منتج في المتجر." />
      ) : (
        <DataTable
          columns={["الاسم", "الباركود", "التصنيف", "سعر الشراء", "سعر البيع", "هامش الربح", "الحد الأدنى", "الحالة", "الإجراءات"]}
          rows={products}
          renderRow={(product) => (
            <tr key={product.id} className="border-t border-border hover:bg-table-row-hover">
              <td className="px-4 py-3 font-semibold">{product.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{product.barcode ?? "-"}</td>
              <td className="px-4 py-3">{product.category?.name ?? "-"}</td>
              <td className="px-4 py-3">{product.purchasePrice.toLocaleString("ar-EG")} ج</td>
              <td className="px-4 py-3">{product.sellingPrice.toLocaleString("ar-EG")} ج</td>
              <td className="px-4 py-3">{product.profitMargin.toLocaleString("ar-EG")}%</td>
              <td className="px-4 py-3">{product.minStock}</td>
              <td className="px-4 py-3"><StatusBadge label={product.status === "ACTIVE" ? "نشط" : "غير نشط"} tone={product.status === "ACTIVE" ? "success" : "muted"} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {canUpdate && <AppButton variant="outline" icon={Edit2} onClick={() => openEdit(product)}>تعديل</AppButton>}
                  {canUpdate && <AppButton variant="ghost" onClick={() => void toggleStatus(product)}>{product.status === "ACTIVE" ? "تعطيل" : "تفعيل"}</AppButton>}
                  {canDelete && <AppButton variant="danger" icon={Trash2} onClick={() => void deleteProduct(product)}>حذف</AppButton>}
                </div>
              </td>
            </tr>
          )}
        />
      )}
      <Modal open={modalOpen} title={editing ? "تعديل منتج" : "إضافة منتج"} onClose={closeModal}>
        <div className="grid gap-3">
          <TextInput label="اسم المنتج" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <SelectInput label="التصنيف" value={form.categoryId ?? ""} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
            <option value="">بدون تصنيف</option>
            {activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </SelectInput>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="الباركود" value={form.barcode ?? ""} onChange={(event) => setForm({ ...form, barcode: event.target.value })} />
            <TextInput label="SKU" value={form.sku ?? ""} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
            <TextInput label="سعر الشراء" type="number" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: Number(event.target.value) })} />
            <TextInput label="سعر البيع" type="number" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: Number(event.target.value) })} />
            <TextInput label="الوحدة" value={form.unitType} onChange={(event) => setForm({ ...form, unitType: event.target.value })} />
            <TextInput label="الحد الأدنى للمخزون" type="number" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: Number(event.target.value) })} />
          </div>
          <TextInput label="الوصف" value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <AppButton variant="outline" onClick={closeModal}>إلغاء</AppButton>
            <AppButton onClick={save} disabled={saving}>{saving ? "جار الحفظ..." : "حفظ"}</AppButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
