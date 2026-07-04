import { AlertTriangle, BarChart3, Package, Receipt, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { dashboardService } from "../../services/dashboardService";
import type { DashboardOverview } from "../../types";

export function OwnerDashboardPage() {
  const { auth, hasPermission } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? undefined;

  useEffect(() => {
    if (!hasPermission("dashboard.view")) {
      setLoading(false);
      return;
    }
    setLoading(true);
    dashboardService.getOverview({ branchId })
      .then(setOverview)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "تعذر تحميل لوحة التحكم"))
      .finally(() => setLoading(false));
  }, [branchId, hasPermission]);

  if (!hasPermission("dashboard.view")) return <PageHeader title="لوحة التحكم" description="ليس لديك صلاحية عرض لوحة التحكم." />;
  if (loading) return <AppCard>جار تحميل لوحة التحكم...</AppCard>;
  if (error) return <AppCard className="text-danger">{error}</AppCard>;
  if (!overview) return <AppCard>لا توجد بيانات متاحة.</AppCard>;

  return (
    <div>
      <PageHeader title="لوحة التحكم" description={`ملخص تشغيل يوم ${new Date(overview.date).toLocaleDateString("ar-EG")}`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title="مبيعات اليوم" value={overview.todaySales} suffix="ج" hint={`${overview.salesChangePercent}% عن أمس`} />
        <Kpi title="صافي المبيعات" value={overview.netSales} suffix="ج" hint={`مرتجعات ${overview.todayReturns} ج`} />
        <Kpi title="المصاريف" value={overview.todayExpenses} suffix="ج" hint="مصروفات اليوم" />
        <Kpi title="صافي الربح التقديري" value={overview.netProfitEstimate} suffix="ج" hint={`${overview.profitChangePercent}% عن أمس`} />
        <Kpi title="عدد الفواتير" value={overview.invoicesCount} hint={`متوسط ${overview.averageInvoiceValue} ج`} />
        <Kpi title="تنبيهات المخزون" value={overview.lowStockCount} hint={`${overview.expiryAlertsCount} صلاحية قريبة`} />
        <Kpi title="نقدي" value={overview.cashPayments} suffix="ج" hint="صافي مدفوعات نقدية" />
        <Kpi title="بطاقة ومحفظة" value={overview.cardPayments + overview.walletPayments} suffix="ج" hint={`بطاقة ${overview.cardPayments} / محفظة ${overview.walletPayments}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><BarChart3 size={18} /> أفضل المنتجات</h2>
          <div className="space-y-3">
            {overview.topSellingProducts.map((product) => (
              <div key={product.productId} className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div><p className="font-semibold">{product.productName}</p><p className="text-xs text-muted-foreground">{product.quantity} وحدة</p></div>
                <span className="font-bold">{product.sales} ج</span>
              </div>
            ))}
            {overview.topSellingProducts.length === 0 && <p className="text-sm text-muted-foreground">لا توجد مبيعات اليوم.</p>}
          </div>
        </AppCard>
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Wallet size={18} /> أداء الكاشيرين</h2>
          <div className="space-y-3">
            {overview.cashierPerformance.map((cashier) => (
              <div key={cashier.cashierId} className="rounded-lg border border-border p-3">
                <div className="flex justify-between"><span className="font-semibold">{cashier.cashierName}</span><span>{cashier.totalSales} ج</span></div>
                <p className="mt-1 text-xs text-muted-foreground">{cashier.invoicesCount} فاتورة</p>
              </div>
            ))}
            {overview.cashierPerformance.length === 0 && <p className="text-sm text-muted-foreground">لا يوجد نشاط كاشير اليوم.</p>}
          </div>
        </AppCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Receipt size={18} /> آخر الفواتير</h2>
          <div className="space-y-2">
            {overview.recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex justify-between rounded-lg bg-muted p-3 text-sm">
                <span>{invoice.invoiceNumber}</span>
                <span className="font-semibold">{invoice.total} ج</span>
              </div>
            ))}
          </div>
        </AppCard>
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Package size={18} /> حالة التشغيل</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <StateItem icon={AlertTriangle} label="منتجات قليلة المخزون" value={overview.lowStockCount} />
            <StateItem icon={AlertTriangle} label="تنبيهات صلاحية" value={overview.expiryAlertsCount} />
            <StateItem icon={Receipt} label="مرتجعات" value={overview.returnsCount} />
            <StateItem icon={Wallet} label="إجمالي طرق الدفع" value={`${overview.cashPayments + overview.cardPayments + overview.walletPayments} ج`} />
          </div>
        </AppCard>
      </div>
    </div>
  );
}

function Kpi({ title, value, suffix = "", hint }: { title: string; value: number; suffix?: string; hint?: string }) {
  return <AppCard><p className="text-sm text-muted-foreground">{title}</p><h3 className="mt-2 text-2xl font-bold">{value} {suffix}</h3>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</AppCard>;
}

function StateItem({ icon: Icon, label, value }: { icon: typeof AlertTriangle; label: string; value: string | number }) {
  return <div className="rounded-lg bg-muted p-3"><Icon className="mb-2 text-primary" size={18} /><p className="text-xs text-muted-foreground">{label}</p><p className="font-bold">{value}</p></div>;
}
