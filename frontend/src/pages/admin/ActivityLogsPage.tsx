import { Activity, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "../../components/feedback/EmptyState";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { activityLogsService, type ActivityLogsParams } from "../../services/activityLogsService";
import { usersService } from "../../services/usersService";
import type { ActivityLog, User } from "../../types";

export function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<ActivityLogsParams>({ page: 1, limit: 20, userId: "", action: "", entityType: "", dateFrom: "", dateTo: "" });
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const [logsResponse, usersResponse] = await Promise.all([
        activityLogsService.list(nextFilters),
        usersService.list().catch(() => [] as User[]),
      ]);
      setLogs(logsResponse.items);
      setMeta({ page: logsResponse.meta.page, pages: logsResponse.meta.pages || 1, total: logsResponse.meta.total });
      setUsers(usersResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل سجل النشاط");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const applyFilters = () => {
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    void load(nextFilters);
  };

  const goToPage = (page: number) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    void load(nextFilters);
  };

  return (
    <div>
      <PageHeader title="سجل النشاط" description="تتبع العمليات الحساسة حسب المستخدم والإجراء والتاريخ." />
      <AppCard className="mb-6">
        <div className="grid gap-3 lg:grid-cols-6">
          <SelectInput label="المستخدم" value={filters.userId} onChange={(event) => setFilters((current) => ({ ...current, userId: event.target.value }))}>
            <option value="">الكل</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </SelectInput>
          <TextInput label="الإجراء" value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} />
          <TextInput label="الكيان" value={filters.entityType} onChange={(event) => setFilters((current) => ({ ...current, entityType: event.target.value }))} />
          <TextInput label="من تاريخ" type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
          <TextInput label="إلى تاريخ" type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
          <div className="flex items-end gap-2">
            <AppButton onClick={applyFilters}>تطبيق</AppButton>
            <AppButton variant="outline" icon={RefreshCcw} onClick={() => void load()}>تحديث</AppButton>
          </div>
        </div>
      </AppCard>
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {loading ? (
        <AppCard>جار تحميل سجل النشاط...</AppCard>
      ) : logs.length === 0 ? (
        <EmptyState icon={Activity} title="لا يوجد نشاط مطابق" description="غيّر الفلاتر أو نفذ عملية جديدة داخل النظام." />
      ) : (
        <>
          <DataTable
            columns={["التاريخ", "المستخدم", "الإجراء", "الكيان", "الفرع", "المتجر", "التفاصيل"]}
            rows={logs}
            renderRow={(log) => (
              <tr key={log.id} className="border-t border-border hover:bg-table-row-hover">
                <td className="px-4 py-3">{formatDate(log.createdAt)}</td>
                <td className="px-4 py-3">{log.user?.name ?? "-"}</td>
                <td className="px-4 py-3"><StatusBadge label={log.action} tone="info" /></td>
                <td className="px-4 py-3">{log.entityType ?? "-"}</td>
                <td className="px-4 py-3">{log.branch?.name ?? "-"}</td>
                <td className="px-4 py-3">{log.store?.name ?? "-"}</td>
                <td className="max-w-sm truncate px-4 py-3 text-xs text-muted-foreground">{formatMetadata(log.metadata)}</td>
              </tr>
            )}
          />
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>الإجمالي: {meta.total}</span>
            <div className="flex gap-2">
              <AppButton variant="outline" disabled={meta.page <= 1} onClick={() => goToPage(meta.page - 1)}>السابق</AppButton>
              <AppButton variant="outline" disabled={meta.page >= meta.pages} onClick={() => goToPage(meta.page + 1)}>التالي</AppButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatMetadata(value?: Record<string, unknown> | null) {
  if (!value) return "-";
  return JSON.stringify(value);
}
