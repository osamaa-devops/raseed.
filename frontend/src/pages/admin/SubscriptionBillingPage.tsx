import { AlertTriangle, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { subscriptionService } from "../../services/subscriptionService";
import type { MySubscriptionResponse } from "../../services/subscriptionService";

export function SubscriptionBillingPage() {
  const [data, setData] = useState<MySubscriptionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        setData(await subscriptionService.getMySubscription());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الاشتراك");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div>
      <PageHeader title="الاشتراك والفواتير" description="الخطة الحالية، حالة الاشتراك، الاستخدام، وسجل الدفعات." />
      {loading && <AppCard>جار تحميل بيانات الاشتراك...</AppCard>}
      {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {data && (
        <div className="space-y-6">
          {["SUSPENDED", "EXPIRED", "CANCELLED"].includes(data.subscriptionStatus ?? "") && (
            <AppCard className="border-danger/30 bg-danger/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 text-danger" size={18} />
                <div>
                  <h3 className="font-bold text-danger">الاشتراك متوقف</h3>
                  <p className="mt-1 text-sm text-muted-foreground">انتهى اشتراك المتجر أو تم إيقافه. برجاء التواصل مع الدعم لاستعادة الوصول الكامل.</p>
                  <div className="mt-3">
                    <Link to="/help">
                      <AppButton variant="outline">التواصل مع الدعم</AppButton>
                    </Link>
                  </div>
                </div>
              </div>
            </AppCard>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <AppCard><p className="text-sm text-muted-foreground">الخطة الحالية</p><h3 className="mt-2 text-2xl font-bold">{data.currentPlan?.name ?? "-"}</h3></AppCard>
            <AppCard><p className="text-sm text-muted-foreground">الحالة</p><div className="mt-3"><StatusBadge label={subscriptionStatusLabel(data.subscriptionStatus)} tone={subscriptionTone(data.subscriptionStatus)} /></div></AppCard>
            <AppCard><p className="text-sm text-muted-foreground">تاريخ التجديد</p><h3 className="mt-2 text-lg font-bold">{formatDate(data.endDate)}</h3></AppCard>
            <AppCard><p className="text-sm text-muted-foreground">الأيام المتبقية</p><h3 className="mt-2 text-2xl font-bold">{data.daysRemaining ?? "-"}</h3></AppCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <AppCard>
              <div className="mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-primary" />
                <h2 className="font-bold">الحدود والاستخدام</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <UsageRow label="المستخدمون" value={`${data.usage.usersCount} / ${data.usage.limits?.maxUsers ?? "غير محدد"}`} />
                <UsageRow label="الفروع" value={`${data.usage.branchesCount} / ${data.usage.limits?.maxBranches ?? "غير محدد"}`} />
                <UsageRow label="المنتجات" value={`${data.usage.productsCount} / ${data.usage.limits?.maxProducts ?? "غير محدد"}`} />
                <UsageRow label="فواتير الشهر" value={`${data.usage.invoicesThisMonth} / ${data.usage.limits?.maxInvoicesPerMonth ?? "غير محدد"}`} />
              </div>
            </AppCard>

            <AppCard>
              <h2 className="font-bold">تفاصيل الخطة</h2>
              <p className="mt-2 text-sm text-muted-foreground">{data.currentPlan?.description ?? "لا توجد تفاصيل إضافية."}</p>
              <div className="mt-4 space-y-2 text-sm">
                <p>الدورة: <strong>{billingCycleLabel(data.billingCycle)}</strong></p>
                <p>القيمة الحالية: <strong>{formatMoney(data.amount)}</strong></p>
              </div>
              <div className="mt-4">
                <h3 className="mb-2 font-semibold">الخصائص</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.currentPlan?.features ?? {}).map(([key, value]) => (
                    <span key={key} className="rounded-md bg-muted px-3 py-1 text-xs font-semibold">{key}: {String(value)}</span>
                  ))}
                  {Object.keys(data.currentPlan?.features ?? {}).length === 0 && <p className="text-sm text-muted-foreground">لا توجد خصائص إضافية معرّفة بعد.</p>}
                </div>
              </div>
            </AppCard>
          </div>

          <AppCard>
            <h2 className="font-bold">خيارات الترقية</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.upgradeOptions.map((plan) => (
                <div key={plan.id} className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold">{plan.name}</h3>
                    <StatusBadge label={plan.status === "ACTIVE" ? "متاحة" : "غير متاحة"} tone={plan.status === "ACTIVE" ? "success" : "muted"} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description ?? "-"}</p>
                  <p className="mt-3 text-lg font-bold">{formatMoney(plan.priceMonthly)} / شهريًا</p>
                  <p className="text-sm text-muted-foreground">زر طلب الترقية سيبقى placeholder في هذه المرحلة.</p>
                </div>
              ))}
            </div>
          </AppCard>

          <AppCard>
            <h2 className="font-bold">سجل الدفعات</h2>
            <div className="mt-4 overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-right">التاريخ</th>
                    <th className="px-3 py-2 text-right">المبلغ</th>
                    <th className="px-3 py-2 text-right">الطريقة</th>
                    <th className="px-3 py-2 text-right">الحالة</th>
                    <th className="px-3 py-2 text-right">المرجع</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr key={payment.id} className="border-t border-border">
                      <td className="px-3 py-2">{formatDate(payment.paidAt ?? payment.createdAt)}</td>
                      <td className="px-3 py-2 font-semibold">{formatMoney(payment.amount)}</td>
                      <td className="px-3 py-2">{paymentMethodLabel(payment.method)}</td>
                      <td className="px-3 py-2"><StatusBadge label={paymentStatusLabel(payment.status)} tone={payment.status === "PAID" ? "success" : payment.status === "PENDING" ? "warning" : "danger"} /></td>
                      <td className="px-3 py-2">{payment.reference ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.payments.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">لا توجد دفعات مسجلة بعد.</p>}
            </div>
          </AppCard>
        </div>
      )}
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-card px-4 py-3"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(value)) : "-";
}

function subscriptionStatusLabel(status?: string | null) {
  const labels: Record<string, string> = { TRIAL: "تجريبي", ACTIVE: "نشط", SUSPENDED: "موقوف", PAST_DUE: "متأخر", CANCELLED: "ملغي", EXPIRED: "منتهي" };
  return status ? labels[status] ?? status : "-";
}

function subscriptionTone(status?: string | null) {
  if (status === "ACTIVE") return "success";
  if (status === "TRIAL") return "info";
  if (status === "PAST_DUE" || status === "SUSPENDED") return "warning";
  return "danger";
}

function billingCycleLabel(cycle?: string | null) {
  return cycle === "MONTHLY" ? "شهري" : cycle === "YEARLY" ? "سنوي" : cycle === "TRIAL" ? "تجريبي" : "-";
}

function paymentMethodLabel(method: string) {
  return method === "CASH" ? "نقدي" : method === "BANK_TRANSFER" ? "تحويل بنكي" : method === "WALLET" ? "محفظة" : method === "CARD" ? "بطاقة" : "يدوي";
}

function paymentStatusLabel(status: string) {
  return status === "PAID" ? "مدفوعة" : status === "PENDING" ? "معلقة" : status === "FAILED" ? "فاشلة" : "مستردة";
}
