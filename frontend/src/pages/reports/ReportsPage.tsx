import { BarChart3 } from "lucide-react";
import { KpiGrid } from "../../components/dashboard/KpiGrid";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { demoKpis } from "../../data/demo/demoReports";

export function ReportsPage() {
  return (
    <div>
      <PageHeader title="التقارير" description="تجهيز واجهة التقارير قبل ربطها ببيانات PostgreSQL." />
      <KpiGrid items={demoKpis} />
      <AppCard className="mt-6">
        <BarChart3 className="mb-3 text-primary" />
        <h2 className="font-bold">تقارير تفصيلية لاحقًا</h2>
        <p className="mt-1 text-sm text-muted-foreground">المبيعات، الأرباح، المخزون، الشيفتات، والكاشيرين ستبنى بعد نمذجة البيانات.</p>
      </AppCard>
    </div>
  );
}
