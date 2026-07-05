import type { ReactNode } from "react";

export function AppCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border/80 bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ${className}`}>{children}</section>;
}
