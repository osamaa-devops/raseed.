import { Circle } from "lucide-react";

export function ConnectionPill({ isOnline, compact = false }: { isOnline: boolean; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
        isOnline ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
      } ${compact ? "px-2 py-1 text-[11px]" : ""}`}
      title={isOnline ? "متصل" : "غير متصل"}
    >
      <Circle size={9} className={`fill-current ${isOnline ? "text-success" : "text-warning"}`} />
      {isOnline ? "متصل" : "غير متصل"}
    </span>
  );
}
