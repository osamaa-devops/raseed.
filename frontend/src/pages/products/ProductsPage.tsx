import { useEffect, useMemo, useState } from "react";
import { Barcode, Download, Edit2, Package, Plus, Printer, Search, Tags, Trash2 } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { EmptyState } from "../../components/feedback/EmptyState";
import { LoadingSkeleton } from "../../components/feedback/LoadingSkeleton";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { BarcodeLabelsSheet } from "../../components/printing/BarcodeLabelsSheet";
import { PrintButton } from "../../components/printing/PrintButton";
import { barcodeService } from "../../services/barcodeService";
import { categoriesService } from "../../services/categoriesService";
import { importExportService } from "../../services/importExportService";
import { productsService, type ProductPayload, type ProductVariantPayload } from "../../services/productsService";
import type { BarcodeLabelPayload, BarcodeLabelSize, Category, Product } from "../../types";

type ProductVariantRecord = NonNullable<Product["variants"]>[number];

const emptyForm: ProductPayload = {
  name: "",
  categoryId: "",
  brand: "",
  gender: "UNISEX",
  season: "ALL_SEASON",
  barcode: "",
  sku: "",
  description: "",
  imageUrl: "",
  unitType: "قطعة",
  expiryDate: "",
  purchasePrice: 0,
  sellingPrice: 0,
  minStock: 0,
  variants: [emptyVariant()],
};

export function ProductsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("products.create");
  const canUpdate = hasPermission("products.update");
  const canDelete = hasPermission("products.delete");
  const canGenerateBarcode = hasPermission("products.generate_barcode");
  const canPrintBarcodes = hasPermission("printing.barcodes");
  const canExport = hasPermission("products.export");
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [labelPayload, setLabelPayload] = useState<BarcodeLabelPayload | null>(null);
  const [labelCopies, setLabelCopies] = useState(1);
  const [autoGenerateLabels, setAutoGenerateLabels] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        productsService.getProducts({ search, categoryId, status: status as Product["status"] | undefined, limit: 100, sortBy: "createdAt", sortDir: "desc" }),
        categoriesService.getCategories(),
      ]);
      setProducts(productResponse.items);
      setSelectedIds((ids) => ids.filter((id) => productResponse.items.some((product) => product.id === id)));
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
    const primaryVariant = product.variants?.[0];
    setForm({
      name: product.name,
      categoryId: product.categoryId ?? "",
      brand: product.brand ?? "",
      gender: product.gender ?? "UNISEX",
      season: product.season ?? "ALL_SEASON",
      barcode: product.barcode ?? "",
      sku: product.sku ?? "",
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      unitType: product.unitType ?? "قطعة",
      expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : "",
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      minStock: product.minStock,
      variants: product.variants?.length
        ? product.variants.map((variant) => variantToForm(variant))
        : [variantFromProduct(product, primaryVariant)],
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
      const variants = normalizeVariants(form);
      const payload = {
        ...form,
        categoryId: form.categoryId || null,
        brand: form.brand || null,
        gender: form.gender,
        season: form.season,
        barcode: form.barcode || null,
        sku: form.sku || null,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        unitType: form.unitType || null,
        expiryDate: form.expiryDate || null,
        variants,
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

  const toggleSelected = (id: string) => {
    setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  };

  const generateBarcode = async (product: Product) => {
    setError(null);
    try {
      await barcodeService.generateProductBarcode(product.id);
      setNotice("تم توليد الباركود");
      await load();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "تعذر توليد الباركود");
    }
  };

  const openLabels = async (ids: string[]) => {
    if (ids.length === 0) return;
    setError(null);
    try {
      const payload = await barcodeService.getBarcodeLabelsPayload(ids, labelCopies, autoGenerateLabels);
      setLabelPayload(payload);
      await load();
    } catch (labelsError) {
      setError(labelsError instanceof Error ? labelsError.message : "تعذر تجهيز ملصقات الباركود");
    }
  };

  const updateLabelSetting = <K extends keyof BarcodeLabelPayload["settings"]>(key: K, value: BarcodeLabelPayload["settings"][K]) => {
    setLabelPayload((payload) => payload ? { ...payload, settings: { ...payload.settings, [key]: value } } : payload);
  };

  const updateLabelCopies = (copies: number) => {
    const nextCopies = Math.max(1, copies);
    setLabelCopies(nextCopies);
    setLabelPayload((payload) => payload ? { ...payload, products: payload.products.map((product) => ({ ...product, copies: nextCopies })) } : payload);
  };

  const updateVariant = (index: number, patch: Partial<ProductVariantPayload>) => {
    setForm((current) => ({
      ...current,
      variants: (current.variants ?? [emptyVariant()]).map((variant, currentIndex) =>
        currentIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  };

  return (
    <div>
      <PageHeader
        title="المنتجات"
        description="كتالوج منتجات حقيقي مرتبط بالمتجر الحالي."
        actions={
          <div className="flex flex-wrap gap-2">
            {canPrintBarcodes && <AppButton variant="outline" icon={Tags} disabled={selectedIds.length === 0} onClick={() => void openLabels(selectedIds)}>طباعة المحدد</AppButton>}
            {canExport && <AppButton variant="outline" icon={Download} onClick={() => void importExportService.exportProducts("xlsx", { search, categoryId, status })}>تصدير</AppButton>}
            {canCreate && <AppButton icon={Plus} onClick={openCreate}>إضافة منتج</AppButton>}
          </div>
        }
      />
      <AppCard className="mb-4 bg-muted/35">
        <p className="text-sm font-semibold text-foreground">بداية سريعة</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">يمكنك استيراد الأصناف من Excel لبدء التشغيل بسرعة، أو إضافة المنتجات يدويًا مع توليد باركود وملصقات للطباعة.</p>
      </AppCard>
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
          columns={["", "الاسم", "الباركود", "التصنيف", "العلامة", "النسخ", "سعر الشراء", "سعر البيع", "هامش الربح", "الحد الأدنى", "الحالة", "الإجراءات"]}
          rows={products}
          renderRow={(product) => (
            <tr key={product.id} className="border-t border-border hover:bg-table-row-hover">
              <td className="px-4 py-3">
                {canPrintBarcodes && <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelected(product.id)} aria-label={`اختيار ${product.name}`} />}
              </td>
              <td className="px-4 py-3 font-semibold">{product.name}</td>
              <td className="px-4 py-3 font-mono text-muted-foreground" dir="ltr">{product.barcode ?? "-"}</td>
              <td className="px-4 py-3">{product.category?.name ?? "-"}</td>
              <td className="px-4 py-3">{product.brand ?? "-"}</td>
              <td className="px-4 py-3">{product.variants?.length ?? 0}</td>
              <td className="px-4 py-3">{product.purchasePrice.toLocaleString("ar-EG")} ج</td>
              <td className="px-4 py-3">{product.sellingPrice.toLocaleString("ar-EG")} ج</td>
              <td className="px-4 py-3">{product.profitMargin.toLocaleString("ar-EG")}%</td>
              <td className="px-4 py-3">{product.minStock}</td>
              <td className="px-4 py-3"><StatusBadge label={product.status === "ACTIVE" ? "نشط" : "غير نشط"} tone={product.status === "ACTIVE" ? "success" : "muted"} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {canUpdate && <AppButton variant="outline" icon={Edit2} onClick={() => openEdit(product)}>تعديل</AppButton>}
                  {canGenerateBarcode && (
                    <AppButton variant="outline" icon={Barcode} onClick={() => void generateBarcode(product)}>
                      {product.barcode ? "إعادة توليد" : "توليد باركود"}
                    </AppButton>
                  )}
                  {canPrintBarcodes && <AppButton variant="ghost" icon={Printer} onClick={() => void openLabels([product.id])}>ملصق</AppButton>}
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
            <TextInput label="العلامة التجارية" value={form.brand ?? ""} onChange={(event) => setForm({ ...form, brand: event.target.value })} />
            <SelectInput label="النوع" value={form.gender ?? "UNISEX"} onChange={(event) => setForm({ ...form, gender: event.target.value as Product["gender"] })}>
              <option value="UNISEX">موحد</option>
              <option value="MEN">رجالي</option>
              <option value="WOMEN">حريمي</option>
              <option value="KIDS">أطفال</option>
            </SelectInput>
            <SelectInput label="الموسم" value={form.season ?? "ALL_SEASON"} onChange={(event) => setForm({ ...form, season: event.target.value as Product["season"] })}>
              <option value="ALL_SEASON">كل المواسم</option>
              <option value="SUMMER">صيفي</option>
              <option value="WINTER">شتوي</option>
              <option value="SPRING">ربيعي</option>
              <option value="AUTUMN">خريفي</option>
            </SelectInput>
            <TextInput label="الوحدة" value={form.unitType ?? "قطعة"} onChange={(event) => setForm({ ...form, unitType: event.target.value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="الباركود" value={form.barcode ?? ""} onChange={(event) => setForm({ ...form, barcode: event.target.value })} />
            <TextInput label="SKU" value={form.sku ?? ""} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
            <TextInput label="سعر الشراء" type="number" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: Number(event.target.value) })} />
            <TextInput label="سعر البيع" type="number" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: Number(event.target.value) })} />
            <TextInput label="الحد الأدنى للمخزون" type="number" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: Number(event.target.value) })} />
            <TextInput label="تاريخ الصلاحية" type="date" value={form.expiryDate ?? ""} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} />
          </div>
          <TextInput label="الوصف" value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="rounded-xl border border-border p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-bold">النسخ / المقاسات</h3>
              <AppButton variant="outline" onClick={() => setForm((current) => ({ ...current, variants: [...(current.variants ?? []), emptyVariant()] }))}>إضافة نسخة</AppButton>
            </div>
            <div className="space-y-3">
              {(form.variants ?? []).map((variant, index) => (
                <div key={index} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">النسخة {index + 1}</p>
                    <AppButton
                      variant="ghost"
                      onClick={() => setForm((current) => ({ ...current, variants: (current.variants ?? []).filter((_, currentIndex) => currentIndex !== index) || [emptyVariant()] }))}
                      disabled={(form.variants?.length ?? 0) <= 1}
                    >
                      حذف
                    </AppButton>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <TextInput label="المقاس" value={variant.size} onChange={(event) => updateVariant(index, { size: event.target.value })} />
                    <TextInput label="اللون" value={variant.color} onChange={(event) => updateVariant(index, { color: event.target.value })} />
                    <TextInput label="SKU" value={variant.sku ?? ""} onChange={(event) => updateVariant(index, { sku: event.target.value })} />
                    <TextInput label="الباركود" value={variant.barcode ?? ""} onChange={(event) => updateVariant(index, { barcode: event.target.value })} />
                    <TextInput label="سعر الشراء" type="number" value={variant.costPrice} onChange={(event) => updateVariant(index, { costPrice: Number(event.target.value) })} />
                    <TextInput label="سعر البيع" type="number" value={variant.sellingPrice} onChange={(event) => updateVariant(index, { sellingPrice: Number(event.target.value) })} />
                    <TextInput label="سعر الخصم" type="number" value={variant.discountPrice ?? ""} onChange={(event) => updateVariant(index, { discountPrice: event.target.value === "" ? null : Number(event.target.value) })} />
                    <TextInput label="الكمية" type="number" value={variant.stockQuantity} onChange={(event) => updateVariant(index, { stockQuantity: Number(event.target.value) })} />
                    <TextInput label="حد التنبيه" type="number" value={variant.minStock} onChange={(event) => updateVariant(index, { minStock: Number(event.target.value) })} />
                    <SelectInput label="حالة النسخة" value={variant.status ?? "ACTIVE"} onChange={(event) => updateVariant(index, { status: event.target.value as ProductVariantPayload["status"] })}>
                      <option value="ACTIVE">نشطة</option>
                      <option value="INACTIVE">غير نشطة</option>
                    </SelectInput>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <AppButton variant="outline" onClick={closeModal}>إلغاء</AppButton>
            <AppButton onClick={save} disabled={saving}>{saving ? "جار الحفظ..." : "حفظ"}</AppButton>
          </div>
        </div>
      </Modal>
      <Modal open={Boolean(labelPayload)} title="طباعة ملصقات الباركود" onClose={() => setLabelPayload(null)}>
        {labelPayload && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <TextInput label="عدد النسخ" type="number" value={labelCopies} onChange={(event) => updateLabelCopies(Number(event.target.value))} />
              <SelectInput label="حجم الملصق" value={labelPayload.settings.labelSize} onChange={(event) => updateLabelSetting("labelSize", event.target.value as BarcodeLabelSize)}>
                <option value="SMALL">صغير</option>
                <option value="MEDIUM">متوسط</option>
                <option value="LARGE">كبير</option>
              </SelectInput>
              <TextInput label="الأعمدة" type="number" value={labelPayload.settings.columns} onChange={(event) => updateLabelSetting("columns", Math.max(1, Number(event.target.value)))} />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={autoGenerateLabels} onChange={(event) => setAutoGenerateLabels(event.target.checked)} /> توليد باركود تلقائياً للمنتجات الناقصة</label>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={labelPayload.settings.showProductName} onChange={(event) => updateLabelSetting("showProductName", event.target.checked)} /> اسم المنتج</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={labelPayload.settings.showPrice} onChange={(event) => updateLabelSetting("showPrice", event.target.checked)} /> السعر</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={labelPayload.settings.showBarcodeText} onChange={(event) => updateLabelSetting("showBarcodeText", event.target.checked)} /> رقم الباركود</label>
            </div>
            <BarcodeLabelsSheet payload={labelPayload} />
            <div className="flex justify-end gap-2">
              <AppButton variant="outline" onClick={() => setLabelPayload(null)}>إغلاق</AppButton>
              <PrintButton label="طباعة الملصقات" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function emptyVariant(): ProductVariantPayload {
  return {
    size: "",
    color: "",
    sku: "",
    barcode: "",
    costPrice: 0,
    sellingPrice: 0,
    discountPrice: null,
    stockQuantity: 0,
    minStock: 0,
    status: "ACTIVE",
  };
}

function variantToForm(variant: ProductVariantRecord): ProductVariantPayload {
  return {
    size: variant.size,
    color: variant.color,
    sku: variant.sku ?? "",
    barcode: variant.barcode ?? "",
    costPrice: variant.costPrice,
    sellingPrice: variant.sellingPrice,
    discountPrice: variant.discountPrice ?? null,
    stockQuantity: variant.stockQuantity,
    minStock: variant.minStock,
    status: variant.status,
  };
}

function variantFromProduct(product: Product, variant?: ProductVariantRecord): ProductVariantPayload {
  return {
    size: variant?.size ?? "One Size",
    color: variant?.color ?? "Mixed",
    sku: variant?.sku ?? product.sku ?? "",
    barcode: variant?.barcode ?? product.barcode ?? "",
    costPrice: variant?.costPrice ?? product.purchasePrice,
    sellingPrice: variant?.sellingPrice ?? product.sellingPrice,
    discountPrice: variant?.discountPrice ?? null,
    stockQuantity: variant?.stockQuantity ?? 0,
    minStock: variant?.minStock ?? product.minStock,
    status: variant?.status ?? product.status,
  };
}

function normalizeVariants(form: ProductPayload) {
  const variants = form.variants?.length ? form.variants : [emptyVariant()];
  return variants.map((variant, index) => ({
    size: variant.size.trim() || `Size ${index + 1}`,
    color: variant.color.trim() || "Mixed",
    sku: variant.sku?.trim() || null,
    barcode: variant.barcode?.trim() || null,
    costPrice: Number(variant.costPrice ?? 0),
    sellingPrice: Number(variant.sellingPrice ?? 0),
    discountPrice: variant.discountPrice === null || variant.discountPrice === undefined ? null : Number(variant.discountPrice),
    stockQuantity: Number(variant.stockQuantity ?? 0),
    minStock: Number(variant.minStock ?? 0),
    status: variant.status ?? "ACTIVE",
  }));
}
