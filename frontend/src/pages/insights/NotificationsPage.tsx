import { AlertTriangle, Bell, CreditCard, Package, RefreshCcw, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/feedback/EmptyState";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { customersService } from "../../services/customersService";
import { inventoryService } from "../../services/inventoryService";
import { subscriptionService } from "../../services/subscriptionService";
import type { InventoryBatch, InventoryStock } from "../../types";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  tone: "warning" | "danger" | "info";
  source: "inventory" | "expiry" | "debts" | "subscription";
  createdAt?: string | null;
};

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => ({
    inventory: items.filter((item) => item.source === "inventory").length,
    expiry: items.filter((item) => item.source === "expiry").length,
    debts: items.filter((item) => item.source === "debts").length,
    subscription: items.filter((item) => item.source === "subscription").length,
  }), [items]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lowStock, expiryAlerts, debtCustomers, subscription] = await Promise.all([
        inventoryService.getLowStock({ limit: 10 }).catch(() => ({ items: [] as InventoryStock[] })),
        inventoryService.getExpiryAlerts({ days: 30 }).catch(() => [] as InventoryBatch[]),
        customersService.getCustomers({ hasDebt: "true", limit: 10 }).catch(() => ({ items: [], summary: { totalDebt: 0, customersCount: 0 } })),
        subscriptionService.getMySubscription().catch(() => null),
      ]);

      const nextItems: NotificationItem[] = [
        ...lowStock.items.map((stock) => ({
          id: `low-${stock.id}`,
          title: "مخزون منخفض",
          body: `${stock.product.name}: الكمية ${stock.quantity} والحد الأدنى ${stock.minStock}`,
          tone: stock.quantity <= 0 ? "danger" as const : "warning" as const,
          source: "inventory" as const,
          createdAt: stock.updatedAt,
        })),
        ...expiryAlerts.slice(0, 10).map((batch) => ({
          id: `exp-${batch.id}`,
          title: "صلاحية قريبة",
          body: `${batch.product.name}: ${batch.remainingQuantity} قطعة تنتهي ${formatDate(batch.expiryDate)}`,
          tone: "warning" as const,
          source: "expiry" as const,
          createdAt: batch.expiryDate,
        })),
        ...debtCustomers.items.map((customer) => ({
          id: `debt-${customer.id}`,
          title: "دين عميل غير مسدد",
          body: `${customer.name}: ${formatMoney(customer.currentDebt)}`,
          tone: "info" as const,
          source: "debts" as const,
          createdAt: customer.updatedAt,
        })),
      ];

      if (subscription?.daysRemaining !== null && subscription?.daysRemaining !== undefined && subscription.daysRemaining <= 7) {
        nextItems.unshift({
          id: "subscription-expiry",
          title: "الاشتراك ينتهي قريبًا",
          body: `${subscription.currentPlan?.name ?? "الخطة الحالية"} - متبقي ${subscription.daysRemaining} يوم`,
          tone: subscription.daysRemaining <= 0 ? "danger" : "warning",
          source: "subscription",
          createdAt: subscription.endDate,
        });
      }

      setItems(nextItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل التنبيهات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <PageHeader title="التنبيهات" description="تنبيهات تشغيلية حقيقية من المخزون، الصلاحية، الديون، والاشتراك." />
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <SummaryCard icon={Package} label="المخزون" value={counts.inventory} />
        <SummaryCard icon={Timer} label="الصلاحية" value={counts.expiry} />
        <SummaryCard icon={CreditCard} label="الديون" value={counts.debts} />
        <SummaryCard icon={AlertTriangle} label="الاشتراك" value={counts.subscription} />
      </div>
      <div className="mb-4 flex justify-end">
        <AppButton variant="outline" icon={RefreshCcw} onClick={() => void load()}>تحديث</AppButton>
      </div>
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {loading ? (
        <AppCard>جار تحميل التنبيهات...</AppCard>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="لا توجد تنبيهات حالية" description="النظام لم يجد مخزونًا منخفضًا أو ديونًا أو اشتراكًا قريب الانتهاء ضمن الفلاتر الحالية." />
      ) : (
        <div className="space-y-3">
          {items.map((notification) => (
            <AppCard key={notification.id} className="flex items-start gap-3">
              <Bell className="mt-1 text-primary" size={18} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-bold">{notification.title}</h2>
                  <StatusBadge label={sourceLabel(notification.source)} tone={notification.tone} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
              </div>
            </AppCard>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Bell; label: string; value: number }) {
  return (
    <AppCard className="flex items-center gap-3">
      <span className="rounded-xl bg-primary/10 p-3 text-primary"><Icon size={18} /></span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </AppCard>
  );
}

function sourceLabel(source: NotificationItem["source"]) {
  return source === "inventory" ? "مخزون" : source === "expiry" ? "صلاحية" : source === "debts" ? "ديون" : "اشتراك";
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(value)) : "تاريخ غير محدد";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(value);
}
