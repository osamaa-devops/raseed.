import { BarChart3, Package, Receipt, ShoppingCart } from "lucide-react";
import { KpiGrid } from "../../components/dashboard/KpiGrid";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { demoKpis } from "../../data/demo/demoReports";
import { demoProducts } from "../../data/demo/demoProducts";
import { demoSalesTrend } from "../../data/demo/demoSales";

export function OwnerDashboardPage() {
  return (
    <div>
      <PageHeader title="لوحة التحكم" description="نظرة سريعة على مبيعات ومخزون ماركت المدينة" />
      <KpiGrid items={demoKpis} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><BarChart3 size={18} /> مبيعات الأسبوع</h2>
          <div className="flex h-52 items-end justify-between gap-2">
            {demoSalesTrend.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-primary/70" style={{ height: `${item.sales / 85}px` }} />
                <span className="text-xs text-muted-foreground">{item.day.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </AppCard>
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Package size={18} /> حدود إعادة الطلب</h2>
          <div className="space-y-3">
            {demoProducts.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-lg bg-warning/10 p-3">
                <span className="font-semibold">{product.name}</span>
                <span className="text-sm text-warning">الحد الأدنى {product.minStock} {product.unitType}</span>
              </div>
            ))}
          </div>
        </AppCard>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <AppCard><ShoppingCart className="mb-2 text-primary" /><h3 className="font-bold">الكاشير جاهز</h3><p className="text-sm text-muted-foreground">انتقل إلى شاشة POS عند بدء البيع.</p></AppCard>
        <AppCard><Receipt className="mb-2 text-primary" /><h3 className="font-bold">الفواتير محفوظة</h3><p className="text-sm text-muted-foreground">ربط الفواتير الحقيقي سيتم في مرحلة API.</p></AppCard>
      </div>
    </div>
  );
}
