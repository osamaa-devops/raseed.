import { useEffect, useState } from "react";
import { Clock, Lock, Unlock } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { EmptyState } from "../../components/feedback/EmptyState";
import { TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { shiftsService } from "../../services/shiftsService";
import type { CashierShift } from "../../types";

export function ShiftManagementPage() {
  const { auth, hasPermission } = useAuth();
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? "";
  const [current, setCurrent] = useState<CashierShift | null>(null);
  const [shifts, setShifts] = useState<CashierShift[]>([]);
  const [openingCash, setOpeningCash] = useState(500);
  const [actualCash, setActualCash] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    if (!branchId || !hasPermission("shifts.view")) return;
    try {
      const [currentShift, history] = await Promise.all([
        shiftsService.getCurrentShift(branchId),
        shiftsService.getShifts({ branchId, limit: 50 }),
      ]);
      setCurrent(currentShift);
      setShifts(history.items);
      setActualCash(currentShift?.openingCash ?? 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الشيفتات");
    }
  };

  useEffect(() => {
    void load();
  }, [branchId]);

  const openShift = async () => {
    setError(null);
    await shiftsService.openShift({ branchId, openingCash, notes });
    setNotice("تم فتح الشيفت");
    setNotes("");
    await load();
  };

  const closeShift = async () => {
    if (!current) return;
    setError(null);
    await shiftsService.closeShift({ shiftId: current.id, actualCash, notes });
    setNotice("تم إغلاق الشيفت");
    setNotes("");
    await load();
  };

  if (!hasPermission("shifts.view")) {
    return <EmptyState icon={Clock} title="لا تملك صلاحية الشيفتات" description="تواصل مع مدير المتجر لتحديث الصلاحيات." />;
  }

  return (
    <div>
      <PageHeader title="إدارة الشيفتات" description="فتح وإغلاق شيفت الكاشير ومراجعة الفروقات النقدية." />
      {notice && <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{notice}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      <div className="mb-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <AppCard>
          <h2 className="mb-3 flex items-center gap-2 font-bold">{current ? <Unlock size={18} /> : <Lock size={18} />} الشيفت الحالي</h2>
          {current ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">فتح في {formatDateTime(current.openedAt)}</p>
              <p className="text-sm">رصيد الافتتاح: <b>{formatMoney(current.openingCash)}</b></p>
              <TextInput label="النقد الفعلي عند الإغلاق" type="number" value={actualCash} onChange={(event) => setActualCash(Number(event.target.value))} />
              <TextInput label="ملاحظات" value={notes} onChange={(event) => setNotes(event.target.value)} />
              {hasPermission("shifts.close") && <AppButton variant="danger" onClick={closeShift}>إغلاق الشيفت</AppButton>}
            </div>
          ) : (
            <div className="space-y-3">
              <TextInput label="نقدية الافتتاح" type="number" value={openingCash} onChange={(event) => setOpeningCash(Number(event.target.value))} />
              <TextInput label="ملاحظات" value={notes} onChange={(event) => setNotes(event.target.value)} />
              {hasPermission("shifts.open") && <AppButton onClick={openShift}>فتح شيفت</AppButton>}
            </div>
          )}
        </AppCard>
        <AppCard>
          <h2 className="mb-3 font-bold">ملخص سريع</h2>
          <p className="text-sm text-muted-foreground">الفرع: {auth?.branch?.name ?? "-"}</p>
          <p className="mt-2 text-sm text-muted-foreground">الكاشير: {auth?.user.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">الحالة: {current ? "مفتوح" : "لا يوجد شيفت مفتوح"}</p>
        </AppCard>
      </div>
      <DataTable
        columns={["الكاشير", "الفرع", "الحالة", "الافتتاح", "الإغلاق", "المتوقع", "الفعلي", "الفرق"]}
        rows={shifts}
        renderRow={(shift) => (
          <tr key={shift.id} className="border-t border-border">
            <td className="px-4 py-3 font-semibold">{shift.cashier?.name ?? "-"}</td>
            <td className="px-4 py-3">{shift.branch?.name ?? "-"}</td>
            <td className="px-4 py-3"><StatusBadge label={shift.status === "OPEN" ? "مفتوح" : "مغلق"} tone={shift.status === "OPEN" ? "success" : "muted"} /></td>
            <td className="px-4 py-3">{formatDateTime(shift.openedAt)}</td>
            <td className="px-4 py-3">{formatDateTime(shift.closedAt)}</td>
            <td className="px-4 py-3">{shift.expectedCash == null ? "-" : formatMoney(shift.expectedCash)}</td>
            <td className="px-4 py-3">{shift.actualCash == null ? "-" : formatMoney(shift.actualCash)}</td>
            <td className="px-4 py-3">{shift.difference == null ? "-" : formatMoney(shift.difference)}</td>
          </tr>
        )}
      />
    </div>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}

function formatDateTime(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}
