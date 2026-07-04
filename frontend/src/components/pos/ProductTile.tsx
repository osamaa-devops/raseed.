import type { Product } from "../../types";

export function ProductTile({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      className="flex min-h-32 flex-col rounded-xl border border-border bg-card p-3 text-right transition hover:border-primary hover:shadow-sm"
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">ر</span>
      <span className="font-bold text-foreground">{product.name}</span>
      <span className="mt-auto text-sm text-muted-foreground">{product.price.toLocaleString("ar-EG")} ج</span>
    </button>
  );
}
