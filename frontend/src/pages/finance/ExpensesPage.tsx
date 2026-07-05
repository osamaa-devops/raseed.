import { Download, Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { TextInput, SelectInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { expensesService, type ExpensePayload } from "../../services/expensesService";
import { importExportService } from "../../services/importExportService";
import type { Expense, ExpenseCategory } from "../../types";

const categories: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "RENT", label: "إيجار" },
  { value: "SALARIES", label: "مرتبات" },
  { value: "ELECTRICITY", label: "كهرباء" },
  { value: "MAINTENANCE", label: "صيانة" },
  { value: "DELIVERY", label: "توصيل" },
  { value: "SUPPLIES", label: "مستلزمات" },
  { value: "OTHER", label: "أخرى" },
];

const emptyForm = { title: "", category: "OTHER" as ExpenseCategory, amount: 0, expenseDate: new Date().toISOString().slice(0, 10), notes: "" };

export function ExpensesPage() {
  const { auth, hasPermission } = useAuth();
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? "";
  const [items, setItems] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<{ today: number; month: number; topCategory: { category: ExpenseCategory; amount: number } | null } | null>(null);
  const [filters, setFilters] = useState({ search: "", category: "" as ExpenseCategory | "", dateFrom: "", dateTo: "" });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canView = hasPermission("expenses.view");
  const canCreate = hasPermission("expenses.create");
  const canUpdate = hasPermission("expenses.update");
  const canDelete = hasPermission("expenses.delete");
  const canExport = hasPermission("data.export");

  const topLabel = useMemo(() => (summary?.topCategory ? categoryLabel(summary.topCategory.category) : "لا يوجد"), [summary]);

  const load = async () => {
    if (!canView || !branchId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await expensesService.getExpenses({ branchId, ...filters, limit: 50 });
      setItems(response.items);
      setSummary(response.summary);
    } catch (expenseError) {
      setError(expenseError instanceof Error ? expenseError.message : "تعذر تحميل المصروفات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [branchId, canView, filters.category, filters.dateFrom, filters.dateTo]);

  const submit = async () => {
    if (!branchId) return;
    setSaving(true);
    setError(null);
    const payload: ExpensePayload = {
      branchId,
      title: form.title,
      category: form.category,
      amount: Number(form.amount),
      expenseDate: form.expenseDate,
      notes: form.notes || undefined,
    };
    try {
      if (editing) {
        await expensesService.updateExpense(editing.id, payload);
      } else {
        await expensesService.createExpense(payload);
      }
      setForm(emptyForm);
      setEditing(null);
      await load();
    } catch (expenseError) {
      setError(expenseError instanceof Error ? expenseError.message : "تعذر حفظ المصروف");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      expenseDate: expense.expenseDate.slice(0, 10),
      notes: expense.notes ?? "",
    });
  };

  const remove = async (expense: Expense) => {
    if (!confirm(`حذف مصروف "${expense.title}"؟`)) return;
    await expensesService.deleteExpense(expense.id);
    await load();
  };

  if (!canView) return <PageHeader title="المصاريف" description="ليس لديك صلاحية عرض المصروفات." />;

  return (
    <div>
      <PageHeader title="المصاريف" description="تسجيل ومراجعة مصروفات الفرع اليومية والشهرية." actions={canExport ? <AppButton variant="outline" icon={Download} onClick={() => void importExportService.exportExpenses("xlsx", { branchId, dateFrom: filters.dateFrom, dateTo: filters.dateTo, category: filters.category })}>تصدير</AppButton> : null} />
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="مصاريف اليوم" value={summary?.today ?? 0} />
        <SummaryCard title="مصاريف الشهر" value={summary?.month ?? 0} />
        <AppCard><p className="text-sm text-muted-foreground">أكبر بند هذا الشهر</p><h3 className="mt-2 text-lg font-bold">{topLabel}</h3><p className="text-sm text-muted-foreground">{summary?.topCategory?.amount ?? 0} ج</p></AppCard>
      </div>

      <AppCard className="mt-6">
        <div className="grid gap-3 md:grid-cols-4">
          <TextInput label="بحث" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} onBlur={load} />
          <SelectInput label="التصنيف" value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as ExpenseCategory | "" }))}>
            <option value="">كل التصنيفات</option>
            {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </SelectInput>
          <TextInput label="من" type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
          <TextInput label="إلى" type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
        </div>
      </AppCard>

      {(canCreate || editing) && (
        <AppCard className="mt-6">
          <div className="grid gap-3 md:grid-cols-5">
            <TextInput label="العنوان" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <SelectInput label="التصنيف" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ExpenseCategory }))}>
              {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </SelectInput>
            <TextInput label="المبلغ" type="number" min="0" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
            <TextInput label="التاريخ" type="date" value={form.expenseDate} onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))} />
            <TextInput label="ملاحظات" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
          <div className="mt-4 flex gap-2">
            <AppButton icon={Plus} onClick={submit} disabled={saving || !form.title || Number(form.amount) <= 0}>{editing ? "حفظ التعديل" : "إضافة مصروف"}</AppButton>
            {editing && <AppButton variant="outline" onClick={() => { setEditing(null); setForm(emptyForm); }}>إلغاء</AppButton>}
          </div>
        </AppCard>
      )}

      {error && <p className="mt-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {loading ? <AppCard className="mt-6">جار تحميل المصروفات...</AppCard> : (
        <div className="mt-6">
          <DataTable
            columns={["العنوان", "التصنيف", "المبلغ", "الفرع", "التاريخ", "أضيف بواسطة", "الإجراءات"]}
            rows={items}
            renderRow={(expense) => (
              <tr key={expense.id} className="border-t border-border hover:bg-table-row-hover">
                <td className="px-4 py-3 font-semibold">{expense.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{categoryLabel(expense.category)}</td>
                <td className="px-4 py-3">{expense.amount} ج</td>
                <td className="px-4 py-3 text-muted-foreground">{expense.branch?.name ?? "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(expense.expenseDate).toLocaleDateString("ar-EG")}</td>
                <td className="px-4 py-3 text-muted-foreground">{expense.user?.name ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {canUpdate && <AppButton variant="ghost" icon={Edit2} onClick={() => startEdit(expense)}>تعديل</AppButton>}
                    {canDelete && <AppButton variant="danger" icon={Trash2} onClick={() => void remove(expense)}>حذف</AppButton>}
                  </div>
                </td>
              </tr>
            )}
          />
          {items.length === 0 && <AppCard className="mt-4 text-center text-muted-foreground">لا توجد مصروفات مطابقة.</AppCard>}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return <AppCard><p className="text-sm text-muted-foreground">{title}</p><h3 className="mt-2 text-2xl font-bold">{value} ج</h3></AppCard>;
}

function categoryLabel(category: ExpenseCategory) {
  return categories.find((item) => item.value === category)?.label ?? category;
}
