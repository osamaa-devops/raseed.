import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AppCard } from "../components/ui/AppCard";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { EmptyState } from "../components/feedback/EmptyState";

type PageTemplateProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  status?: string;
  children?: ReactNode;
};

export function PageTemplate({ title, description, icon: Icon, status = "واجهة محفوظة للتطوير القادم", children }: PageTemplateProps) {
  return (
    <div>
      <PageHeader title={title} description={description} actions={<StatusBadge label={status} tone="info" />} />
      {children ?? (
        <AppCard>
          <EmptyState icon={Icon} title={title} description="هذه الصفحة موجودة ضمن هيكل رصيد الجديد، وسيتم ربطها بالبيانات الحقيقية في مرحلة لاحقة." />
        </AppCard>
      )}
    </div>
  );
}
