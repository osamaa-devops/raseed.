import { Store } from "lucide-react";
import { KpiGrid } from "../../components/dashboard/KpiGrid";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";

export function SuperAdminDashboardPage() {
  return (
    <div>
      <PageHeader title="لوحة المنصة" description="إدارة SaaS رصيد على مستوى كل المحلات." />
      <KpiGrid
        items={[
          { label: "إجمالي المحلات", value: "24", tone: "primary" },
          { label: "محلات نشطة", value: "19", tone: "success" },
          { label: "MRR", value: "8,400 ج", tone: "info" },
          { label: "اشتراكات تحتاج متابعة", value: "3", tone: "warning" },
        ]}
      />
      <AppCard className="mt-6">
        <Store className="mb-3 text-primary" />
        <h2 className="font-bold">سوبر أدمن محفوظ</h2>
        <p className="mt-1 text-sm text-muted-foreground">هذه واجهة منصة فقط، بدون تنفيذ عمليات SaaS بعد.</p>
      </AppCard>
    </div>
  );
}
