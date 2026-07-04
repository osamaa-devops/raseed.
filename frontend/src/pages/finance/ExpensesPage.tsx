import { DataTable } from "../../components/tables/DataTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { demoExpenses } from "../../data/demo/demoSales";

export function ExpensesPage() {
  return (
    <div>
      <PageHeader title="المصاريف" description="مصاريف تجريبية لحين تنفيذ الربط الحقيقي." />
      <DataTable
        columns={["البند", "التصنيف", "المبلغ", "التاريخ"]}
        rows={demoExpenses}
        renderRow={(expense) => (
          <tr key={expense.id} className="border-t border-border hover:bg-table-row-hover">
            <td className="px-4 py-3 font-semibold">{expense.title}</td>
            <td className="px-4 py-3 text-muted-foreground">{expense.category}</td>
            <td className="px-4 py-3">{expense.amount} ج</td>
            <td className="px-4 py-3 text-muted-foreground">{expense.date}</td>
          </tr>
        )}
      />
    </div>
  );
}
