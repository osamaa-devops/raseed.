import { Sparkles } from "lucide-react";

export function DemoModeBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning"
          : "mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning"
      }
    >
      <Sparkles size={compact ? 14 : 16} />
      <span className="font-semibold">وضع التشغيل المحلي</span>
      {!compact && <span className="text-warning/90">البيانات الحالية مهيأة للتشغيل المحلي السريع على جهاز المحل.</span>}
    </div>
  );
}
