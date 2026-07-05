import type { Product } from "../../types";

export function ProductTile({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      className="group flex min-h-40 flex-col rounded-2xl border border-border bg-card p-3 text-right transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">ر</span>
        <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">{product.unitType}</span>
      </div>
      <span className="line-clamp-2 font-bold text-foreground">{product.name}</span>
      <span className="mt-1 text-xs text-muted-foreground">{product.barcode ?? "بدون باركود"}</span>
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <span className="text-lg font-extrabold text-foreground">{product.sellingPrice.toLocaleString("ar-EG")} ج</span>
        <span className="text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">إضافة للسلة</span>
      </div>
    </button>
  );
}
