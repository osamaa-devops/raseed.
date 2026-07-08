import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock3, Search, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "../../components/tables/DataTable";
import { Modal } from "../../components/feedback/Modal";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { demoRequestsService } from "../../services/demoRequestsService";
import { plansService } from "../../services/plansService";
import { superAdminService } from "../../services/superAdminService";
import type { BillingCycle, DemoRequest, DemoRequestStatus, SubscriptionPlan } from "../../types";
import { SelectInput, TextInput } from "../../components/forms/FormControls";

const statusLabels: Record<DemoRequestStatus, string> = {
  PENDING: "جديد",
  CONTACTED: "تم التواصل",
  CONVERTED: "تحول لعميل",
  REJECTED: "مرفوض",
};

export function SupportTicketsPage() {
  const [items, setItems] = useState<DemoRequest[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [converting, setConverting] = useState<DemoRequest | null>(null);
  const [convertForm, setConvertForm] = useState({
    planId: "",
    billingCycle: "TRIAL" as BillingCycle,
    trialDays: 14,
    ownerUserName: "",
    ownerUserEmail: "",
    ownerUserPhone: "",
    ownerPassword: "",
    cashierUserName: "كاشير",
    cashierUserEmail: "",
    cashierUserPhone: "",
    cashierPassword: "",
    mainBranchName: "الفرع الرئيسي",
    mainBranchAddress: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: "", status: "" as DemoRequestStatus | "" });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await demoRequestsService.list({ search: filters.search, status: filters.status, limit: 100 });
      setItems(response.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void plansService.getPlans().then((loadedPlans) => {
      setPlans(loadedPlans);
      setConvertForm((current) => ({ ...current, planId: current.planId || loadedPlans[0]?.id || "" }));
    }).catch(() => undefined);
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.status === "PENDING").length,
      contacted: items.filter((item) => item.status === "CONTACTED").length,
      converted: items.filter((item) => item.status === "CONVERTED").length,
    };
  }, [items]);

  const updateStatus = async (id: string, status: DemoRequestStatus) => {
    await demoRequestsService.update(id, { status });
    await load();
  };

  const openConvert = (request: DemoRequest) => {
    setConverting(request);
    setConvertForm((current) => ({
      ...current,
      planId: current.planId || plans[0]?.id || "",
      ownerUserName: request.ownerName,
      ownerUserEmail: request.email ?? "",
      ownerUserPhone: request.phone,
      ownerPassword: "",
      cashierUserName: "كاشير",
      cashierUserEmail: "",
      cashierUserPhone: "",
      cashierPassword: "",
      mainBranchName: "الفرع الرئيسي",
      mainBranchAddress: "",
    }));
  };

  const convertToStore = async () => {
    if (!converting) return;
    setError(null);
    try {
      await superAdminService.createStore({
        name: converting.storeName,
        ownerName: converting.ownerName,
        phone: converting.phone,
        email: converting.email || undefined,
        planId: convertForm.planId,
        billingCycle: convertForm.billingCycle,
        trialDays: convertForm.billingCycle === "TRIAL" ? Number(convertForm.trialDays) || 14 : undefined,
        ownerUserName: convertForm.ownerUserName,
        ownerUserEmail: convertForm.ownerUserEmail || undefined,
        ownerUserPhone: convertForm.ownerUserPhone,
        ownerPassword: convertForm.ownerPassword,
        cashierUserName: convertForm.cashierUserName,
        cashierUserEmail: convertForm.cashierUserEmail || undefined,
        cashierUserPhone: convertForm.cashierUserPhone,
        cashierPassword: convertForm.cashierPassword,
        mainBranchName: convertForm.mainBranchName,
        mainBranchAddress: convertForm.mainBranchAddress || undefined,
      });
      await demoRequestsService.update(converting.id, { status: "CONVERTED" });
      setConverting(null);
      await load();
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : "تعذر إنشاء المحل من الطلب");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="طلبات التواصل"
        description="كل طلب من عميل جديد يظهر هنا لتتم متابعته من لوحة المنصة."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="إجمالي الطلبات" value={stats.total} icon={Sparkles} />
        <StatCard title="طلبات جديدة" value={stats.pending} icon={Clock3} />
        <StatCard title="تم التواصل" value={stats.contacted} icon={CheckCircle2} />
        <StatCard title="تحولت لعملاء" value={stats.converted} icon={ShieldAlert} />
      </div>

      <AppCard>
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <TextInput
            label="بحث"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="اسم المحل أو المالك أو الهاتف"
          />
          <SelectInput
            label="الحالة"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as DemoRequestStatus | "" }))}
          >
            <option value="">الكل</option>
            <option value="PENDING">جديد</option>
            <option value="CONTACTED">تم التواصل</option>
            <option value="CONVERTED">تحول لعميل</option>
            <option value="REJECTED">مرفوض</option>
          </SelectInput>
          <div className="flex items-end">
            <AppButton icon={Search} onClick={load}>تحديث</AppButton>
          </div>
        </div>
      </AppCard>

      {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}

      {loading ? (
        <AppCard>جار تحميل الطلبات...</AppCard>
      ) : (
        <DataTable
          columns={["المحل", "المالك", "الهاتف", "النشاط", "الحالة", "الملاحظات", "الإجراءات"]}
          rows={items}
          renderRow={(request) => (
            <tr key={request.id} className="border-t border-border">
              <td className="px-4 py-3 font-semibold">{request.storeName}</td>
              <td className="px-4 py-3">{request.ownerName}</td>
              <td className="px-4 py-3">{request.phone}</td>
              <td className="px-4 py-3">{request.businessType}</td>
              <td className="px-4 py-3">
                <StatusBadge label={statusLabels[request.status]} tone={requestTone(request.status)} />
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{request.notes ?? "-"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <AppButton variant="outline" onClick={() => void updateStatus(request.id, "CONTACTED")}>تم التواصل</AppButton>
                  <AppButton variant="secondary" onClick={() => openConvert(request)}>إنشاء محل</AppButton>
                  <AppButton variant="ghost" onClick={() => void updateStatus(request.id, "REJECTED")}>رفض</AppButton>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <Modal open={Boolean(converting)} title="إنشاء محل من طلب التواصل" onClose={() => setConverting(null)}>
        {converting && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-bold">{converting.storeName}</p>
              <p className="text-muted-foreground">{converting.ownerName} - {converting.phone}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <SelectInput label="الباقة" value={convertForm.planId} onChange={(event) => setConvertForm((current) => ({ ...current, planId: event.target.value }))}>
                {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </SelectInput>
              <SelectInput label="الدورة" value={convertForm.billingCycle} onChange={(event) => setConvertForm((current) => ({ ...current, billingCycle: event.target.value as BillingCycle }))}>
                <option value="TRIAL">تجريبي</option>
                <option value="MONTHLY">شهري</option>
                <option value="YEARLY">سنوي</option>
              </SelectInput>
              {convertForm.billingCycle === "TRIAL" && <TextInput label="أيام التجربة" type="number" value={convertForm.trialDays} onChange={(event) => setConvertForm((current) => ({ ...current, trialDays: Number(event.target.value) }))} />}
              <TextInput label="اسم مستخدم المالك" value={convertForm.ownerUserName} onChange={(event) => setConvertForm((current) => ({ ...current, ownerUserName: event.target.value }))} />
              <TextInput label="بريد المالك" value={convertForm.ownerUserEmail} onChange={(event) => setConvertForm((current) => ({ ...current, ownerUserEmail: event.target.value }))} />
              <TextInput label="هاتف المالك" value={convertForm.ownerUserPhone} onChange={(event) => setConvertForm((current) => ({ ...current, ownerUserPhone: event.target.value }))} />
              <TextInput label="كلمة مرور المالك" type="password" value={convertForm.ownerPassword} onChange={(event) => setConvertForm((current) => ({ ...current, ownerPassword: event.target.value }))} />
              <TextInput label="اسم الكاشير" value={convertForm.cashierUserName} onChange={(event) => setConvertForm((current) => ({ ...current, cashierUserName: event.target.value }))} />
              <TextInput label="بريد الكاشير" value={convertForm.cashierUserEmail} onChange={(event) => setConvertForm((current) => ({ ...current, cashierUserEmail: event.target.value }))} />
              <TextInput label="هاتف الكاشير" value={convertForm.cashierUserPhone} onChange={(event) => setConvertForm((current) => ({ ...current, cashierUserPhone: event.target.value }))} />
              <TextInput label="كلمة مرور الكاشير" type="password" value={convertForm.cashierPassword} onChange={(event) => setConvertForm((current) => ({ ...current, cashierPassword: event.target.value }))} />
              <TextInput label="اسم الفرع الرئيسي" value={convertForm.mainBranchName} onChange={(event) => setConvertForm((current) => ({ ...current, mainBranchName: event.target.value }))} />
              <TextInput label="عنوان الفرع" value={convertForm.mainBranchAddress} onChange={(event) => setConvertForm((current) => ({ ...current, mainBranchAddress: event.target.value }))} />
            </div>
            <div className="flex gap-2">
              <AppButton onClick={convertToStore} disabled={!convertForm.planId || !convertForm.ownerUserName.trim() || !convertForm.ownerUserPhone.trim() || !convertForm.ownerPassword.trim() || !convertForm.cashierUserName.trim() || !convertForm.cashierUserPhone.trim() || !convertForm.cashierPassword.trim()}>
                إنشاء المحل والحسابات
              </AppButton>
              <AppButton variant="outline" onClick={() => setConverting(null)}>إلغاء</AppButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: LucideIcon }) {
  return (
    <AppCard>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <span className="rounded-xl bg-primary/10 p-3 text-primary">
          <Icon size={18} />
        </span>
      </div>
    </AppCard>
  );
}

function requestTone(status: DemoRequestStatus) {
  if (status === "PENDING") return "info";
  if (status === "CONTACTED") return "success";
  if (status === "CONVERTED") return "success";
  return "danger";
}
