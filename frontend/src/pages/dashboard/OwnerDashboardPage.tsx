import { AlertTriangle, ArrowLeft, BarChart3, Package, Receipt, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../app/providers/AuthProvider";
import { DemoModeBanner } from "../../components/demo/DemoModeBanner";
import { LoadingSkeleton } from "../../components/feedback/LoadingSkeleton";
import { AppCard } from "../../components/ui/AppCard";
import { AppButton } from "../../components/ui/AppButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { dashboardService } from "../../services/dashboardService";
import type { DashboardOverview } from "../../types";
import { isDemoStore } from "../../utils/demo";

export function OwnerDashboardPage() {
  const { auth, hasPermission } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? undefined;
  const demoMode = isDemoStore(auth?.store);

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
  if (loading) return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton className="hidden xl:block" /></div>;
  if (error) return <AppCard className="text-danger">{error}</AppCard>;
  if (!overview) return <AppCard>لا توجد بيانات متاحة.</AppCard>;

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        description={`ملخص تشغيل ${auth?.store?.name ?? "المتجر"} ليوم ${new Date(overview.date).toLocaleDateString("ar-EG")} بطريقة سريعة ومفهومة.`}
        actions={<AppButton icon={ShoppingCart} onClick={() => (window.location.href = "/pos")}>فتح الكاشير</AppButton>}
      />
      {demoMode && <DemoModeBanner />}

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <AppCard className="overflow-hidden bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(245,158,11,0.08),rgba(255,255,255,0.02))]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">ملخص اليوم في أقل من 30 ثانية</p>
              <h2 className="mt-2 text-3xl font-extrabold text-foreground md:text-4xl">{formatMoney(overview.todaySales)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">إجمالي المبيعات اليوم من {overview.invoicesCount} فاتورة، بمتوسط {formatMoney(overview.averageInvoiceValue)} للفاتورة.</p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-background/75 p-4">
              <p className="text-xs text-muted-foreground">صافي الربح التقديري</p>
              <p className="mt-1 text-2xl font-extrabold text-foreground">{formatMoney(overview.netProfitEstimate)}</p>
              <p className={`mt-2 text-xs font-semibold ${overview.profitChangePercent >= 0 ? "text-success" : "text-danger"}`}>{formatSignedPercent(overview.profitChangePercent)} عن أمس</p>
            </div>
          </div>
        </AppCard>
        <AppCard>
          <h2 className="text-sm font-bold text-foreground">إجراءات سريعة</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <QuickLink to="/pos" icon={ShoppingCart} title="بيع جديد" description="افتح شاشة الكاشير مباشرة" />
            <QuickLink to="/products" icon={Package} title="إضافة منتج" description="أضف صنفًا أو راجع الكتالوج" />
            <QuickLink to="/inventory" icon={AlertTriangle} title="فحص المخزون" description="راجع النواقص والحركات" />
            <QuickLink to="/reports" icon={BarChart3} title="عرض التقارير" description="راجع المبيعات والربح" />
          </div>
        </AppCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Kpi title="مبيعات اليوم" value={overview.todaySales} suffix="ج" hint={formatSignedPercent(overview.salesChangePercent, "مقارنة بأمس")} icon={TrendingUp} tone="primary" />
        <Kpi title="صافي الربح" value={overview.netProfitEstimate} suffix="ج" hint={formatSignedPercent(overview.profitChangePercent, "مقارنة بأمس")} icon={Wallet} tone="success" />
        <Kpi title="عدد الفواتير" value={overview.invoicesCount} hint={`المتوسط ${formatMoney(overview.averageInvoiceValue)}`} icon={Receipt} tone="info" />
        <Kpi title="المخزون المنخفض" value={overview.lowStockCount} hint={`${overview.expiryAlertsCount} دفعات بصلاحية قريبة`} icon={AlertTriangle} tone="warning" />
        <Kpi title="المصاريف" value={overview.todayExpenses} suffix="ج" hint={`المرتجعات ${formatMoney(overview.todayReturns)}`} icon={Wallet} tone="danger" />
        <Kpi title="أفضل المنتجات" value={overview.topSellingProducts.length} hint={overview.topSellingProducts[0] ? `الأعلى: ${overview.topSellingProducts[0].productName}` : "لا توجد مبيعات بعد"} icon={Package} tone="muted" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><BarChart3 size={18} /> أفضل المنتجات اليوم</h2>
          <div className="space-y-3">
            {overview.topSellingProducts.map((product) => (
              <div key={product.productId} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/50 p-3">
                <div><p className="font-semibold">{product.productName}</p><p className="text-xs text-muted-foreground">{product.quantity} وحدة مباعة</p></div>
                <span className="font-bold">{formatMoney(product.sales)}</span>
              </div>
            ))}
            {overview.topSellingProducts.length === 0 && <p className="text-sm text-muted-foreground">لا توجد مبيعات اليوم.</p>}
          </div>
        </AppCard>
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Wallet size={18} /> حركة الدفع</h2>
          <div className="space-y-3">
            <StateItem icon={Wallet} label="مدفوعات نقدية" value={formatMoney(overview.cashPayments)} />
            <StateItem icon={Wallet} label="بطاقات" value={formatMoney(overview.cardPayments)} />
            <StateItem icon={Wallet} label="محافظ" value={formatMoney(overview.walletPayments)} />
            <StateItem icon={Wallet} label="ديون العملاء" value={formatMoney(overview.totalCustomerDebt ?? 0)} />
          </div>
        </AppCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Receipt size={18} /> آخر الفواتير</h2>
          <div className="space-y-2">
            {overview.recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-2xl bg-muted/50 p-3 text-sm">
                <div>
                  <p className="font-semibold">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{new Date(invoice.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <span className="font-semibold">{formatMoney(invoice.total)}</span>
              </div>
            ))}
          </div>
        </AppCard>
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Package size={18} /> ملخص التشغيل</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <StateItem icon={AlertTriangle} label="منتجات قليلة المخزون" value={overview.lowStockCount} />
            <StateItem icon={AlertTriangle} label="تنبيهات صلاحية" value={overview.expiryAlertsCount} />
            <StateItem icon={Receipt} label="مرتجعات" value={overview.returnsCount} />
            <StateItem icon={Wallet} label="إجمالي المدفوعات" value={formatMoney(overview.cashPayments + overview.cardPayments + overview.walletPayments)} />
          </div>
        </AppCard>
      </div>

      <div className="mt-6">
        <AppCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">أداء الكاشيرين</h2>
            <Link to="/sales" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">عرض المبيعات <ArrowLeft size={16} /></Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {overview.cashierPerformance.map((cashier) => (
              <div key={cashier.cashierId} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{cashier.cashierName}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{cashier.invoicesCount} فاتورة</span>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-foreground">{formatMoney(cashier.totalSales)}</p>
                <p className="mt-1 text-xs text-muted-foreground">مبيعات اليوم</p>
              </div>
            ))}
            {overview.cashierPerformance.length === 0 && <p className="text-sm text-muted-foreground">لا يوجد نشاط كاشير اليوم.</p>}
          </div>
        </AppCard>
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  suffix = "",
  hint,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  suffix?: string;
  hint?: string;
  icon: typeof AlertTriangle;
  tone: "primary" | "success" | "warning" | "danger" | "info" | "muted";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    info: "bg-info/10 text-info",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="mt-3 text-3xl font-extrabold text-foreground">{value.toLocaleString("ar-EG")} {suffix}</h3>
          {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={`rounded-2xl p-3 ${toneClasses[tone]}`}><Icon size={20} /></span>
      </div>
    </AppCard>
  );
}

function StateItem({ icon: Icon, label, value }: { icon: typeof AlertTriangle; label: string; value: string | number }) {
  return <div className="rounded-2xl bg-muted/55 p-3"><Icon className="mb-2 text-primary" size={18} /><p className="text-xs text-muted-foreground">{label}</p><p className="font-bold">{value}</p></div>;
}

function QuickLink({ to, icon: Icon, title, description }: { to: string; icon: typeof ShoppingCart; title: string; description: string }) {
  return (
    <Link to={to} className="rounded-2xl border border-border bg-background p-3 transition hover:border-primary/40 hover:bg-primary/5">
      <Icon size={18} className="text-primary" />
      <p className="mt-3 font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </Link>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}

function formatSignedPercent(value: number, suffix?: string) {
  const formatted = `${value > 0 ? "+" : ""}${value.toLocaleString("ar-EG")}%`;
  return suffix ? `${formatted} ${suffix}` : formatted;
}
