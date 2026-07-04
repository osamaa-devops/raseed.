import { useEffect, useState } from "react";
import { Edit2, Plus, Tag, Trash2 } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { EmptyState } from "../../components/feedback/EmptyState";
import { LoadingSkeleton } from "../../components/feedback/LoadingSkeleton";
import { Modal } from "../../components/feedback/Modal";
import { TextInput } from "../../components/forms/FormControls";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { categoriesService, type CategoryPayload } from "../../services/categoriesService";
import type { Category } from "../../types";

const emptyForm: CategoryPayload = {
  name: "",
  description: "",
  color: "#0f766e",
  icon: "",
};

export function CategoriesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("categories.create");
  const canUpdate = hasPermission("categories.update");
  const canDelete = hasPermission("categories.delete");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryPayload>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await categoriesService.getCategories());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل التصنيفات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description ?? "",
      color: category.color ?? "#0f766e",
      icon: category.icon ?? "",
    });
    setModalOpen(true);
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
        description: form.description || null,
        color: form.color || null,
        icon: form.icon || null,
      };
      if (editing) {
        await categoriesService.updateCategory(editing.id, payload);
        setNotice("تم تحديث التصنيف");
      } else {
        await categoriesService.createCategory(payload);
        setNotice("تم إضافة التصنيف");
      }
      closeModal();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ التصنيف");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (category: Category) => {
    await categoriesService.updateCategoryStatus(category.id, category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
    setNotice("تم تحديث حالة التصنيف");
    await load();
  };

  const deleteCategory = async (category: Category) => {
    if ((category._count?.products ?? 0) > 0) {
      setError("لا يمكن حذف تصنيف يحتوي على منتجات. يمكن تعطيله بدلًا من ذلك.");
      return;
    }
    if (!window.confirm(`حذف التصنيف "${category.name}"؟`)) return;
    try {
      await categoriesService.deleteCategory(category.id);
      setNotice("تم حذف التصنيف");
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "تعذر حذف التصنيف");
    }
  };

  return (
    <div>
      <PageHeader
        title="التصنيفات"
        description="تصنيفات حقيقية مرتبطة بالمتجر الحالي."
        actions={canCreate ? <AppButton icon={Plus} onClick={openCreate}>إضافة تصنيف</AppButton> : null}
      />
      {notice && <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{notice}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {loading ? <LoadingSkeleton /> : categories.length === 0 ? (
        <EmptyState icon={Tag} title="لا توجد تصنيفات" description="ابدأ بإضافة تصنيفات المنتجات." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <AppCard key={category.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Tag className="mb-3" style={{ color: category.color ?? "var(--primary)" }} />
                  <h2 className="font-bold">{category.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{category.description || "بدون وصف"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">عدد المنتجات: {category._count?.products ?? 0}</p>
                </div>
                <StatusBadge label={category.status === "ACTIVE" ? "نشط" : "غير نشط"} tone={category.status === "ACTIVE" ? "success" : "muted"} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {canUpdate && <AppButton variant="outline" icon={Edit2} onClick={() => openEdit(category)}>تعديل</AppButton>}
                {canUpdate && <AppButton variant="ghost" onClick={() => void toggleStatus(category)}>{category.status === "ACTIVE" ? "تعطيل" : "تفعيل"}</AppButton>}
                {canDelete && <AppButton variant="danger" icon={Trash2} onClick={() => void deleteCategory(category)}>حذف</AppButton>}
              </div>
            </AppCard>
          ))}
        </div>
      )}
      <Modal open={modalOpen} title={editing ? "تعديل تصنيف" : "إضافة تصنيف"} onClose={closeModal}>
        <div className="grid gap-3">
          <TextInput label="اسم التصنيف" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <TextInput label="الوصف" value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <TextInput label="اللون" type="color" value={form.color ?? "#0f766e"} onChange={(event) => setForm({ ...form, color: event.target.value })} />
          <TextInput label="أيقونة" value={form.icon ?? ""} onChange={(event) => setForm({ ...form, icon: event.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <AppButton variant="outline" onClick={closeModal}>إلغاء</AppButton>
            <AppButton onClick={save} disabled={saving}>{saving ? "جار الحفظ..." : "حفظ"}</AppButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
