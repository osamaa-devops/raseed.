import type { Product } from "../../types";

export function ProductTile({ product, stockQuantity, onAdd }: { product: Product; stockQuantity?: number | null; onAdd: (product: Product) => void }) {
  const isAvailable = (stockQuantity ?? 0) > 0;
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={!isAvailable}
      className="group flex min-h-40 flex-col rounded-2xl border border-border bg-card p-3 text-right transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">ر</span>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">{product.unitType}</span>
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${isAvailable ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            {isAvailable ? `متاح ${stockQuantity?.toLocaleString("ar-EG") ?? 0}` : "غير متوفر"}
          </span>
        </div>
      </div>
      <span className="line-clamp-2 font-bold text-foreground">{product.name}</span>
      <span className="mt-1 text-xs text-muted-foreground">{product.barcode ?? "بدون باركود"}</span>
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <span className="text-lg font-extrabold text-foreground">{product.sellingPrice.toLocaleString("ar-EG")} ج</span>
        <span className="text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">{isAvailable ? "إضافة للسلة" : "نفد المخزون"}</span>
      </div>
    </button>
  );
}
