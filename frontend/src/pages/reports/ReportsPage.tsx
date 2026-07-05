import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { TextInput } from "../../components/forms/FormControls";
import { PageHeader } from "../../components/ui/PageHeader";
import { reportsService } from "../../services/reportsService";
import { importExportService } from "../../services/importExportService";

type ReportState = {
  daily: Array<{ date?: string; totalSales: number; invoicesCount: number }>;
  monthly: Array<{ month?: string; totalSales: number; invoicesCount: number }>;
  profit: { revenue: number; estimatedCost: number; grossProfitEstimate: number } | null;
  methods: Array<{ method: string; total: number; count: number }>;
  cashiers: Array<{ cashierId: string; cashierName: string; invoicesCount: number; totalSales: number }>;
  best: Array<{ productId: string; productName: string; quantity: number; sales: number }>;
  worst: Array<{ productId: string; productName: string; quantity: number; sales: number }>;
  inventory: { totalValue: number; rows: Array<{ productId: string; productName: string; quantity: number; value: number }> } | null;
  expenses: { total: number; rows: Array<{ category: string; total: number; count: number }> } | null;
};

export function ReportsPage() {
  const { auth, hasPermission } = useAuth();
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? undefined;
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<ReportState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!hasPermission("reports.view")) return;
    setLoading(true);
    setError(null);
    const params = { branchId, dateFrom, dateTo };
    try {
      const [daily, monthly, profit, methods, cashiers, best, worst, inventory, expenses] = await Promise.all([
        reportsService.getDailySales(params),
        reportsService.getMonthlySales(params),
        reportsService.getProfit(params),
        reportsService.getPaymentMethods(params),
        reportsService.getCashierPerformance(params),
        reportsService.getBestSellingProducts(params),
        reportsService.getWorstSellingProducts(params),
        reportsService.getInventoryValue(params),
        reportsService.getExpensesReport(params),
      ]);
      setData({ daily: daily.rows, monthly: monthly.rows, profit, methods: methods.rows, cashiers: cashiers.rows, best: best.rows, worst: worst.rows, inventory, expenses });
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : "تعذر تحميل التقارير");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [branchId, dateFrom, dateTo, hasPermission]);

  if (!hasPermission("reports.view")) return <PageHeader title="التقارير" description="ليس لديك صلاحية عرض التقارير." />;

  return (
    <div>
      <PageHeader title="التقارير" description="تقارير تشغيل حقيقية من الفواتير، المدفوعات، المخزون، والمصروفات." />
      <AppCard className="mb-4 bg-muted/35">
        <p className="text-sm font-semibold text-foreground">أفضل استخدام</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">ابدأ دائمًا بتحديد الفترة الزمنية أولاً، ثم راجع المبيعات والربح وطرق الدفع قبل التصدير أو مشاركة الأرقام مع صاحب المتجر.</p>
      </AppCard>
      <AppCard>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <TextInput label="من" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <TextInput label="إلى" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          <AppButton className="self-end" variant="outline" icon={Download} disabled={!hasPermission("reports.export")} onClick={() => void importExportService.exportDailySalesReport("xlsx", { branchId, dateFrom, dateTo })}>تصدير المبيعات</AppButton>
        </div>
      </AppCard>
      {loading && <AppCard className="mt-6">جار تحميل التقارير...</AppCard>}
      {error && <AppCard className="mt-6 text-danger">{error}</AppCard>}
      {data && (
        <div className="mt-6 grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric title="إجمالي المبيعات" value={data.profit?.revenue ?? 0} />
            <Metric title="الربح الإجمالي التقديري" value={data.profit?.grossProfitEstimate ?? 0} />
            <Metric title="قيمة المخزون" value={data.inventory?.totalValue ?? 0} />
          </div>
          <ReportTable title="المبيعات اليومية" columns={["اليوم", "المبيعات", "الفواتير"]} rows={data.daily.map((row) => [row.date ?? "-", `${row.totalSales} ج`, row.invoicesCount])} />
          <ReportTable title="المبيعات الشهرية" columns={["الشهر", "المبيعات", "الفواتير"]} rows={data.monthly.map((row) => [row.month ?? "-", `${row.totalSales} ج`, row.invoicesCount])} />
          <ReportTable title="طرق الدفع" columns={["الطريقة", "الإجمالي", "عدد العمليات"]} rows={data.methods.map((row) => [methodLabel(row.method), `${row.total} ج`, row.count])} />
          <ReportTable title="أداء الكاشير" columns={["الكاشير", "الفواتير", "المبيعات"]} rows={data.cashiers.map((row) => [row.cashierName, row.invoicesCount, `${row.totalSales} ج`])} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ReportTable title="أفضل المنتجات" columns={["المنتج", "الكمية", "المبيعات"]} rows={data.best.map((row) => [row.productName, row.quantity, `${row.sales} ج`])} />
            <ReportTable title="أسوأ المنتجات" columns={["المنتج", "الكمية", "المبيعات"]} rows={data.worst.map((row) => [row.productName, row.quantity, `${row.sales} ج`])} />
          </div>
          <ReportTable title="المصاريف حسب التصنيف" columns={["التصنيف", "الإجمالي", "العدد"]} rows={(data.expenses?.rows ?? []).map((row) => [row.category, `${row.total} ج`, row.count])} />
          <ReportTable title="قيمة المخزون" columns={["المنتج", "الكمية", "القيمة"]} rows={(data.inventory?.rows ?? []).slice(0, 10).map((row) => [row.productName, row.quantity, `${row.value} ج`])} />
        </div>
      )}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return <AppCard><p className="text-sm text-muted-foreground">{title}</p><h3 className="mt-2 text-2xl font-bold">{value} ج</h3></AppCard>;
}

function ReportTable({ title, columns, rows }: { title: string; columns: string[]; rows: Array<Array<string | number>> }) {
  return (
    <AppCard>
      <h2 className="mb-4 font-bold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground"><tr>{columns.map((column) => <th key={column} className="border-b border-border px-3 py-2 text-right">{column}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index} className="border-b border-border last:border-0">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2">{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا توجد بيانات.</p>}
    </AppCard>
  );
}

function methodLabel(method: string) {
  return method === "CASH" ? "نقدي" : method === "CARD" ? "بطاقة" : "محفظة";
}
