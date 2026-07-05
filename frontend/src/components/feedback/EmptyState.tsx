import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/80 p-8 text-center">
      <div className="mb-4 rounded-2xl bg-primary/8 p-4 text-primary">
        <Icon size={28} />
      </div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>
  );
}
