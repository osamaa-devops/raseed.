import { useEffect, useState } from "react";
import { Download, Eye, Printer, Receipt, RotateCcw } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { PrintButton } from "../../components/printing/PrintButton";
import { ReceiptPreview } from "../../components/printing/ReceiptPreview";
import { invoicesService } from "../../services/invoicesService";
import { importExportService } from "../../services/importExportService";
import type { Invoice, Payment, ReceiptPayload } from "../../types";

const paymentLabels: Record<Payment["method"], string> = {
  CASH: "نقدي",
  CARD: "بطاقة",
  WALLET: "محفظة",
};

export function SalesInvoicesPage() {
  const { hasPermission } = useAuth();
  const canCreateReturn = hasPermission("returns.create") || hasPermission("invoices.refund");
  const canPrintReceipts = hasPermission("printing.receipts") || hasPermission("invoices.print");
  const canExport = hasPermission("data.export");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<Payment["method"] | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [receiptPayload, setReceiptPayload] = useState<ReceiptPayload | null>(null);

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

  const openDetails = async (invoice: Invoice) => {
    setSelected(invoice);
    setReceiptPayload(null);
    if (!canPrintReceipts && !hasPermission("invoices.view")) return;
    try {
      setReceiptPayload(await invoicesService.getInvoiceReceipt(invoice.id));
    } catch (receiptError) {
      setError(receiptError instanceof Error ? receiptError.message : "تعذر تحميل إيصال الفاتورة");
    }
  };

  return (
    <div>
      <PageHeader title="المبيعات والفواتير" description="فواتير حقيقية ناتجة من شاشة الكاشير." actions={canExport ? <AppButton variant="outline" icon={Download} onClick={() => void importExportService.exportInvoices("xlsx", { paymentMethod, dateFrom, dateTo })}>تصدير</AppButton> : null} />
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
                  <AppButton variant="outline" icon={Eye} onClick={() => void openDetails(invoice)}>عرض</AppButton>
                  {canCreateReturn && invoice.status !== "REFUNDED" && <AppButton variant="ghost" icon={RotateCcw} onClick={() => goToReturn(invoice.invoiceNumber)}>مرتجع</AppButton>}
                  {canPrintReceipts && <AppButton variant="ghost" icon={Printer} onClick={() => void openDetails(invoice)}>طباعة</AppButton>}
                </div>
              </td>
            </tr>
          )}
        />
      )}
      <Modal open={Boolean(selected)} title="تفاصيل الفاتورة" onClose={() => { setSelected(null); setReceiptPayload(null); }}>
        {selected && (
          <div className="space-y-3 text-sm">
            {receiptPayload ? <ReceiptPreview payload={receiptPayload} /> : <div className="rounded-lg bg-muted p-3 font-bold">{selected.invoiceNumber}</div>}
            <div className="flex flex-wrap justify-end gap-2">
              {canCreateReturn && selected.status !== "REFUNDED" && <AppButton icon={RotateCcw} onClick={() => goToReturn(selected.invoiceNumber)}>إنشاء مرتجع</AppButton>}
              {canPrintReceipts && <PrintButton label="طباعة الإيصال" disabled={!receiptPayload} />}
            </div>
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
