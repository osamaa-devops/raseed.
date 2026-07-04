import { AppCard } from "../ui/AppCard";
import { StatusBadge } from "../ui/StatusBadge";

export function KpiGrid({ items }: { items: Array<{ label: string; value: string; tone?: "primary" | "success" | "warning" | "danger" | "info" | "muted" }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <AppCard key={item.label}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
            </div>
            <StatusBadge label="اليوم" tone={item.tone ?? "muted"} />
          </div>
        </AppCard>
      ))}
    </div>
  );
}
