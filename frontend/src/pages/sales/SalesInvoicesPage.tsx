import { DataTable } from "../../components/tables/DataTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { demoInvoices } from "../../data/demo/demoSales";

export function SalesInvoicesPage() {
  return (
    <div>
      <PageHeader title="المبيعات والفواتير" description="عرض تجريبي للفواتير بدون تكامل API." />
      <DataTable
        columns={["رقم الفاتورة", "العميل", "الإجمالي", "الدفع", "الحالة"]}
        rows={demoInvoices}
        renderRow={(invoice) => (
          <tr key={invoice.id} className="border-t border-border hover:bg-table-row-hover">
            <td className="px-4 py-3 font-semibold">{invoice.invoiceNumber}</td>
            <td className="px-4 py-3 text-muted-foreground">{invoice.customerName ?? "عميل نقدي"}</td>
            <td className="px-4 py-3">{invoice.total} ج</td>
            <td className="px-4 py-3">{invoice.paymentMethod}</td>
            <td className="px-4 py-3"><StatusBadge label={invoice.status === "paid" ? "مدفوعة" : "مرتجعة"} tone={invoice.status === "paid" ? "success" : "warning"} /></td>
          </tr>
        )}
      />
    </div>
  );
}
