import { useEffect, useState } from "react";
import { KpiGrid } from "../../components/dashboard/KpiGrid";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { superAdminService } from "../../services/superAdminService";
import type { AdminOverview } from "../../types";

export function SuperAdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setOverview(await superAdminService.getOverview());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "تعذر تحميل لوحة المنصة");
      }
    };
    void load();
  }, []);

  return (
    <div>
      <PageHeader title="لوحة المنصة" description="متابعة المحلات والاشتراكات والمدفوعات على مستوى SaaS." />
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      <KpiGrid items={[
        { label: "إجمالي المحلات", value: String(overview?.totalStores ?? "-"), tone: "primary" },
        { label: "محلات نشطة", value: String(overview?.activeStores ?? "-"), tone: "success" },
        { label: "MRR", value: overview ? formatMoney(overview.monthlyRecurringRevenue) : "-", tone: "info" },
        { label: "اشتراكات تحتاج متابعة", value: String(overview?.expiringSoonSubscriptions ?? "-"), tone: "warning" },
      ]} />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <AppCard>
          <h2 className="font-bold">حالة المحلات</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Stat label="تجريبي" value={overview?.trialStores ?? 0} />
            <Stat label="منتهي" value={overview?.expiredStores ?? 0} />
            <Stat label="موقوف" value={overview?.suspendedStores ?? 0} />
            <Stat label="تقدير سنوي" value={overview ? formatMoney(overview.yearlyRecurringRevenue) : "-"} />
          </div>
        </AppCard>
        <AppCard>
          <h2 className="font-bold">أحدث المحلات</h2>
          <div className="mt-4 space-y-3">
            {overview?.recentStores.map((store) => (
              <div key={store.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="font-semibold">{store.name}</p>
                  <p className="text-sm text-muted-foreground">{store.ownerName ?? "-"}</p>
                </div>
                <StatusBadge label={storeStatusLabel(store.status)} tone={store.status === "ACTIVE" ? "success" : store.status === "TRIAL" ? "info" : "warning"} />
              </div>
            ))}
            {!overview?.recentStores.length && <p className="text-sm text-muted-foreground">لا توجد محلات حديثة.</p>}
          </div>
        </AppCard>
      </div>
      <AppCard className="mt-6">
        <h2 className="font-bold">أحدث المدفوعات</h2>
        <div className="mt-4 overflow-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-right">المتجر</th>
                <th className="px-3 py-2 text-right">الخطة</th>
                <th className="px-3 py-2 text-right">المبلغ</th>
                <th className="px-3 py-2 text-right">الحالة</th>
                <th className="px-3 py-2 text-right">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {overview?.recentPayments.map((payment) => (
                <tr key={payment.id} className="border-t border-border">
                  <td className="px-3 py-2">{payment.store?.name ?? "-"}</td>
                  <td className="px-3 py-2">{payment.subscription?.plan?.name ?? "-"}</td>
                  <td className="px-3 py-2 font-semibold">{formatMoney(payment.amount)}</td>
                  <td className="px-3 py-2"><StatusBadge label={payment.status === "PAID" ? "مدفوعة" : payment.status} tone={payment.status === "PAID" ? "success" : "warning"} /></td>
                  <td className="px-3 py-2">{formatDate(payment.paidAt ?? payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-border bg-card px-4 py-3"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(value)) : "-";
}

function storeStatusLabel(status: string) {
  return status === "ACTIVE" ? "نشط" : status === "TRIAL" ? "تجريبي" : status === "SUSPENDED" ? "موقوف" : status === "EXPIRED" ? "منتهي" : "ملغي";
}
