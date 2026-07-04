import { useEffect, useMemo, useState } from "react";
import { CreditCard, Minus, Pause, Plus, Printer, RotateCcw, Search, Trash2, Wallet } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { ProductTile } from "../../components/pos/ProductTile";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { posService } from "../../services/posService";
import { customersService } from "../../services/customersService";
import { productsService } from "../../services/productsService";
import { shiftsService } from "../../services/shiftsService";
import type { CashierShift, Customer, HeldOrder, Invoice, Payment, Product } from "../../types";

type CartItem = { product: Product; quantity: number; discount: number };

export function PosPage() {
  const { auth, hasPermission } = useAuth();
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? "";
  const canSell = hasPermission("pos.sell");
  const canHold = hasPermission("pos.hold_order");
  const canReturn = hasPermission("returns.create") || hasPermission("invoices.refund");
  const canViewCustomers = hasPermission("customers.view");
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [shift, setShift] = useState<CashierShift | null>(null);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<Payment["method"]>("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0), [cart]);
  const itemDiscount = useMemo(() => cart.reduce((sum, item) => sum + item.discount, 0), [cart]);
  const total = Math.max(0, subtotal - itemDiscount - invoiceDiscount);
  const paid = amountPaid ? Number(amountPaid) : total;
  const change = Math.max(0, paid - total);

  const load = async () => {
    if (!branchId) return;
    setError(null);
    try {
      const [productResponse, currentShift, held, recent] = await Promise.all([
        productsService.getProducts({ search: query, status: "ACTIVE", limit: 100 }),
        shiftsService.getCurrentShift(branchId),
        canHold ? posService.getHeldOrders(branchId) : Promise.resolve([]),
        posService.getRecentInvoices(branchId),
      ]);
      setProducts(productResponse.items);
      setShift(currentShift);
      setHeldOrders(held);
      setRecentInvoices(recent);
      if (canViewCustomers) {
        const customerResponse = await customersService.getCustomers({ search: customerQuery, status: "ACTIVE", limit: 8 });
        setCustomers(customerResponse.items);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل بيانات الكاشير");
    }
  };

  useEffect(() => {
    void load();
  }, [branchId]);

  const addProduct = (product: Product) => {
    setCart((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) return items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...items, { product, quantity: 1, discount: 0 }];
    });
  };

  const completeSale = async () => {
    if (!branchId || cart.length === 0) return;
    if (!shift) {
      setError("يجب فتح شيفت قبل إتمام البيع.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await posService.createSale({
        branchId,
        shiftId: shift.id,
        customerId: selectedCustomer?.id,
        items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity, unitPrice: item.product.sellingPrice, discount: item.discount })),
        payments: [{ method: paymentMethod, amount: paid }],
        invoiceDiscount,
      });
      setInvoice(created);
      setCart([]);
      setInvoiceDiscount(0);
      setSelectedCustomer(null);
      setAmountPaid("");
      setNotice("تم إتمام البيع وتحديث المخزون");
      await load();
    } catch (saleError) {
      setError(saleError instanceof Error ? saleError.message : "تعذر إتمام البيع");
    } finally {
      setSaving(false);
    }
  };

  const holdOrder = async () => {
    if (!branchId || cart.length === 0) return;
    await posService.createHeldOrder({
      branchId,
      data: { items: cart.map((item) => ({ productId: item.product.id, name: item.product.name, quantity: item.quantity, discount: item.discount, price: item.product.sellingPrice })) },
      note: `طلب معلق ${new Date().toLocaleTimeString("ar-EG")}`,
    });
    setCart([]);
    setNotice("تم حفظ الطلب المعلق");
    await load();
  };

  const loadHeldOrder = (heldOrder: HeldOrder) => {
    const data = heldOrder.data as { items?: Array<{ productId: string; quantity: number; discount?: number }> };
    const next = (data.items ?? []).map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return product ? { product, quantity: item.quantity, discount: item.discount ?? 0 } : null;
    }).filter(Boolean) as CartItem[];
    setCart(next);
  };

  if (!hasPermission("pos.access")) {
    return <EmptyState icon={CreditCard} title="لا تملك صلاحية POS" description="تواصل مع مدير المتجر لتفعيل صلاحية الكاشير." />;
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] gap-4 p-4 lg:grid-cols-[1fr_430px]">
      <section>
        <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-3 md:grid-cols-[1fr_auto]">
          <TextInput className="text-lg" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو الباركود أو SKU" />
          <AppButton icon={Search} variant="outline" onClick={load}>بحث</AppButton>
        </div>
        {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
        {notice && <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{notice}</p>}
        <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="rounded-lg bg-muted px-3 py-2">الكاشير: {auth?.user.name}</span>
          <span className="rounded-lg bg-muted px-3 py-2">الفرع: {auth?.branch?.name ?? "-"}</span>
          <span className={`rounded-lg px-3 py-2 ${shift ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{shift ? "الشيفت مفتوح" : "لا يوجد شيفت مفتوح"}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => <ProductTile key={product.id} product={product} onAdd={addProduct} />)}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <AppCard>
            <h2 className="mb-3 font-bold">طلبات معلقة</h2>
            {heldOrders.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد طلبات معلقة</p> : heldOrders.map((held) => (
              <div key={held.id} className="mb-2 flex items-center justify-between rounded-lg bg-muted p-2">
                <button className="text-sm font-semibold" onClick={() => loadHeldOrder(held)}>{held.note ?? "طلب معلق"}</button>
                <AppButton variant="ghost" onClick={() => void posService.deleteHeldOrder(held.id).then(load)}>حذف</AppButton>
              </div>
            ))}
          </AppCard>
          <AppCard>
            <h2 className="mb-3 font-bold">آخر الفواتير</h2>
            {recentInvoices.slice(0, 4).map((recent) => (
              <div key={recent.id} className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-muted p-2 text-sm">
                <div className="grid">
                  <span>{recent.invoiceNumber}</span>
                  {recent.customer && <span className="text-xs text-muted-foreground">{recent.customer.name}</span>}
                  <span>{formatMoney(recent.total)}</span>
                </div>
                {canReturn && recent.status !== "REFUNDED" && <AppButton variant="ghost" icon={RotateCcw} onClick={() => goToReturn(recent.invoiceNumber)}>مرتجع</AppButton>}
              </div>
            ))}
          </AppCard>
        </div>
      </section>

      <AppCard className="flex flex-col">
        <h1 className="mb-4 text-xl font-bold">الفاتورة الحالية</h1>
        <div className="flex-1 space-y-3">
          {cart.length === 0 && <p className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">لم يتم إضافة منتجات بعد</p>}
          {cart.map((item) => (
            <div key={item.product.id} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-bold">{item.product.name}</p>
                <button onClick={() => setCart((items) => items.filter((row) => row.product.id !== item.product.id))}><Trash2 size={16} /></button>
              </div>
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <AppButton variant="outline" icon={Minus} onClick={() => setCart((items) => items.map((row) => row.product.id === item.product.id ? { ...row, quantity: Math.max(1, row.quantity - 1) } : row))}>-</AppButton>
                <span className="text-center font-bold">{item.quantity}</span>
                <AppButton variant="outline" icon={Plus} onClick={() => setCart((items) => items.map((row) => row.product.id === item.product.id ? { ...row, quantity: row.quantity + 1 } : row))}>+</AppButton>
              </div>
              <TextInput className="mt-2" label="خصم الصنف" type="number" value={item.discount} onChange={(event) => setCart((items) => items.map((row) => row.product.id === item.product.id ? { ...row, discount: Number(event.target.value) } : row))} />
              <p className="mt-2 text-left font-bold">{formatMoney(item.product.sellingPrice * item.quantity - item.discount)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <TextInput label="خصم الفاتورة" type="number" value={invoiceDiscount} onChange={(event) => setInvoiceDiscount(Number(event.target.value))} />
          <SelectInput className="mt-3" label="طريقة الدفع" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as Payment["method"])}>
            <option value="CASH">نقدي</option>
            <option value="CARD">بطاقة</option>
            <option value="WALLET">محفظة</option>
          </SelectInput>
          <TextInput className="mt-3" label="المبلغ المدفوع" type="number" value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} />
          {canViewCustomers && (
            <div className="mt-3 rounded-lg border border-border p-3">
              <TextInput label="عميل اختياري" placeholder="بحث بالاسم أو الهاتف" value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} onBlur={load} />
              {selectedCustomer ? (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-muted p-2 text-sm">
                  <span>{selectedCustomer.name} - {selectedCustomer.phone}</span>
                  <button className="font-semibold text-primary" onClick={() => setSelectedCustomer(null)}>إزالة</button>
                </div>
              ) : (
                <div className="mt-2 grid gap-2">
                  {customers.map((customer) => (
                    <button key={customer.id} className="rounded-lg bg-muted p-2 text-right text-sm hover:bg-primary/10" onClick={() => setSelectedCustomer(customer)}>
                      {customer.name} - {customer.phone}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">البيع الائتماني مؤجل؛ يجب تغطية إجمالي الفاتورة بالمدفوعات.</p>
            </div>
          )}
          <div className="my-4 space-y-2 text-lg font-bold">
            <div className="flex justify-between"><span>الإجمالي</span><span>{formatMoney(total)}</span></div>
            <div className="flex justify-between text-success"><span>الباقي</span><span>{formatMoney(change)}</span></div>
          </div>
          <div className="grid gap-2">
            <AppButton icon={paymentMethod === "CASH" ? CreditCard : Wallet} disabled={!canSell || saving || cart.length === 0} onClick={completeSale}>{saving ? "جار الإتمام..." : "إتمام البيع"}</AppButton>
            {canHold && <AppButton variant="outline" icon={Pause} disabled={cart.length === 0} onClick={holdOrder}>تعليق الطلب</AppButton>}
            <AppButton variant="ghost" icon={Trash2} onClick={() => setCart([])}>تفريغ السلة</AppButton>
          </div>
        </div>
      </AppCard>

      <Modal open={Boolean(invoice)} title="تم إنشاء الفاتورة" onClose={() => setInvoice(null)}>
        {invoice && (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-muted p-3"><b>{invoice.invoiceNumber}</b></div>
            {invoice.customer && <div className="rounded-lg bg-muted p-3">العميل: {invoice.customer.name} - {invoice.customer.phone}</div>}
            {invoice.items?.map((item) => <div key={item.id} className="flex justify-between"><span>{item.productName} x{item.quantity}</span><span>{formatMoney(item.lineTotal)}</span></div>)}
            <div className="border-t border-border pt-3 text-lg font-bold">الإجمالي: {formatMoney(invoice.total)}</div>
            <AppButton icon={Printer} onClick={() => window.print()}>طباعة</AppButton>
          </div>
        )}
      </Modal>
    </div>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}

function goToReturn(invoiceNumber: string) {
  window.location.href = `/returns?invoice=${encodeURIComponent(invoiceNumber)}`;
}
