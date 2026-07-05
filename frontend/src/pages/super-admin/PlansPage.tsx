import { Edit2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "../../components/feedback/Modal";
import { TextInput } from "../../components/forms/FormControls";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { plansService } from "../../services/plansService";
import type { SubscriptionPlan, SubscriptionPlanStatus } from "../../types";

const emptyForm = { name: "", code: "", description: "", priceMonthly: 0, priceYearly: 0, maxUsers: 1, maxBranches: 1, maxProducts: 100, maxInvoicesPerMonth: 1000 };

export function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setPlans(await plansService.getPlans());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الخطط");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    const payload = {
      ...form,
      priceMonthly: Number(form.priceMonthly),
      priceYearly: Number(form.priceYearly) || null,
      maxUsers: Number(form.maxUsers),
      maxBranches: Number(form.maxBranches),
      maxProducts: Number(form.maxProducts),
      maxInvoicesPerMonth: Number(form.maxInvoicesPerMonth) || null,
      features: {},
      status: "ACTIVE" as SubscriptionPlanStatus,
    };
    if (editing) await plansService.updatePlan(editing.id, payload);
    else await plansService.createPlan(payload);
    setEditing(null);
    setOpen(false);
    setForm(emptyForm);
    await load();
  };

  return (
    <div>
      <PageHeader title="خطط الاشتراك" description="إدارة الباقات والأسعار وحدود الاستخدام." />
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      <div className="mb-6 flex justify-end"><AppButton icon={Plus} onClick={() => setOpen(true)}>خطة جديدة</AppButton></div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <AppCard key={plan.id}>
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="font-bold">{plan.name}</h2><p className="text-sm text-muted-foreground">{plan.code}</p></div>
              <StatusBadge label={plan.status === "ACTIVE" ? "نشطة" : "غير نشطة"} tone={plan.status === "ACTIVE" ? "success" : "muted"} />
            </div>
            <p className="mt-3 text-2xl font-bold">{plan.priceMonthly.toLocaleString("ar-EG")} ج</p>
            <p className="text-sm text-muted-foreground">{plan.description ?? "لا توجد ملاحظات"}</p>
            <div className="mt-4 space-y-2 text-sm">
              <p>مستخدمون: {plan.maxUsers}</p>
              <p>فروع: {plan.maxBranches}</p>
              <p>منتجات: {plan.maxProducts}</p>
              <p>فواتير شهريًا: {plan.maxInvoicesPerMonth ?? "غير محدود"}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <AppButton variant="outline" icon={Edit2} onClick={() => { setEditing(plan); setForm({ name: plan.name, code: plan.code, description: plan.description ?? "", priceMonthly: plan.priceMonthly, priceYearly: plan.priceYearly ?? 0, maxUsers: plan.maxUsers, maxBranches: plan.maxBranches, maxProducts: plan.maxProducts, maxInvoicesPerMonth: plan.maxInvoicesPerMonth ?? 0 }); setOpen(true); }}>تعديل</AppButton>
              <AppButton variant="ghost" onClick={() => void plansService.updatePlanStatus(plan.id, plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE").then(load)}>{plan.status === "ACTIVE" ? "تعطيل" : "تفعيل"}</AppButton>
            </div>
          </AppCard>
        ))}
      </div>

      <Modal open={open} title={editing ? "تعديل خطة" : "خطة جديدة"} onClose={() => setOpen(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="الاسم" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <TextInput label="الكود" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
          <TextInput label="الوصف" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          <TextInput label="السعر الشهري" type="number" value={form.priceMonthly} onChange={(event) => setForm((current) => ({ ...current, priceMonthly: Number(event.target.value) }))} />
          <TextInput label="السعر السنوي" type="number" value={form.priceYearly} onChange={(event) => setForm((current) => ({ ...current, priceYearly: Number(event.target.value) }))} />
          <TextInput label="عدد المستخدمين" type="number" value={form.maxUsers} onChange={(event) => setForm((current) => ({ ...current, maxUsers: Number(event.target.value) }))} />
          <TextInput label="عدد الفروع" type="number" value={form.maxBranches} onChange={(event) => setForm((current) => ({ ...current, maxBranches: Number(event.target.value) }))} />
          <TextInput label="عدد المنتجات" type="number" value={form.maxProducts} onChange={(event) => setForm((current) => ({ ...current, maxProducts: Number(event.target.value) }))} />
          <TextInput label="حد الفواتير الشهري" type="number" value={form.maxInvoicesPerMonth} onChange={(event) => setForm((current) => ({ ...current, maxInvoicesPerMonth: Number(event.target.value) }))} />
        </div>
        <div className="mt-4 flex gap-2"><AppButton onClick={save}>حفظ</AppButton><AppButton variant="outline" onClick={() => setOpen(false)}>إلغاء</AppButton></div>
      </Modal>
    </div>
  );
}
