import { DataTable } from "../../components/tables/DataTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { demoUsers } from "../../data/demo/demoUsers";

export function UsersPermissionsPage() {
  return (
    <div>
      <PageHeader title="المستخدمين والصلاحيات" description="عرض المستخدمين فقط، بدون Auth أو RBAC حقيقي الآن." />
      <DataTable
        columns={["الاسم", "الدور", "الهاتف", "الحالة"]}
        rows={demoUsers}
        renderRow={(user) => (
          <tr key={user.id} className="border-t border-border hover:bg-table-row-hover">
            <td className="px-4 py-3 font-semibold">{user.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{user.role}</td>
            <td className="px-4 py-3">{user.phone}</td>
            <td className="px-4 py-3"><StatusBadge label="نشط" tone="success" /></td>
          </tr>
        )}
      />
    </div>
  );
}
