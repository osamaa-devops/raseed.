import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { TextInput } from "../../components/forms/FormControls";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { closingService } from "../../services/closingService";
import type { ClosingSummary, DailyClosing } from "../../types";

export function EndOfDayClosingPage() {
  const { auth, hasPermission } = useAuth();
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? "";
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<ClosingSummary | null>(null);
  const [history, setHistory] = useState<DailyClosing[]>([]);
  const [actualCash, setActualCash] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canView = hasPermission("closing.view");
  const canCreate = hasPermission("closing.create");

  const load = async () => {
    if (!canView || !branchId) return;
    setLoading(true);
    setError(null);
    try {
      const [nextSummary, nextHistory] = await Promise.all([
        closingService.getClosingSummary({ branchId, date }),
        closingService.getClosingHistory({ branchId, limit: 10 }),
      ]);
      setSummary(nextSummary);
      setHistory(nextHistory.items);
      setActualCash(nextSummary.expectedCash);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل إغلاق اليوم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [branchId, date, canView]);

  const closeDay = async () => {
    if (!summary) return;
    setMessage(null);
    setError(null);
    try {
      const closing = await closingService.closeDay({ branchId, date, actualCash: Number(actualCash), notes });
      setMessage(`تم إغلاق اليوم بفارق ${closing.difference} ج`);
      await load();
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "تعذر إغلاق اليوم");
    }
  };

  if (!canView) return <PageHeader title="إغلاق اليوم" description="ليس لديك صلاحية عرض إغلاق اليوم." />;
  if (loading) return <AppCard>جار تحميل ملخص الإغلاق...</AppCard>;
  if (!summary) return <AppCard>لا توجد بيانات إغلاق متاحة.</AppCard>;

  const difference = Number(actualCash) - summary.expectedCash;
  const hasOpenShifts = summary.shifts.some((shift) => shift.status === "OPEN");

  return (
    <div>
      <PageHeader title="إغلاق اليوم" description="مراجعة المبيعات والمصاريف والنقدية قبل حفظ لقطة نهاية اليوم." />
      <AppCard>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <TextInput label="التاريخ" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <TextInput label="النقدية الفعلية" type="number" value={actualCash} onChange={(event) => setActualCash(Number(event.target.value))} />
          <AppButton className="self-end" icon={CheckCircle} disabled={!canCreate || hasOpenShifts} onClick={closeDay}>إغلاق اليوم</AppButton>
        </div>
        <TextInput className="mt-3" label="ملاحظات" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </AppCard>

      {hasOpenShifts && <p className="mt-4 rounded-lg bg-warning/10 p-3 text-sm font-semibold text-warning">لا يمكن إغلاق اليوم قبل إغلاق كل شيفتات الكاشير المفتوحة.</p>}
      {message && <p className="mt-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{message}</p>}
      {error && <p className="mt-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="إجمالي المبيعات" value={summary.totalSales} />
        <Metric title="المرتجعات" value={summary.totalReturns} />
        <Metric title="المصاريف" value={summary.totalExpenses} />
        <Metric title="الصافي" value={summary.netTotal} />
        <Metric title="نقدي" value={summary.cashPayments} />
        <Metric title="بطاقة" value={summary.cardPayments} />
        <Metric title="محفظة" value={summary.walletPayments} />
        <Metric title="فرق النقدية" value={difference} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AppCard>
          <h2 className="mb-4 font-bold">ملخص الكاشيرين</h2>
          <div className="space-y-3">
            {summary.cashierSummaries.map((cashier) => (
              <div key={cashier.cashierId} className="flex justify-between rounded-lg bg-muted p-3">
                <span>{cashier.cashierName}</span>
                <span>{cashier.invoicesCount} فاتورة / {cashier.totalSales} ج</span>
              </div>
            ))}
            {summary.cashierSummaries.length === 0 && <p className="text-sm text-muted-foreground">لا يوجد نشاط كاشير لهذا اليوم.</p>}
          </div>
        </AppCard>
        <AppCard>
          <h2 className="mb-4 font-bold">الشيفتات</h2>
          <div className="space-y-3">
            {summary.shifts.map((shift) => (
              <div key={shift.id} className="rounded-lg border border-border p-3">
                <div className="flex justify-between"><span>{shift.cashier?.name ?? "كاشير"}</span><span>{shift.status === "OPEN" ? "مفتوح" : "مغلق"}</span></div>
                <p className="mt-1 text-xs text-muted-foreground">افتتاحية {shift.openingCash} ج</p>
              </div>
            ))}
          </div>
        </AppCard>
      </div>

      <AppCard className="mt-6">
        <h2 className="mb-4 font-bold">سجل الإغلاقات</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground"><tr><th className="px-3 py-2 text-right">التاريخ</th><th className="px-3 py-2 text-right">الصافي</th><th className="px-3 py-2 text-right">المتوقع</th><th className="px-3 py-2 text-right">الفعلي</th><th className="px-3 py-2 text-right">الفرق</th></tr></thead>
            <tbody>{history.map((closing) => <tr key={closing.id} className="border-t border-border"><td className="px-3 py-2">{new Date(closing.date).toLocaleDateString("ar-EG")}</td><td className="px-3 py-2">{closing.netTotal} ج</td><td className="px-3 py-2">{closing.expectedCash} ج</td><td className="px-3 py-2">{closing.actualCash} ج</td><td className="px-3 py-2">{closing.difference} ج</td></tr>)}</tbody>
          </table>
        </div>
        {history.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا يوجد سجل إغلاق بعد.</p>}
      </AppCard>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return <AppCard><p className="text-sm text-muted-foreground">{title}</p><h3 className="mt-2 text-2xl font-bold">{value} ج</h3></AppCard>;
}
