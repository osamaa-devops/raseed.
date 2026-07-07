import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock3, Search, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { demoRequestsService } from "../../services/demoRequestsService";
import type { DemoRequest, DemoRequestStatus } from "../../types";
import { SelectInput, TextInput } from "../../components/forms/FormControls";

const statusLabels: Record<DemoRequestStatus, string> = {
  PENDING: "جديد",
  CONTACTED: "تم التواصل",
  CONVERTED: "تحول لعميل",
  REJECTED: "مرفوض",
};

export function SupportTicketsPage() {
  const [items, setItems] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: "", status: "" as DemoRequestStatus | "" });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await demoRequestsService.list({ search: filters.search, status: filters.status, limit: 100 });
      setItems(response.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.status === "PENDING").length,
      contacted: items.filter((item) => item.status === "CONTACTED").length,
      converted: items.filter((item) => item.status === "CONVERTED").length,
    };
  }, [items]);

  const updateStatus = async (id: string, status: DemoRequestStatus) => {
    await demoRequestsService.update(id, { status });
    await load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="طلبات التواصل"
        description="كل طلب من عميل جديد يظهر هنا لتتم متابعته من لوحة المنصة."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="إجمالي الطلبات" value={stats.total} icon={Sparkles} />
        <StatCard title="طلبات جديدة" value={stats.pending} icon={Clock3} />
        <StatCard title="تم التواصل" value={stats.contacted} icon={CheckCircle2} />
        <StatCard title="تحولت لعملاء" value={stats.converted} icon={ShieldAlert} />
      </div>

      <AppCard>
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <TextInput
            label="بحث"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="اسم المحل أو المالك أو الهاتف"
          />
          <SelectInput
            label="الحالة"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as DemoRequestStatus | "" }))}
          >
            <option value="">الكل</option>
            <option value="PENDING">جديد</option>
            <option value="CONTACTED">تم التواصل</option>
            <option value="CONVERTED">تحول لعميل</option>
            <option value="REJECTED">مرفوض</option>
          </SelectInput>
          <div className="flex items-end">
            <AppButton icon={Search} onClick={load}>تحديث</AppButton>
          </div>
        </div>
      </AppCard>

      {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}

      {loading ? (
        <AppCard>جار تحميل الطلبات...</AppCard>
      ) : (
        <DataTable
          columns={["المحل", "المالك", "الهاتف", "النشاط", "الحالة", "الملاحظات", "الإجراءات"]}
          rows={items}
          renderRow={(request) => (
            <tr key={request.id} className="border-t border-border">
              <td className="px-4 py-3 font-semibold">{request.storeName}</td>
              <td className="px-4 py-3">{request.ownerName}</td>
              <td className="px-4 py-3">{request.phone}</td>
              <td className="px-4 py-3">{request.businessType}</td>
              <td className="px-4 py-3">
                <StatusBadge label={statusLabels[request.status]} tone={requestTone(request.status)} />
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{request.notes ?? "-"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <AppButton variant="outline" onClick={() => void updateStatus(request.id, "CONTACTED")}>تم التواصل</AppButton>
                  <AppButton variant="secondary" onClick={() => void updateStatus(request.id, "CONVERTED")}>تحويل</AppButton>
                  <AppButton variant="ghost" onClick={() => void updateStatus(request.id, "REJECTED")}>رفض</AppButton>
                </div>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: LucideIcon }) {
  return (
    <AppCard>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <span className="rounded-xl bg-primary/10 p-3 text-primary">
          <Icon size={18} />
        </span>
      </div>
    </AppCard>
  );
}

function requestTone(status: DemoRequestStatus) {
  if (status === "PENDING") return "info";
  if (status === "CONTACTED") return "success";
  if (status === "CONVERTED") return "success";
  return "danger";
}
