type Tone = "primary" | "success" | "warning" | "danger" | "info" | "muted";

export function StatusBadge({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    info: "bg-info/10 text-info border-info/20",
    muted: "bg-muted text-muted-foreground border-border",
  };

  return <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{label}</span>;
}
