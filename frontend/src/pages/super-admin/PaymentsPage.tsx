import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { subscriptionPaymentsService } from "../../services/subscriptionPaymentsService";
import { superAdminService } from "../../services/superAdminService";
import type { Subscription, SubscriptionPayment, SubscriptionPaymentMethod, SubscriptionPaymentStatus } from "../../types";

const emptyForm = { storeId: "", subscriptionId: "", amount: 0, method: "MANUAL" as SubscriptionPaymentMethod, status: "PAID" as SubscriptionPaymentStatus, paidAt: "", reference: "", notes: "" };

export function PaymentsPage() {
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filters, setFilters] = useState({ status: "" as SubscriptionPaymentStatus | "", dateFrom: "", dateTo: "" });
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [paymentsResponse, subscriptionsResponse] = await Promise.all([
        subscriptionPaymentsService.getPayments({ ...filters, limit: 50 }),
        superAdminService.getSubscriptions({ limit: 100 }),
      ]);
      setPayments(paymentsResponse.items);
      setSubscriptions(subscriptionsResponse.items);
      setForm((current) => ({ ...current, storeId: current.storeId || subscriptionsResponse.items[0]?.storeId || "", subscriptionId: current.subscriptionId || subscriptionsResponse.items[0]?.id || "" }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل المدفوعات");
    }
  };

  useEffect(() => {
    void load();
  }, [filters.status, filters.dateFrom, filters.dateTo]);

  const create = async () => {
    await subscriptionPaymentsService.createPayment({
      ...form,
      amount: Number(form.amount),
      paidAt: form.paidAt || undefined,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
    });
    setOpen(false);
    setForm(emptyForm);
    await load();
  };

  return (
    <div>
      <PageHeader title="مدفوعات المنصة" description="متابعة دفعات الاشتراك اليدوية وحالتها." />
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      <AppCard className="mb-6">
        <div className="grid gap-3 md:grid-cols-[180px_180px_180px_auto]">
          <SelectInput label="الحالة" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as SubscriptionPaymentStatus | "" }))}>
            <option value="">الكل</option><option value="PAID">مدفوعة</option><option value="PENDING">معلقة</option><option value="FAILED">فاشلة</option><option value="REFUNDED">مستردة</option>
          </SelectInput>
          <TextInput label="من" type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
          <TextInput label="إلى" type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
          <div className="flex items-end justify-end"><AppButton icon={Plus} onClick={() => setOpen(true)}>دفعة جديدة</AppButton></div>
        </div>
      </AppCard>
      <DataTable
        columns={["المتجر", "الخطة", "المبلغ", "الطريقة", "الحالة", "المرجع", "تاريخ الدفع"]}
        rows={payments}
        renderRow={(payment) => (
          <tr key={payment.id} className="border-t border-border hover:bg-table-row-hover">
            <td className="px-4 py-3 font-semibold">{payment.store?.name ?? "-"}</td>
            <td className="px-4 py-3">{payment.subscription?.plan?.name ?? "-"}</td>
            <td className="px-4 py-3">{payment.amount.toLocaleString("ar-EG")} ج</td>
            <td className="px-4 py-3">{payment.method}</td>
            <td className="px-4 py-3"><StatusBadge label={payment.status} tone={payment.status === "PAID" ? "success" : payment.status === "PENDING" ? "warning" : "danger"} /></td>
            <td className="px-4 py-3">{payment.reference ?? "-"}</td>
            <td className="px-4 py-3">{payment.paidAt ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(payment.paidAt)) : "-"}</td>
          </tr>
        )}
      />

      <Modal open={open} title="إضافة دفعة" onClose={() => setOpen(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectInput label="الاشتراك" value={form.subscriptionId} onChange={(event) => { const sub = subscriptions.find((item) => item.id === event.target.value); setForm((current) => ({ ...current, subscriptionId: event.target.value, storeId: sub?.storeId ?? current.storeId })); }}>
            {subscriptions.map((subscription) => <option key={subscription.id} value={subscription.id}>{subscription.store?.name ?? subscription.id} - {subscription.plan?.name ?? "-"}</option>)}
          </SelectInput>
          <TextInput label="المبلغ" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
          <SelectInput label="الطريقة" value={form.method} onChange={(event) => setForm((current) => ({ ...current, method: event.target.value as SubscriptionPaymentMethod }))}>
            <option value="MANUAL">يدوي</option><option value="CASH">نقدي</option><option value="BANK_TRANSFER">تحويل بنكي</option><option value="WALLET">محفظة</option><option value="CARD">بطاقة</option>
          </SelectInput>
          <SelectInput label="الحالة" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SubscriptionPaymentStatus }))}>
            <option value="PAID">مدفوعة</option><option value="PENDING">معلقة</option><option value="FAILED">فاشلة</option><option value="REFUNDED">مستردة</option>
          </SelectInput>
          <TextInput label="تاريخ الدفع" type="date" value={form.paidAt} onChange={(event) => setForm((current) => ({ ...current, paidAt: event.target.value }))} />
          <TextInput label="المرجع" value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} />
          <TextInput label="ملاحظات" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
        </div>
        <div className="mt-4 flex gap-2"><AppButton onClick={create}>حفظ</AppButton><AppButton variant="outline" onClick={() => setOpen(false)}>إلغاء</AppButton></div>
      </Modal>
    </div>
  );
}
