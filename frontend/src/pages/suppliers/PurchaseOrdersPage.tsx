import { ClipboardList } from "lucide-react";
import { PageTemplate } from "../PageTemplate";

export function PurchaseOrdersPage() {
  return <PageTemplate title="أوامر الشراء" description="طلبات الشراء من الموردين محفوظة كصفحة مستقلة." icon={ClipboardList} />;
}
