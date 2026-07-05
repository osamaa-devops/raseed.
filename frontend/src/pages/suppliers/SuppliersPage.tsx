import { CreditCard, Edit2, Eye, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { suppliersService } from "../../services/suppliersService";
import type { Supplier, SupplierPaymentMethod, SupplierStatus, SupplierTransaction } from "../../types";

const emptyForm = { name: "", phone: "", email: "", address: "", contactPerson: "", notes: "" };
const emptyBalanceForm = { amount: 0, paymentMethod: "CASH" as SupplierPaymentMethod, direction: "IN" as "IN" | "OUT", reason: "", notes: "" };

export function SuppliersPage() {
  const { auth, hasPermission } = useAuth();
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? undefined;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [summary, setSummary] = useState({ totalBalance: 0, suppliersCount: 0 });
  const [filters, setFilters] = useState({ search: "", status: "" as SupplierStatus | "", hasBalance: "" as "true" | "false" | "" });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);
  const [balanceMode, setBalanceMode] = useState<"pay" | "adjust" | null>(null);
  const [balanceForm, setBalanceForm] = useState(emptyBalanceForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = hasPermission("suppliers.view");
  const canCreate = hasPermission("suppliers.create");
  const canUpdate = hasPermission("suppliers.update");
  const canDelete = hasPermission("suppliers.delete");
  const canPay = hasPermission("suppliers.pay");
  const canAdjust = hasPermission("suppliers.adjust");

  const load = async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const response = await suppliersService.getSuppliers({ ...filters, limit: 50 });
      setSuppliers(response.items);
      setSummary(response.summary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الموردين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filters.status, filters.hasBalance, canView]);

  const saveSupplier = async () => {
    setError(null);
    try {
      const payload = {
        ...form,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        contactPerson: form.contactPerson || undefined,
        notes: form.notes || undefined,
      };
      if (editing) await suppliersService.updateSupplier(editing.id, payload);
      else await suppliersService.createSupplier(payload);
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ المورد");
    }
  };

  const openDetails = async (supplier: Supplier) => {
    setSelected(supplier);
    const response = await suppliersService.getSupplierTransactions(supplier.id, branchId ? { branchId } : {});
    setTransactions(response.items);
  };

  const submitBalance = async () => {
    if (!selected) return;
    setError(null);
    const common = { branchId, amount: Number(balanceForm.amount), notes: balanceForm.notes || undefined };
    try {
      if (balanceMode === "pay") await suppliersService.makeSupplierPayment(selected.id, { ...common, paymentMethod: balanceForm.paymentMethod });
      if (balanceMode === "adjust") await suppliersService.adjustSupplierBalance(selected.id, { ...common, direction: balanceForm.direction, reason: balanceForm.reason });
      const fresh = await suppliersService.getSupplier(selected.id);
      setSelected(fresh);
      const response = await suppliersService.getSupplierTransactions(selected.id, branchId ? { branchId } : {});
      setTransactions(response.items);
      setBalanceMode(null);
      setBalanceForm(emptyBalanceForm);
      await load();
    } catch (balanceError) {
      setError(balanceError instanceof Error ? balanceError.message : "تعذر تنفيذ حركة المورد");
    }
  };

  const startEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      contactPerson: supplier.contactPerson ?? "",
      notes: supplier.notes ?? "",
    });
  };

  const remove = async (supplier: Supplier) => {
    if (!confirm(`حذف المورد "${supplier.name}"؟`)) return;
    await suppliersService.deleteSupplier(supplier.id);
    await load();
  };

  if (!canView) return <PageHeader title="الموردين" description="ليس لديك صلاحية عرض الموردين." />;

  return (
    <div>
      <PageHeader title="الموردين" description="إدارة ملفات الموردين والأرصدة والمدفوعات." />
      <div className="grid gap-4 md:grid-cols-3">
        <AppCard><p className="text-sm text-muted-foreground">إجمالي الموردين</p><h3 className="mt-2 text-2xl font-bold">{summary.suppliersCount}</h3></AppCard>
        <AppCard><p className="text-sm text-muted-foreground">إجمالي الرصيد المستحق</p><h3 className="mt-2 text-2xl font-bold">{formatMoney(summary.totalBalance)}</h3></AppCard>
        <AppCard><p className="text-sm text-muted-foreground">موردون لهم رصيد</p><h3 className="mt-2 text-2xl font-bold">{suppliers.filter((supplier) => supplier.currentBalance > 0).length}</h3></AppCard>
      </div>

      <AppCard className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <TextInput label="بحث بالاسم أو الهاتف" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} onBlur={load} />
          <SelectInput label="الحالة" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as SupplierStatus | "" }))}>
            <option value="">كل الحالات</option>
            <option value="ACTIVE">نشط</option>
            <option value="INACTIVE">غير نشط</option>
          </SelectInput>
          <SelectInput label="الرصيد" value={filters.hasBalance} onChange={(event) => setFilters((current) => ({ ...current, hasBalance: event.target.value as "true" | "false" | "" }))}>
            <option value="">الكل</option>
            <option value="true">له رصيد</option>
            <option value="false">بدون رصيد</option>
          </SelectInput>
          <AppButton className="self-end" variant="outline" onClick={load}>تصفية</AppButton>
        </div>
      </AppCard>

      {(canCreate || editing) && (
        <AppCard className="mt-6">
          <div className="grid gap-3 md:grid-cols-3">
            <TextInput label="اسم المورد" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <TextInput label="الهاتف" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            <TextInput label="الشخص المسؤول" value={form.contactPerson} onChange={(event) => setForm((current) => ({ ...current, contactPerson: event.target.value }))} />
            <TextInput label="البريد" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            <TextInput label="العنوان" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            <TextInput label="ملاحظات" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
          <div className="mt-4 flex gap-2">
            <AppButton icon={Plus} onClick={saveSupplier} disabled={!form.name}>{editing ? "حفظ التعديل" : "إضافة مورد"}</AppButton>
            {editing && <AppButton variant="outline" onClick={() => { setEditing(null); setForm(emptyForm); }}>إلغاء</AppButton>}
          </div>
        </AppCard>
      )}

      {error && <p className="mt-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {loading ? <AppCard className="mt-6">جار تحميل الموردين...</AppCard> : (
        <div className="mt-6">
          <DataTable
            columns={["اسم المورد", "الهاتف", "الشخص المسؤول", "الرصيد المستحق", "الحالة", "آخر تحديث", "الإجراءات"]}
            rows={suppliers}
            renderRow={(supplier) => (
              <tr key={supplier.id} className="border-t border-border hover:bg-table-row-hover">
                <td className="px-4 py-3 font-semibold">{supplier.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{supplier.phone ?? "-"}</td>
                <td className="px-4 py-3">{supplier.contactPerson ?? "-"}</td>
                <td className="px-4 py-3 font-bold">{formatMoney(supplier.currentBalance)}</td>
                <td className="px-4 py-3"><StatusBadge label={supplier.status === "ACTIVE" ? "نشط" : "غير نشط"} tone={supplier.status === "ACTIVE" ? "success" : "warning"} /></td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(supplier.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <AppButton variant="outline" icon={Eye} onClick={() => void openDetails(supplier)}>عرض</AppButton>
                    {canUpdate && <AppButton variant="ghost" icon={Edit2} onClick={() => startEdit(supplier)}>تعديل</AppButton>}
                    {canUpdate && <AppButton variant="ghost" onClick={() => void suppliersService.updateSupplierStatus(supplier.id, supplier.status === "ACTIVE" ? "INACTIVE" : "ACTIVE").then(load)}>{supplier.status === "ACTIVE" ? "تعطيل" : "تفعيل"}</AppButton>}
                    {canDelete && <AppButton variant="danger" icon={Trash2} onClick={() => void remove(supplier)}>حذف</AppButton>}
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      )}

      <Modal open={Boolean(selected)} title="ملف المورد" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <h3 className="text-lg font-bold">{selected.name}</h3>
              <p className="text-muted-foreground">{selected.phone ?? "-"} {selected.contactPerson ? `- ${selected.contactPerson}` : ""}</p>
              <p className="mt-2 font-bold">الرصيد المستحق: {formatMoney(selected.currentBalance)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canPay && <AppButton variant="outline" icon={CreditCard} onClick={() => setBalanceMode("pay")}>تسجيل دفعة</AppButton>}
              {canAdjust && <AppButton variant="ghost" onClick={() => setBalanceMode("adjust")}>تسوية الرصيد</AppButton>}
            </div>
            {balanceMode && (
              <AppCard>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextInput label="المبلغ" type="number" value={balanceForm.amount} onChange={(event) => setBalanceForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
                  {balanceMode === "pay" ? (
                    <SelectInput label="طريقة الدفع" value={balanceForm.paymentMethod} onChange={(event) => setBalanceForm((current) => ({ ...current, paymentMethod: event.target.value as SupplierPaymentMethod }))}>
                      <option value="CASH">نقدي</option><option value="CARD">بطاقة</option><option value="WALLET">محفظة</option><option value="BANK_TRANSFER">تحويل بنكي</option>
                    </SelectInput>
                  ) : (
                    <SelectInput label="الاتجاه" value={balanceForm.direction} onChange={(event) => setBalanceForm((current) => ({ ...current, direction: event.target.value as "IN" | "OUT" }))}>
                      <option value="IN">زيادة الرصيد</option><option value="OUT">خفض الرصيد</option>
                    </SelectInput>
                  )}
                  {balanceMode === "adjust" && <TextInput label="السبب" value={balanceForm.reason} onChange={(event) => setBalanceForm((current) => ({ ...current, reason: event.target.value }))} />}
                  <TextInput label="ملاحظات" value={balanceForm.notes} onChange={(event) => setBalanceForm((current) => ({ ...current, notes: event.target.value }))} />
                </div>
                <div className="mt-4 flex gap-2"><AppButton onClick={submitBalance}>تنفيذ</AppButton><AppButton variant="outline" onClick={() => setBalanceMode(null)}>إلغاء</AppButton></div>
              </AppCard>
            )}
            <div>
              <h3 className="mb-2 font-bold">حركات المورد</h3>
              <div className="max-h-80 overflow-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted text-muted-foreground"><tr><th className="px-2 py-2 text-right">التاريخ</th><th className="px-2 py-2 text-right">النوع</th><th className="px-2 py-2 text-right">المبلغ</th><th className="px-2 py-2 text-right">قبل</th><th className="px-2 py-2 text-right">بعد</th><th className="px-2 py-2 text-right">الدفع</th><th className="px-2 py-2 text-right">السبب</th><th className="px-2 py-2 text-right">الموظف</th></tr></thead>
                  <tbody>{transactions.map((tx) => <tr key={tx.id} className="border-t border-border"><td className="px-2 py-2">{formatDate(tx.createdAt)}</td><td className="px-2 py-2">{transactionTypeLabel(tx.type)}</td><td className="px-2 py-2">{formatMoney(tx.amount)}</td><td className="px-2 py-2">{formatMoney(tx.balanceBefore)}</td><td className="px-2 py-2">{formatMoney(tx.balanceAfter)}</td><td className="px-2 py-2">{tx.paymentMethod ? paymentLabel(tx.paymentMethod) : "-"}</td><td className="px-2 py-2">{tx.reason ?? "-"}</td><td className="px-2 py-2">{tx.user?.name ?? "-"}</td></tr>)}</tbody>
                </table>
                {transactions.length === 0 && <p className="p-4 text-center text-muted-foreground">لا توجد حركات مورد.</p>}
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

function paymentLabel(method: SupplierPaymentMethod) {
  return method === "CASH" ? "نقدي" : method === "CARD" ? "بطاقة" : method === "WALLET" ? "محفظة" : "تحويل بنكي";
}

function transactionTypeLabel(type: SupplierTransaction["type"]) {
  const labels = { BALANCE_ADDED: "رصيد افتتاحي", PAYMENT_MADE: "دفعة", ADJUSTMENT_IN: "تسوية زيادة", ADJUSTMENT_OUT: "تسوية خفض", PURCHASE_ORDER_RECEIVED: "استلام أمر شراء" };
  return labels[type];
}
