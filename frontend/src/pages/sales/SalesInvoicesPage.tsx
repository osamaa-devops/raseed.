import { useEffect, useState } from "react";
import { Eye, Printer, Receipt, RotateCcw } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { invoicesService } from "../../services/invoicesService";
import type { Invoice, Payment } from "../../types";

const paymentLabels: Record<Payment["method"], string> = {
  CASH: "نقدي",
  CARD: "بطاقة",
  WALLET: "محفظة",
};

export function SalesInvoicesPage() {
  const { hasPermission } = useAuth();
  const canCreateReturn = hasPermission("returns.create") || hasPermission("invoices.refund");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<Payment["method"] | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const response = await invoicesService.getInvoices({ paymentMethod, dateFrom, dateTo, limit: 100 });
      setInvoices(response.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الفواتير");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <PageHeader title="المبيعات والفواتير" description="فواتير حقيقية ناتجة من شاشة الكاشير." />
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[180px_180px_180px_auto]">
        <TextInput label="من تاريخ" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        <TextInput label="إلى تاريخ" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        <SelectInput label="طريقة الدفع" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as Payment["method"] | "")}>
          <option value="">كل الطرق</option>
          <option value="CASH">نقدي</option>
          <option value="CARD">بطاقة</option>
          <option value="WALLET">محفظة</option>
        </SelectInput>
        <div className="flex items-end"><AppButton variant="outline" onClick={load}>تصفية</AppButton></div>
      </div>
      {invoices.length === 0 ? <EmptyState icon={Receipt} title="لا توجد فواتير" description="الفواتير ستظهر هنا بعد أول عملية بيع." /> : (
        <DataTable
          columns={["رقم الفاتورة", "التاريخ", "العميل", "الفرع", "الكاشير", "الإجمالي", "طريقة الدفع", "الحالة", "الإجراءات"]}
          rows={invoices}
          renderRow={(invoice) => (
            <tr key={invoice.id} className="border-t border-border hover:bg-table-row-hover">
              <td className="px-4 py-3 font-semibold">{invoice.invoiceNumber}</td>
              <td className="px-4 py-3">{formatDateTime(invoice.createdAt)}</td>
              <td className="px-4 py-3">{invoice.customer ? `${invoice.customer.name} - ${invoice.customer.phone}` : "-"}</td>
              <td className="px-4 py-3">{invoice.branch?.name ?? "-"}</td>
              <td className="px-4 py-3">{invoice.cashier?.name ?? "-"}</td>
              <td className="px-4 py-3">{formatMoney(invoice.total)}</td>
              <td className="px-4 py-3">{invoice.payments?.map((payment) => paymentLabels[payment.method]).join(" + ") ?? "-"}</td>
              <td className="px-4 py-3"><StatusBadge label={invoice.status === "PAID" ? "مدفوعة" : invoice.status} tone={invoice.status === "PAID" ? "success" : "warning"} /></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <AppButton variant="outline" icon={Eye} onClick={() => setSelected(invoice)}>عرض</AppButton>
                  {canCreateReturn && invoice.status !== "REFUNDED" && <AppButton variant="ghost" icon={RotateCcw} onClick={() => goToReturn(invoice.invoiceNumber)}>مرتجع</AppButton>}
                  <AppButton variant="ghost" icon={Printer} onClick={() => window.print()}>طباعة</AppButton>
                </div>
              </td>
            </tr>
          )}
        />
      )}
      <Modal open={Boolean(selected)} title="تفاصيل الفاتورة" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-muted p-3 font-bold">{selected.invoiceNumber}</div>
            {selected.customer && <div className="rounded-lg bg-muted p-3">العميل: {selected.customer.name} - {selected.customer.phone}</div>}
            {selected.items?.map((item) => (
              <div key={item.id} className="border-b border-border pb-2">
                <div className="flex justify-between">
                  <span>{item.productName} x{item.quantity}</span>
                  <span>{formatMoney(item.lineTotal)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">مرتجع: {item.returnedQuantity ?? 0} - متاح للإرجاع: {item.returnableQuantity ?? item.quantity}</p>
              </div>
            ))}
            <div className="flex justify-between"><span>الخصم</span><span>{formatMoney(selected.discountTotal)}</span></div>
            <div className="flex justify-between"><span>المدفوع</span><span>{formatMoney(selected.paidAmount)}</span></div>
            <div className="text-lg font-bold">الإجمالي: {formatMoney(selected.total)}</div>
            {canCreateReturn && selected.status !== "REFUNDED" && <AppButton icon={RotateCcw} onClick={() => goToReturn(selected.invoiceNumber)}>إنشاء مرتجع</AppButton>}
            <AppButton icon={Printer} onClick={() => window.print()}>طباعة</AppButton>
          </div>
        )}
      </Modal>
    </div>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}

function formatDateTime(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}

function goToReturn(invoiceNumber: string) {
  window.location.href = `/returns?invoice=${encodeURIComponent(invoiceNumber)}`;
}
