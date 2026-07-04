import { CheckCircle } from "lucide-react";
import { PageTemplate } from "../PageTemplate";

export function EndOfDayClosingPage() {
  return <PageTemplate title="إغلاق اليوم" description="مراجعة المبيعات، المصاريف، النقدية، وإغلاق اليوم." icon={CheckCircle} />;
}
