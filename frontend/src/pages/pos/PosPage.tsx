import { useMemo, useState } from "react";
import { CreditCard, Printer, Trash2 } from "lucide-react";
import { ProductTile } from "../../components/pos/ProductTile";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { demoProducts } from "../../data/demo/demoProducts";
import type { Product } from "../../types";

type CartItem = { product: Product; quantity: number };

export function PosPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);

  const addProduct = (product: Product) => {
    setCart((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        return items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }

      return [...items, { product, quantity: 1 }];
    });
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] gap-4 p-4 lg:grid-cols-[1fr_420px]">
      <section>
        <div className="mb-4 rounded-xl border border-border bg-card p-3">
          <input className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-lg outline-none focus:border-primary" placeholder="ابحث بالاسم أو امسح الباركود" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          {demoProducts.map((product) => <ProductTile key={product.id} product={product} onAdd={addProduct} />)}
        </div>
      </section>
      <AppCard className="flex flex-col">
        <h1 className="mb-4 text-xl font-bold">الفاتورة الحالية</h1>
        <div className="flex-1 space-y-3">
          {cart.length === 0 && <p className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">لم يتم إضافة منتجات بعد</p>}
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-bold">{item.product.name}</p>
                <p className="text-sm text-muted-foreground">x{item.quantity}</p>
              </div>
              <p className="font-bold">{(item.product.price * item.quantity).toLocaleString("ar-EG")} ج</p>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-4 flex items-center justify-between text-xl font-bold">
            <span>الإجمالي</span>
            <span>{total.toLocaleString("ar-EG")} ج</span>
          </div>
          <div className="grid gap-2">
            <AppButton icon={CreditCard} disabled={cart.length === 0}>دفع تجريبي</AppButton>
            <AppButton variant="outline" icon={Printer} disabled={cart.length === 0}>طباعة</AppButton>
            <AppButton variant="ghost" icon={Trash2} onClick={() => setCart([])}>تفريغ السلة</AppButton>
          </div>
        </div>
      </AppCard>
    </div>
  );
}
