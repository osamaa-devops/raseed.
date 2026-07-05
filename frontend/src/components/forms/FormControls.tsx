import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function TextInput({ label, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>}
      <input
        className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        {...props}
      />
    </label>
  );
}

export function SelectInput({ label, children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>}
      <select
        className="w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
