import { Edit, Eye, Plus, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { plansService } from "../../services/plansService";
import { superAdminService } from "../../services/superAdminService";
import type { AdminStoreDetails, AdminStoreListItem, BillingCycle, StoreStatus, SubscriptionPlan, SubscriptionStatus } from "../../types";

const emptyForm = {
  name: "", ownerName: "", phone: "", email: "", planId: "", billingCycle: "MONTHLY" as BillingCycle, trialDays: 14,
  ownerUserName: "", ownerUserEmail: "", ownerUserPhone: "", ownerPassword: "",
  cashierUserName: "", cashierUserEmail: "", cashierUserPhone: "", cashierPassword: "",
  mainBranchName: "الفرع الرئيسي", mainBranchAddress: "",
};

export function StoresPage() {
  const [stores, setStores] = useState<AdminStoreListItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selected, setSelected] = useState<AdminStoreDetails | null>(null);
  const [filters, setFilters] = useState({ search: "", status: "" as StoreStatus | "", planId: "", subscriptionStatus: "" as SubscriptionStatus | "" });
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({ name: "", ownerName: "", phone: "", email: "" });
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [storesResponse, plansResponse] = await Promise.all([
        superAdminService.getStores({ ...filters, limit: 50 }),
        plansService.getPlans(),
      ]);
      setStores(storesResponse.items);
      setPlans(plansResponse);
      setForm((current) => ({ ...current, planId: current.planId || plansResponse[0]?.id || "" }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل المحلات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filters.status, filters.planId, filters.subscriptionStatus]);

  const openDetails = async (id: string) => {
    setSelected(await superAdminService.getStore(id));
  };

  const openEditStore = async (id: string) => {
    const store = await superAdminService.getStore(id);
    setSelected(store);
    setEditForm({
      name: store.name,
      ownerName: store.ownerName ?? "",
      phone: store.phone ?? "",
      email: store.email ?? "",
    });
    setOpenEdit(true);
  };

  const createStore = async () => {
    try {
      await superAdminService.createStore({
        ...form,
        email: form.email || undefined,
        trialDays: form.billingCycle === "TRIAL" ? Number(form.trialDays) || 14 : undefined,
        ownerUserEmail: form.ownerUserEmail || undefined,
        cashierUserName: form.cashierUserName || undefined,
        cashierUserEmail: form.cashierUserEmail || undefined,
        cashierUserPhone: form.cashierUserPhone || undefined,
        cashierPassword: form.cashierPassword || undefined,
        mainBranchAddress: form.mainBranchAddress || undefined,
      });
      setOpenCreate(false);
      setForm({ ...emptyForm, planId: plans[0]?.id ?? "" });
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "تعذر إنشاء المتجر");
    }
  };

  const changeStatus = async (store: AdminStoreListItem, status: StoreStatus) => {
    await superAdminService.updateStoreStatus(store.id, status);
    await load();
    if (selected?.id === store.id) setSelected(await superAdminService.getStore(store.id));
  };

  const updateSelectedStore = async () => {
    if (!selected) return;
    try {
      await superAdminService.updateStore(selected.id, {
        name: editForm.name.trim(),
        ownerName: editForm.ownerName.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || null,
      });
      const updated = await superAdminService.getStore(selected.id);
      setSelected(updated);
      setOpenEdit(false);
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "تعذر تعديل بيانات المحل");
    }
  };

  return (
    <div>
      <PageHeader title="المحلات" description="إدارة المستأجرين، الاشتراكات، والحالة التشغيلية لكل متجر." />
      <AppCard className="mb-6">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_220px_auto]">
          <TextInput label="بحث" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} onBlur={load} />
          <SelectInput label="حالة المتجر" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as StoreStatus | "" }))}>
            <option value="">الكل</option><option value="ACTIVE">نشط</option><option value="TRIAL">تجريبي</option><option value="SUSPENDED">موقوف</option><option value="EXPIRED">منتهي</option>
          </SelectInput>
          <SelectInput label="الباقة" value={filters.planId} onChange={(event) => setFilters((current) => ({ ...current, planId: event.target.value }))}>
            <option value="">كل الباقات</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </SelectInput>
          <div className="flex items-end gap-2">
            <AppButton variant="outline" onClick={load}>تصفية</AppButton>
            <AppButton icon={Plus} onClick={() => setOpenCreate(true)}>متجر جديد</AppButton>
          </div>
        </div>
      </AppCard>
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {loading ? <AppCard>جار تحميل المحلات...</AppCard> : (
        <DataTable
          columns={["اسم المتجر", "المالك", "الهاتف", "الباقة", "حالة الاشتراك", "حالة المتجر", "تاريخ الانتهاء", "الاستخدام", "الإجراءات"]}
          rows={stores}
          renderRow={(store) => (
            <tr key={store.id} className="border-t border-border hover:bg-table-row-hover">
              <td className="px-4 py-3 font-semibold">{store.name}</td>
              <td className="px-4 py-3">{store.ownerName ?? "-"}</td>
              <td className="px-4 py-3">{store.phone ?? "-"}</td>
              <td className="px-4 py-3">{store.currentSubscription?.plan?.name ?? "-"}</td>
              <td className="px-4 py-3"><StatusBadge label={subscriptionStatusLabel(store.currentSubscription?.status)} tone={subscriptionTone(store.currentSubscription?.status)} /></td>
              <td className="px-4 py-3"><StatusBadge label={storeStatusLabel(store.status)} tone={storeTone(store.status)} /></td>
              <td className="px-4 py-3">{formatDate(store.currentSubscription?.endDate)}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{store.usage.usersCount}/{store.usage.limits?.maxUsers ?? "-"} مستخدمين</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <AppButton variant="outline" icon={Eye} onClick={() => void openDetails(store.id)}>عرض</AppButton>
                  <AppButton variant="outline" icon={Edit} onClick={() => void openEditStore(store.id)}>تعديل</AppButton>
                  {store.status !== "SUSPENDED" ? <AppButton variant="ghost" onClick={() => void changeStatus(store, "SUSPENDED")}>إيقاف</AppButton> : <AppButton variant="ghost" icon={RefreshCcw} onClick={() => void changeStatus(store, "ACTIVE")}>تفعيل</AppButton>}
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <Modal open={openCreate} title="إنشاء متجر جديد" onClose={() => setOpenCreate(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="اسم المتجر" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <TextInput label="اسم المالك" value={form.ownerName} onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))} />
          <TextInput label="هاتف المتجر" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <TextInput label="بريد المتجر" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <SelectInput label="الباقة" value={form.planId} onChange={(event) => setForm((current) => ({ ...current, planId: event.target.value }))}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</SelectInput>
          <SelectInput label="الدورة" value={form.billingCycle} onChange={(event) => setForm((current) => ({ ...current, billingCycle: event.target.value as BillingCycle }))}>
            <option value="MONTHLY">شهري</option><option value="YEARLY">سنوي</option><option value="TRIAL">تجريبي</option>
          </SelectInput>
          {form.billingCycle === "TRIAL" && <TextInput label="أيام التجربة" type="number" value={form.trialDays} onChange={(event) => setForm((current) => ({ ...current, trialDays: Number(event.target.value) }))} />}
          <TextInput label="اسم مستخدم المالك" value={form.ownerUserName} onChange={(event) => setForm((current) => ({ ...current, ownerUserName: event.target.value }))} />
          <TextInput label="بريد المالك" value={form.ownerUserEmail} onChange={(event) => setForm((current) => ({ ...current, ownerUserEmail: event.target.value }))} />
          <TextInput label="هاتف المالك" value={form.ownerUserPhone} onChange={(event) => setForm((current) => ({ ...current, ownerUserPhone: event.target.value }))} />
          <TextInput label="كلمة المرور" type="password" value={form.ownerPassword} onChange={(event) => setForm((current) => ({ ...current, ownerPassword: event.target.value }))} />
          <TextInput label="اسم الكاشير" value={form.cashierUserName} onChange={(event) => setForm((current) => ({ ...current, cashierUserName: event.target.value }))} />
          <TextInput label="بريد الكاشير" value={form.cashierUserEmail} onChange={(event) => setForm((current) => ({ ...current, cashierUserEmail: event.target.value }))} />
          <TextInput label="هاتف الكاشير" value={form.cashierUserPhone} onChange={(event) => setForm((current) => ({ ...current, cashierUserPhone: event.target.value }))} />
          <TextInput label="كلمة مرور الكاشير" type="password" value={form.cashierPassword} onChange={(event) => setForm((current) => ({ ...current, cashierPassword: event.target.value }))} />
          <TextInput label="اسم الفرع الرئيسي" value={form.mainBranchName} onChange={(event) => setForm((current) => ({ ...current, mainBranchName: event.target.value }))} />
          <TextInput label="عنوان الفرع" value={form.mainBranchAddress} onChange={(event) => setForm((current) => ({ ...current, mainBranchAddress: event.target.value }))} />
        </div>
        <div className="mt-4 flex gap-2"><AppButton onClick={createStore}>إنشاء</AppButton><AppButton variant="outline" onClick={() => setOpenCreate(false)}>إلغاء</AppButton></div>
      </Modal>

      <Modal open={Boolean(selected)} title="تفاصيل المتجر" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <h3 className="text-lg font-bold">{selected.name}</h3>
              <p className="text-muted-foreground">{selected.ownerName ?? "-"} - {selected.phone ?? "-"}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="الخطة" value={selected.currentSubscription?.plan?.name ?? "-"} />
              <Info label="حالة الاشتراك" value={subscriptionStatusLabel(selected.currentSubscription?.status)} />
              <Info label="حالة المتجر" value={storeStatusLabel(selected.status)} />
              <Info label="الانتهاء" value={formatDate(selected.currentSubscription?.endDate)} />
            </div>
            <AppCard>
              <h3 className="font-bold">ملخص الاستخدام</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Info label="المستخدمون" value={`${selected.usage.usersCount} / ${selected.usage.limits?.maxUsers ?? "-"}`} />
                <Info label="الفروع" value={`${selected.usage.branchesCount} / ${selected.usage.limits?.maxBranches ?? "-"}`} />
                <Info label="المنتجات" value={`${selected.usage.productsCount} / ${selected.usage.limits?.maxProducts ?? "-"}`} />
                <Info label="فواتير الشهر" value={`${selected.usage.invoicesThisMonth} / ${selected.usage.limits?.maxInvoicesPerMonth ?? "-"}`} />
              </div>
            </AppCard>
          </div>
        )}
      </Modal>

      <Modal open={openEdit} title="تعديل بيانات المحل" onClose={() => setOpenEdit(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="اسم المتجر" value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} />
          <TextInput label="اسم المالك" value={editForm.ownerName} onChange={(event) => setEditForm((current) => ({ ...current, ownerName: event.target.value }))} />
          <TextInput label="هاتف المتجر" value={editForm.phone} onChange={(event) => setEditForm((current) => ({ ...current, phone: event.target.value }))} />
          <TextInput label="بريد المتجر" value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))} />
        </div>
        <div className="mt-4 flex gap-2">
          <AppButton onClick={updateSelectedStore} disabled={!editForm.name.trim()}>حفظ التعديل</AppButton>
          <AppButton variant="outline" onClick={() => setOpenEdit(false)}>إلغاء</AppButton>
        </div>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border px-3 py-2"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(value)) : "-";
}

function storeStatusLabel(status: string) {
  return status === "ACTIVE" ? "نشط" : status === "TRIAL" ? "تجريبي" : status === "SUSPENDED" ? "موقوف" : status === "EXPIRED" ? "منتهي" : "ملغي";
}

function storeTone(status: string) {
  return status === "ACTIVE" ? "success" : status === "TRIAL" ? "info" : status === "SUSPENDED" ? "warning" : "danger";
}

function subscriptionStatusLabel(status?: string | null) {
  if (!status) return "-";
  return status === "ACTIVE" ? "نشط" : status === "TRIAL" ? "تجريبي" : status === "SUSPENDED" ? "موقوف" : status === "PAST_DUE" ? "متأخر" : status === "EXPIRED" ? "منتهي" : "ملغي";
}

function subscriptionTone(status?: string | null) {
  if (status === "ACTIVE") return "success";
  if (status === "TRIAL") return "info";
  if (status === "SUSPENDED" || status === "PAST_DUE") return "warning";
  return "danger";
}
