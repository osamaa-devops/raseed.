import { useEffect, useMemo, useState } from "react";
import { Eye, RotateCcw, Search } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { invoicesService } from "../../services/invoicesService";
import { returnsService } from "../../services/returnsService";
import type { Invoice, Payment, Return } from "../../types";

const paymentLabels: Record<Payment["method"], string> = {
  CASH: "نقدي",
  CARD: "بطاقة",
  INSTAPAY: "إنستا باي",
  WALLET: "محفظة",
};

type ReturnLineState = Record<string, { quantity: number; restocked: boolean }>;

export function ReturnsRefundsPage() {
  const { auth, hasPermission } = useAuth();
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? "";
  const canView = hasPermission("returns.view");
  const canCreate = hasPermission("returns.create") || hasPermission("invoices.refund");
  const initialInvoiceNumber = new URLSearchParams(window.location.search).get("invoice") ?? "";
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoiceNumber);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lines, setLines] = useState<ReturnLineState>({});
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<Payment["method"]>("CASH");
  const [returns, setReturns] = useState<Return[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedItems = useMemo(() => {
    if (!invoice?.items) return [];
    return invoice.items
      .map((item) => ({ item, state: lines[item.id] ?? { quantity: 0, restocked: true } }))
      .filter(({ state }) => state.quantity > 0);
  }, [invoice, lines]);

  const refundTotal = selectedItems.reduce((sum, { item, state }) => {
    const netUnit = item.quantity > 0 ? item.lineTotal / item.quantity : item.unitPrice;
    return sum + netUnit * state.quantity;
  }, 0);

  const loadReturns = async () => {
    if (!canView) return;
    const response = await returnsService.getReturns({ branchId, limit: 100 });
    setReturns(response.items);
  };

  useEffect(() => {
    void loadReturns();
    if (initialInvoiceNumber) void searchInvoice();
  }, [branchId]);

  const searchInvoice = async () => {
    setError(null);
    setNotice(null);
    try {
      const found = await invoicesService.getInvoiceByNumber(invoiceNumber.trim());
      setInvoice(found);
      const nextLines: ReturnLineState = {};
      found.items?.forEach((item) => {
        nextLines[item.id] = { quantity: 0, restocked: true };
      });
      setLines(nextLines);
    } catch (searchError) {
      setInvoice(null);
      setError(searchError instanceof Error ? searchError.message : "تعذر العثور على الفاتورة");
    }
  };

  const submitReturn = async () => {
    if (!invoice || !branchId) return;
    if (selectedItems.length === 0) {
      setError("اختر صنفًا واحدًا على الأقل للمرتجع.");
      return;
    }
    if (!reason.trim()) {
      setError("سبب المرتجع مطلوب.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await returnsService.createReturn({
        branchId,
        invoiceId: invoice.id,
        reason,
        refundMethod,
        items: selectedItems.map(({ item, state }) => ({ invoiceItemId: item.id, quantity: state.quantity, restocked: state.restocked })),
      });
      setNotice(`تم إنشاء المرتجع ${created.returnNumber}`);
      setReason("");
      await Promise.all([loadReturns(), searchInvoice()]);
    } catch (returnError) {
      setError(returnError instanceof Error ? returnError.message : "تعذر إنشاء المرتجع");
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return <EmptyState icon={RotateCcw} title="لا تملك صلاحية المرتجعات" description="تواصل مع مدير المتجر لتحديث الصلاحيات." />;
  }

  return (
    <div>
      <PageHeader title="المرتجعات" description="إنشاء مرتجعات آمنة مرتبطة بالفواتير وتحديث المخزون عند إعادة التخزين." />
      {notice && <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{notice}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <TextInput label="رقم الفاتورة" value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="INV-20260704-00001" />
          <div className="flex items-end"><AppButton icon={Search} onClick={searchInvoice}>بحث</AppButton></div>
        </div>
      </div>

      {invoice && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">{invoice.invoiceNumber}</h2>
              <p className="text-sm text-muted-foreground">الإجمالي: {formatMoney(invoice.total)} - الحالة: {invoice.status}</p>
            </div>
            <StatusBadge label={invoice.status === "PAID" ? "مدفوعة" : invoice.status === "PARTIALLY_REFUNDED" ? "مرتجع جزئي" : "مرتجعة"} tone={invoice.status === "REFUNDED" ? "warning" : "success"} />
          </div>
          <DataTable
            columns={["الصنف", "المباع", "المرتجع", "المتاح", "سعر الوحدة", "كمية المرتجع", "إعادة للمخزون"]}
            rows={invoice.items ?? []}
            renderRow={(item) => {
              const state = lines[item.id] ?? { quantity: 0, restocked: true };
              return (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">{item.productName}</td>
                  <td className="px-4 py-3">{formatNumber(item.quantity)}</td>
                  <td className="px-4 py-3">{formatNumber(item.returnedQuantity ?? 0)}</td>
                  <td className="px-4 py-3">{formatNumber(item.returnableQuantity ?? item.quantity)}</td>
                  <td className="px-4 py-3">{formatMoney(item.unitPrice)}</td>
                  <td className="px-4 py-3">
                    <input
                      className="w-24 rounded-lg border border-border bg-input-background px-2 py-1"
                      type="number"
                      min="0"
                      step="0.001"
                      max={item.returnableQuantity}
                      value={state.quantity}
                      disabled={!canCreate || (item.returnableQuantity ?? 0) <= 0}
                      onChange={(event) => setLines((current) => ({ ...current, [item.id]: { ...state, quantity: Number(event.target.value) } }))}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={state.restocked}
                      disabled={!canCreate}
                      onChange={(event) => setLines((current) => ({ ...current, [item.id]: { ...state, restocked: event.target.checked } }))}
                    />
                  </td>
                </tr>
              );
            }}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_180px]">
            <TextInput label="سبب المرتجع" value={reason} onChange={(event) => setReason(event.target.value)} />
            <SelectInput label="طريقة الاسترداد" value={refundMethod} onChange={(event) => setRefundMethod(event.target.value as Payment["method"])}>
              <option value="CASH">نقدي</option>
              <option value="CARD">بطاقة</option>
              <option value="WALLET">محفظة</option>
            </SelectInput>
            <div className="flex flex-col justify-end">
              <p className="mb-2 text-sm font-bold">إجمالي الاسترداد: {formatMoney(refundTotal)}</p>
              <AppButton disabled={!canCreate || saving} onClick={submitReturn}>{saving ? "جار الحفظ..." : "إنشاء مرتجع"}</AppButton>
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={["رقم المرتجع", "رقم الفاتورة", "التاريخ", "الفرع", "الكاشير", "السبب", "الإجمالي", "الطريقة", "الحالة", ""]}
        rows={returns}
        renderRow={(returnRecord) => (
          <tr key={returnRecord.id} className="border-t border-border hover:bg-table-row-hover">
            <td className="px-4 py-3 font-semibold">{returnRecord.returnNumber}</td>
            <td className="px-4 py-3">{returnRecord.invoice?.invoiceNumber ?? "-"}</td>
            <td className="px-4 py-3">{formatDateTime(returnRecord.createdAt)}</td>
            <td className="px-4 py-3">{returnRecord.branch?.name ?? "-"}</td>
            <td className="px-4 py-3">{returnRecord.cashier?.name ?? "-"}</td>
            <td className="px-4 py-3">{returnRecord.reason}</td>
            <td className="px-4 py-3">{formatMoney(returnRecord.refundTotal)}</td>
            <td className="px-4 py-3">{paymentLabels[returnRecord.refundMethod]}</td>
            <td className="px-4 py-3"><StatusBadge label={returnRecord.status === "COMPLETED" ? "مكتمل" : "ملغي"} tone={returnRecord.status === "COMPLETED" ? "success" : "muted"} /></td>
            <td className="px-4 py-3"><AppButton variant="ghost" icon={Eye} onClick={() => setSelectedReturn(returnRecord)}>عرض</AppButton></td>
          </tr>
        )}
      />

      <Modal open={Boolean(selectedReturn)} title="تفاصيل المرتجع" onClose={() => setSelectedReturn(null)}>
        {selectedReturn && (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-muted p-3 font-bold">{selectedReturn.returnNumber}</div>
            {selectedReturn.items.map((item) => (
              <div key={item.id} className="flex justify-between border-b border-border pb-2">
                <span>{item.productName} x{formatNumber(item.quantity)}</span>
                <span>{formatMoney(item.refundAmount)}</span>
              </div>
            ))}
            <div className="text-lg font-bold">الإجمالي: {formatMoney(selectedReturn.refundTotal)}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}

function formatNumber(value: number) {
  return value.toLocaleString("ar-EG", { maximumFractionDigits: 3 });
}

function formatDateTime(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}
