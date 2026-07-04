import { DataTable } from "../../components/tables/DataTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { demoCustomers } from "../../data/demo/demoSuppliers";

export function CustomersDebtsPage() {
  return (
    <div>
      <PageHeader title="العملاء والديون" description="متابعة العملاء والديون كنموذج عرض." />
      <DataTable
        columns={["العميل", "الهاتف", "الدين", "النقاط", "الحالة"]}
        rows={demoCustomers}
        renderRow={(customer) => (
          <tr key={customer.id} className="border-t border-border hover:bg-table-row-hover">
            <td className="px-4 py-3 font-semibold">{customer.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{customer.phone}</td>
            <td className="px-4 py-3">{customer.debt} ج</td>
            <td className="px-4 py-3">{customer.points}</td>
            <td className="px-4 py-3"><StatusBadge label={customer.debt > 0 ? "عليه دين" : "صافي"} tone={customer.debt > 0 ? "warning" : "success"} /></td>
          </tr>
        )}
      />
    </div>
  );
}
