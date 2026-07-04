import { DataTable } from "../../components/tables/DataTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { demoSuppliers } from "../../data/demo/demoSuppliers";

export function SuppliersPage() {
  return (
    <div>
      <PageHeader title="الموردين" description="موردون تجريبيون لحين بناء CRUD الحقيقي." />
      <DataTable
        columns={["المورد", "الهاتف", "الرصيد"]}
        rows={demoSuppliers}
        renderRow={(supplier) => (
          <tr key={supplier.id} className="border-t border-border hover:bg-table-row-hover">
            <td className="px-4 py-3 font-semibold">{supplier.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{supplier.phone}</td>
            <td className="px-4 py-3">{supplier.balance} ج</td>
          </tr>
        )}
      />
    </div>
  );
}
