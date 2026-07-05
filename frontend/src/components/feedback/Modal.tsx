import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ open, title, children, onClose, size = "md" }: { open: boolean; title: string; children: ReactNode; onClose: () => void; size?: "md" | "lg" | "xl" }) {
  if (!open) return null;

  const sizeClassName = size === "xl" ? "max-w-5xl" : size === "lg" ? "max-w-3xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <section className={`w-full ${sizeClassName} overflow-hidden rounded-[1.4rem] border border-border bg-modal shadow-2xl`}>
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-bold text-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X size={16} />
          </button>
        </header>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}
