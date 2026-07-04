import { DataTable } from "../../components/tables/DataTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { demoActivityLogs } from "../../data/demo/demoUsers";

export function ActivityLogsPage() {
  return (
    <div>
      <PageHeader title="سجل النشاط" description="تتبع العمليات الحساسة لاحقًا من backend." />
      <DataTable
        columns={["المستخدم", "الإجراء", "الكيان", "الوقت"]}
        rows={demoActivityLogs}
        renderRow={(log) => (
          <tr key={log.id} className="border-t border-border hover:bg-table-row-hover">
            <td className="px-4 py-3 font-semibold">{log.userName}</td>
            <td className="px-4 py-3">{log.action}</td>
            <td className="px-4 py-3 text-muted-foreground">{log.entity}</td>
            <td className="px-4 py-3 text-muted-foreground">{log.createdAt}</td>
          </tr>
        )}
      />
    </div>
  );
}
