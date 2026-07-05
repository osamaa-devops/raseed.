import { CreditCard, Download, Edit2, Eye, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { customersService } from "../../services/customersService";
import { importExportService } from "../../services/importExportService";
import type { Customer, CustomerDebtTransaction, CustomerStatus, Payment } from "../../types";

const emptyForm = { name: "", phone: "", email: "", address: "", notes: "", creditLimit: 0 };
const emptyDebtForm = { amount: 0, reason: "", notes: "", paymentMethod: "CASH" as Payment["method"], direction: "IN" as "IN" | "OUT" };

export function CustomersDebtsPage() {
  const { auth, hasPermission } = useAuth();
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? undefined;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState({ totalDebt: 0, customersCount: 0 });
  const [filters, setFilters] = useState({ search: "", status: "" as CustomerStatus | "", hasDebt: "" as "true" | "false" | "" });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<CustomerDebtTransaction[]>([]);
  const [debtMode, setDebtMode] = useState<"add" | "pay" | "adjust" | null>(null);
  const [debtForm, setDebtForm] = useState(emptyDebtForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = hasPermission("customers.view");
  const canCreate = hasPermission("customers.create");
  const canUpdate = hasPermission("customers.update");
  const canDelete = hasPermission("customers.delete");
  const canViewDebts = hasPermission("debts.view");
  const canAddDebt = hasPermission("debts.add");
  const canPayDebt = hasPermission("debts.pay");
  const canAdjustDebt = hasPermission("debts.adjust");
  const canExport = hasPermission("data.export");

  const load = async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const response = await customersService.getCustomers({ ...filters, limit: 50 });
      setCustomers(response.items);
      setSummary(response.summary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل العملاء");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filters.status, filters.hasDebt, canView]);

  const saveCustomer = async () => {
    setError(null);
    try {
      const payload = { ...form, creditLimit: Number(form.creditLimit) || undefined };
      if (editing) await customersService.updateCustomer(editing.id, payload);
      else await customersService.createCustomer(payload);
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ العميل");
    }
  };

  const openDetails = async (customer: Customer) => {
    setSelected(customer);
    if (!canViewDebts) return;
    const response = await customersService.getDebtTransactions(customer.id, branchId ? { branchId } : {});
    setTransactions(response.items);
  };

  const submitDebt = async () => {
    if (!selected) return;
    setError(null);
    const common = { branchId, amount: Number(debtForm.amount), notes: debtForm.notes || undefined };
    try {
      if (debtMode === "add") await customersService.addDebt(selected.id, { ...common, reason: debtForm.reason });
      if (debtMode === "pay") await customersService.payDebt(selected.id, { ...common, paymentMethod: debtForm.paymentMethod });
      if (debtMode === "adjust") await customersService.adjustDebt(selected.id, { ...common, direction: debtForm.direction, reason: debtForm.reason });
      const fresh = await customersService.getCustomer(selected.id);
      setSelected(fresh);
      const response = await customersService.getDebtTransactions(selected.id, branchId ? { branchId } : {});
      setTransactions(response.items);
      setDebtMode(null);
      setDebtForm(emptyDebtForm);
      await load();
    } catch (debtError) {
      setError(debtError instanceof Error ? debtError.message : "تعذر تنفيذ عملية الدين");
    }
  };

  const startEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
      address: customer.address ?? "",
      notes: customer.notes ?? "",
      creditLimit: customer.creditLimit ?? 0,
    });
  };

  const remove = async (customer: Customer) => {
    if (!confirm(`حذف العميل "${customer.name}"؟`)) return;
    await customersService.deleteCustomer(customer.id);
    await load();
  };

  if (!canView) return <PageHeader title="العملاء والديون" description="ليس لديك صلاحية عرض العملاء." />;

  return (
    <div>
      <PageHeader title="العملاء والديون" description="إدارة ملفات العملاء وأرصدة الديون والمدفوعات الجزئية." actions={canExport ? <AppButton variant="outline" icon={Download} onClick={() => void importExportService.exportCustomers("xlsx", { status: filters.status })}>تصدير</AppButton> : null} />
      <div className="grid gap-4 md:grid-cols-3">
        <AppCard><p className="text-sm text-muted-foreground">إجمالي العملاء</p><h3 className="mt-2 text-2xl font-bold">{summary.customersCount}</h3></AppCard>
        <AppCard><p className="text-sm text-muted-foreground">إجمالي الديون</p><h3 className="mt-2 text-2xl font-bold">{formatMoney(summary.totalDebt)}</h3></AppCard>
        <AppCard><p className="text-sm text-muted-foreground">عملاء عليهم دين</p><h3 className="mt-2 text-2xl font-bold">{customers.filter((customer) => customer.currentDebt > 0).length}</h3></AppCard>
      </div>

      <AppCard className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <TextInput label="بحث بالاسم أو الهاتف" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} onBlur={load} />
          <SelectInput label="الحالة" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as CustomerStatus | "" }))}>
            <option value="">كل الحالات</option>
            <option value="ACTIVE">نشط</option>
            <option value="INACTIVE">غير نشط</option>
          </SelectInput>
          <SelectInput label="الدين" value={filters.hasDebt} onChange={(event) => setFilters((current) => ({ ...current, hasDebt: event.target.value as "true" | "false" | "" }))}>
            <option value="">الكل</option>
            <option value="true">عليه دين</option>
            <option value="false">بدون دين</option>
          </SelectInput>
          <AppButton className="self-end" variant="outline" onClick={load}>تصفية</AppButton>
        </div>
      </AppCard>

      {(canCreate || editing) && (
        <AppCard className="mt-6">
          <div className="grid gap-3 md:grid-cols-3">
            <TextInput label="الاسم" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <TextInput label="الهاتف" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            <TextInput label="حد الائتمان" type="number" value={form.creditLimit} onChange={(event) => setForm((current) => ({ ...current, creditLimit: Number(event.target.value) }))} />
            <TextInput label="البريد" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            <TextInput label="العنوان" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            <TextInput label="ملاحظات" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
          <div className="mt-4 flex gap-2">
            <AppButton icon={Plus} onClick={saveCustomer} disabled={!form.name || !form.phone}>{editing ? "حفظ التعديل" : "إضافة عميل"}</AppButton>
            {editing && <AppButton variant="outline" onClick={() => { setEditing(null); setForm(emptyForm); }}>إلغاء</AppButton>}
          </div>
        </AppCard>
      )}

      {error && <p className="mt-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {loading ? <AppCard className="mt-6">جار تحميل العملاء...</AppCard> : (
        <div className="mt-6">
          <DataTable
            columns={["الاسم", "الهاتف", "الرصيد المستحق", "حد الائتمان", "نقاط الولاء", "الحالة", "آخر تحديث", "الإجراءات"]}
            rows={customers}
            renderRow={(customer) => (
              <tr key={customer.id} className="border-t border-border hover:bg-table-row-hover">
                <td className="px-4 py-3 font-semibold">{customer.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{customer.phone}</td>
                <td className="px-4 py-3 font-bold">{formatMoney(customer.currentDebt)}</td>
                <td className="px-4 py-3">{customer.creditLimit ? formatMoney(customer.creditLimit) : "-"}</td>
                <td className="px-4 py-3">{customer.loyaltyPoints}</td>
                <td className="px-4 py-3"><StatusBadge label={customer.status === "ACTIVE" ? "نشط" : "غير نشط"} tone={customer.status === "ACTIVE" ? "success" : "warning"} /></td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(customer.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <AppButton variant="outline" icon={Eye} onClick={() => void openDetails(customer)}>عرض</AppButton>
                    {canUpdate && <AppButton variant="ghost" icon={Edit2} onClick={() => startEdit(customer)}>تعديل</AppButton>}
                    {canUpdate && <AppButton variant="ghost" onClick={() => void customersService.updateCustomerStatus(customer.id, customer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE").then(load)}>{customer.status === "ACTIVE" ? "تعطيل" : "تفعيل"}</AppButton>}
                    {canDelete && <AppButton variant="danger" icon={Trash2} onClick={() => void remove(customer)}>حذف</AppButton>}
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      )}

      <Modal open={Boolean(selected)} title="ملف العميل" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <h3 className="text-lg font-bold">{selected.name}</h3>
              <p className="text-muted-foreground">{selected.phone}</p>
              <p className="mt-2 font-bold">الرصيد المستحق: {formatMoney(selected.currentDebt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canAddDebt && <AppButton onClick={() => setDebtMode("add")}>إضافة دين</AppButton>}
              {canPayDebt && <AppButton variant="outline" icon={CreditCard} onClick={() => setDebtMode("pay")}>تحصيل دفعة</AppButton>}
              {canAdjustDebt && <AppButton variant="ghost" onClick={() => setDebtMode("adjust")}>تسوية</AppButton>}
            </div>
            {debtMode && (
              <AppCard>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextInput label="المبلغ" type="number" value={debtForm.amount} onChange={(event) => setDebtForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
                  {debtMode === "pay" ? (
                    <SelectInput label="طريقة الدفع" value={debtForm.paymentMethod} onChange={(event) => setDebtForm((current) => ({ ...current, paymentMethod: event.target.value as Payment["method"] }))}>
                      <option value="CASH">نقدي</option>
                      <option value="CARD">بطاقة</option>
                      <option value="WALLET">محفظة</option>
                    </SelectInput>
                  ) : debtMode === "adjust" ? (
                    <SelectInput label="الاتجاه" value={debtForm.direction} onChange={(event) => setDebtForm((current) => ({ ...current, direction: event.target.value as "IN" | "OUT" }))}>
                      <option value="IN">زيادة الدين</option>
                      <option value="OUT">خفض الدين</option>
                    </SelectInput>
                  ) : null}
                  {debtMode !== "pay" && <TextInput label="السبب" value={debtForm.reason} onChange={(event) => setDebtForm((current) => ({ ...current, reason: event.target.value }))} />}
                  <TextInput label="ملاحظات" value={debtForm.notes} onChange={(event) => setDebtForm((current) => ({ ...current, notes: event.target.value }))} />
                </div>
                <div className="mt-4 flex gap-2"><AppButton onClick={submitDebt}>تنفيذ</AppButton><AppButton variant="outline" onClick={() => setDebtMode(null)}>إلغاء</AppButton></div>
              </AppCard>
            )}
            <div>
              <h3 className="mb-2 font-bold">حركات الدين</h3>
              <div className="max-h-80 overflow-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted text-muted-foreground"><tr><th className="px-2 py-2 text-right">التاريخ</th><th className="px-2 py-2 text-right">النوع</th><th className="px-2 py-2 text-right">المبلغ</th><th className="px-2 py-2 text-right">قبل</th><th className="px-2 py-2 text-right">بعد</th><th className="px-2 py-2 text-right">الدفع</th><th className="px-2 py-2 text-right">السبب</th><th className="px-2 py-2 text-right">الموظف</th></tr></thead>
                  <tbody>{transactions.map((tx) => <tr key={tx.id} className="border-t border-border"><td className="px-2 py-2">{formatDate(tx.createdAt)}</td><td className="px-2 py-2">{debtTypeLabel(tx.type)}</td><td className="px-2 py-2">{formatMoney(tx.amount)}</td><td className="px-2 py-2">{formatMoney(tx.balanceBefore)}</td><td className="px-2 py-2">{formatMoney(tx.balanceAfter)}</td><td className="px-2 py-2">{tx.paymentMethod ? paymentLabel(tx.paymentMethod) : "-"}</td><td className="px-2 py-2">{tx.reason ?? "-"}</td><td className="px-2 py-2">{tx.user?.name ?? "-"}</td></tr>)}</tbody>
                </table>
                {transactions.length === 0 && <p className="p-4 text-center text-muted-foreground">لا توجد حركات دين.</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}

function paymentLabel(method: Payment["method"]) {
  return method === "CASH" ? "نقدي" : method === "CARD" ? "بطاقة" : "محفظة";
}

function debtTypeLabel(type: CustomerDebtTransaction["type"]) {
  const labels = { DEBT_ADDED: "إضافة دين", PAYMENT_RECEIVED: "تحصيل", ADJUSTMENT_IN: "تسوية زيادة", ADJUSTMENT_OUT: "تسوية خفض" };
  return labels[type];
}
