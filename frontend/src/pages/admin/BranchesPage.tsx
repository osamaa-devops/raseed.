import { Edit, GitBranch, Plus, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Modal } from "../../components/feedback/Modal";
import { TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { branchesService, type CreateBranchRequest } from "../../services/branchesService";
import type { Branch } from "../../types";

const emptyForm: CreateBranchRequest = { name: "", address: "", phone: "" };

export function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState<CreateBranchRequest>(emptyForm);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setBranches(await branchesService.getBranches());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الفروع");
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
    setOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setForm({ name: branch.name, address: branch.address ?? "", phone: branch.phone ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError("اسم الفرع مطلوب.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
      };
      if (editing) await branchesService.update(editing.id, payload);
      else await branchesService.create(payload);
      setOpen(false);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ الفرع");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (branch: Branch) => {
    setError(null);
    try {
      await branchesService.updateStatus(branch.id, branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      await load();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "تعذر تغيير حالة الفرع");
    }
  };

  return (
    <div>
      <PageHeader title="الفروع" description="إدارة فروع المحل وربط العمليات بالفرع الصحيح." />
      <div className="mb-4 flex justify-end">
        <AppButton icon={Plus} onClick={openCreate}>فرع جديد</AppButton>
      </div>
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {loading ? (
        <AppCard>جار تحميل الفروع...</AppCard>
      ) : branches.length === 0 ? (
        <EmptyState icon={GitBranch} title="لا توجد فروع" description="أضف الفرع الرئيسي أو أي فرع آخر للمحل." />
      ) : (
        <DataTable
          columns={["اسم الفرع", "العنوان", "الهاتف", "النوع", "الحالة", "الإجراءات"]}
          rows={branches}
          renderRow={(branch) => (
            <tr key={branch.id} className="border-t border-border hover:bg-table-row-hover">
              <td className="px-4 py-3 font-semibold">{branch.name}</td>
              <td className="px-4 py-3">{branch.address ?? "-"}</td>
              <td className="px-4 py-3">{branch.phone ?? "-"}</td>
              <td className="px-4 py-3">{branch.isDefault ? "افتراضي" : branch.isMain ? "رئيسي" : "فرع"}</td>
              <td className="px-4 py-3"><StatusBadge label={branch.status === "INACTIVE" ? "غير نشط" : "نشط"} tone={branch.status === "INACTIVE" ? "muted" : "success"} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <AppButton variant="outline" icon={Edit} onClick={() => openEdit(branch)}>تعديل</AppButton>
                  <AppButton variant="ghost" icon={RefreshCcw} disabled={branch.isDefault} onClick={() => void changeStatus(branch)}>
                    {branch.status === "INACTIVE" ? "تفعيل" : "تعطيل"}
                  </AppButton>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <Modal open={open} title={editing ? "تعديل فرع" : "فرع جديد"} onClose={() => setOpen(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="اسم الفرع" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <TextInput label="الهاتف" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <TextInput className="md:col-span-2" label="العنوان" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
        </div>
        <div className="mt-4 flex gap-2">
          <AppButton onClick={save} disabled={saving}>{saving ? "جار الحفظ..." : "حفظ"}</AppButton>
          <AppButton variant="outline" onClick={() => setOpen(false)}>إلغاء</AppButton>
        </div>
      </Modal>
    </div>
  );
}
