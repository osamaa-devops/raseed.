import { useEffect, useMemo, useState } from "react";
import { CreditCard, Keyboard, Minus, Pause, Plus, Printer, RotateCcw, ScanLine, Search, Trash2, Wallet } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { DemoModeBanner } from "../../components/demo/DemoModeBanner";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { ProductTile } from "../../components/pos/ProductTile";
import { PrintButton } from "../../components/printing/PrintButton";
import { ReceiptPreview } from "../../components/printing/ReceiptPreview";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { posService } from "../../services/posService";
import { customersService } from "../../services/customersService";
import { inventoryService } from "../../services/inventoryService";
import { productsService } from "../../services/productsService";
import { shiftsService } from "../../services/shiftsService";
import { receiptService } from "../../services/receiptService";
import type { CashierShift, Customer, HeldOrder, Invoice, Payment, Product, ReceiptPayload } from "../../types";
import { isDemoStore } from "../../utils/demo";

type CartItem = { product: Product; quantity: number; discount: number };

export function PosPage() {
  const { auth, hasPermission } = useAuth();
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? "";
  const canSell = hasPermission("pos.sell");
  const canHold = hasPermission("pos.hold_order");
  const canReturn = hasPermission("returns.create") || hasPermission("invoices.refund");
  const canPrintReceipts = hasPermission("printing.receipts") || hasPermission("invoices.print");
  const canViewCustomers = hasPermission("customers.view");
  const demoMode = isDemoStore(auth?.store);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockByProductId, setStockByProductId] = useState<Record<string, number>>({});
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
  const [receiptPayload, setReceiptPayload] = useState<ReceiptPayload | null>(null);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0), [cart]);
  const itemDiscount = useMemo(() => cart.reduce((sum, item) => sum + item.discount, 0), [cart]);
  const total = Math.max(0, subtotal - itemDiscount - invoiceDiscount);
  const paid = amountPaid ? Number(amountPaid) : total;
  const change = Math.max(0, paid - total);

  const load = async () => {
    if (!branchId) return;
    setError(null);
    try {
      const [productResponse, currentShift, held, recent, customerResponse, stockResponse] = await Promise.all([
        productsService.getProducts({ search: query, status: "ACTIVE", limit: 100 }),
        shiftsService.getCurrentShift(branchId),
        canHold ? posService.getHeldOrders(branchId) : Promise.resolve([]),
        posService.getRecentInvoices(branchId),
        canViewCustomers ? customersService.getCustomers({ search: customerQuery, status: "ACTIVE", limit: 8 }) : Promise.resolve({ items: [] }),
        inventoryService.getInventoryStocks({ branchId, limit: 100 }),
      ]);
      setProducts(productResponse.items);
      setShift(currentShift);
      setHeldOrders(held);
      setRecentInvoices(recent);
      setCustomers(customerResponse.items);
      setStockByProductId(Object.fromEntries(stockResponse.items.map((stock) => [stock.productId, Number(stock.quantity)])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل بيانات الكاشير");
    }
  };

  useEffect(() => {
    void load();
  }, [branchId]);

  useEffect(() => {
    if (!canViewCustomers || !branchId) return;
    const timeoutId = window.setTimeout(() => {
      void customersService
        .getCustomers({ search: customerQuery, status: "ACTIVE", limit: 8 })
        .then((response) => setCustomers(response.items))
        .catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [branchId, canViewCustomers, customerQuery]);

  const addProduct = (product: Product) => {
    if ((stockByProductId[product.id] ?? 0) <= 0) {
      setError(`المنتج ${product.name} غير متوفر في هذا الفرع.`);
      return;
    }
    setCart((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) return items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...items, { product, quantity: 1, discount: 0 }];
    });
  };

  const searchHint = query.trim() ? `نتائج البحث: ${products.length}` : "امسح الباركود أو اكتب اسم المنتج ثم اضغط Enter";

  const submitSearch = async () => {
    const normalizedQuery = query.trim();
    const exactMatch = normalizedQuery
      ? products.find((product) => product.barcode === normalizedQuery || product.sku === normalizedQuery || product.name === normalizedQuery)
      : null;

    if (exactMatch) {
      addProduct(exactMatch);
      setNotice(`تمت إضافة ${exactMatch.name} إلى السلة`);
      setQuery("");
      return;
    }

    await load();
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
      setReceiptPayload(await receiptService.getInvoiceReceipt(created.id));
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

  const openReceipt = async (targetInvoice: Invoice) => {
    setError(null);
    try {
      setInvoice(targetInvoice);
      setReceiptPayload(await receiptService.getInvoiceReceipt(targetInvoice.id));
    } catch (receiptError) {
      setError(receiptError instanceof Error ? receiptError.message : "تعذر تحميل إيصال الفاتورة");
    }
  };

  const closeReceipt = () => {
    setInvoice(null);
    setReceiptPayload(null);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!hasPermission("pos.access")) {
    return <EmptyState icon={CreditCard} title="لا تملك صلاحية POS" description="تواصل مع مدير المتجر لتفعيل صلاحية الكاشير." />;
  }

  return (
    <div className="grid min-h-[calc(100vh-5rem)] gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_460px]">
      <section>
        {demoMode && <DemoModeBanner />}
        <AppCard className="mb-4 overflow-hidden bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(37,99,235,0.08),rgba(245,158,11,0.06))]">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-2 text-sm font-semibold text-primary">بحث سريع للباركود والمنتجات</p>
              <div className="relative">
                <ScanLine className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input
                  className="h-16 w-full rounded-2xl border border-primary/20 bg-background/90 pr-12 pl-4 text-lg font-semibold text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void submitSearch();
                    }
                  }}
                  placeholder="امسح الباركود أو اكتب اسم المنتج"
                  autoFocus
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-3 py-1.5"><Keyboard size={14} /> Enter يضيف المنتج بسرعة</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-3 py-1.5"><ScanLine size={14} /> مناسب لقارئ الباركود</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-3 py-1.5">{searchHint}</span>
              </div>
            </div>
            <div className="grid gap-2 lg:min-w-42">
              <AppButton icon={Search} className="h-16" onClick={() => void submitSearch()}>بحث وإضافة</AppButton>
              <AppButton variant="outline" className="h-12" onClick={() => void load()}>تحديث البيانات</AppButton>
            </div>
          </div>
        </AppCard>
        <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <AppCard className="p-4">
            <p className="text-xs text-muted-foreground">السلة الحالية</p>
            <p className="mt-2 text-3xl font-extrabold">{totalItems.toLocaleString("ar-EG")}</p>
            <p className="mt-1 text-xs text-muted-foreground">عدد الوحدات</p>
          </AppCard>
          <AppCard className="p-4">
            <p className="text-xs text-muted-foreground">إجمالي الفاتورة</p>
            <p className="mt-2 text-3xl font-extrabold">{formatMoney(total)}</p>
            <p className="mt-1 text-xs text-muted-foreground">بعد الخصومات</p>
          </AppCard>
          <AppCard className="p-4">
            <p className="text-xs text-muted-foreground">العميل</p>
            <p className="mt-2 text-lg font-bold">{selectedCustomer?.name ?? "بيع مباشر"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{selectedCustomer?.phone ?? "بدون ربط عميل"}</p>
          </AppCard>
          <AppCard className="p-4">
            <p className="text-xs text-muted-foreground">حالة الشيفت</p>
            <p className={`mt-2 text-lg font-bold ${shift ? "text-success" : "text-warning"}`}>{shift ? "مفتوح" : "غير مفتوح"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{auth?.branch?.name ?? "-"}</p>
          </AppCard>
        </div>
        {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
        {notice && <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{notice}</p>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => <ProductTile key={product.id} product={product} stockQuantity={stockByProductId[product.id] ?? 0} onAdd={addProduct} />)}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <AppCard>
            <h2 className="mb-3 font-bold">طلبات معلقة</h2>
            {heldOrders.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد طلبات معلقة</p> : heldOrders.map((held) => (
              <div key={held.id} className="mb-2 flex items-center justify-between rounded-xl bg-muted p-2">
                <button className="text-sm font-semibold" onClick={() => loadHeldOrder(held)}>{held.note ?? "طلب معلق"}</button>
                <AppButton variant="ghost" onClick={() => void posService.deleteHeldOrder(held.id).then(load)}>حذف</AppButton>
              </div>
            ))}
          </AppCard>
          <AppCard>
            <h2 className="mb-3 font-bold">آخر الفواتير</h2>
            {recentInvoices.slice(0, 4).map((recent) => (
              <div key={recent.id} className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-muted p-2 text-sm">
                <div className="grid">
                  <span>{recent.invoiceNumber}</span>
                  {recent.customer && <span className="text-xs text-muted-foreground">{recent.customer.name}</span>}
                  <span>{formatMoney(recent.total)}</span>
                </div>
                {canReturn && recent.status !== "REFUNDED" && <AppButton variant="ghost" icon={RotateCcw} onClick={() => goToReturn(recent.invoiceNumber)}>مرتجع</AppButton>}
                {canPrintReceipts && <AppButton variant="ghost" icon={Printer} onClick={() => void openReceipt(recent)}>طباعة</AppButton>}
              </div>
            ))}
          </AppCard>
        </div>
      </section>

      <AppCard className="flex flex-col xl:sticky xl:top-24">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">الفاتورة الحالية</h1>
            <p className="mt-1 text-xs text-muted-foreground">اضغط على المنتج مرة واحدة لإضافته، ثم راجع الإجمالي قبل إتمام البيع.</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{totalItems.toLocaleString("ar-EG")} صنف</span>
        </div>
        <div className="flex-1 space-y-3">
          {cart.length === 0 && <p className="rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">ابدأ بمسح الباركود أو اختر منتجًا من الشبكة لإضافة أول صنف.</p>}
          {cart.map((item) => (
            <div key={item.product.id} className="rounded-2xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-bold">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product.barcode ?? item.product.sku ?? "بدون كود"}</p>
                </div>
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-danger" onClick={() => setCart((items) => items.filter((row) => row.product.id !== item.product.id))}><Trash2 size={16} /></button>
              </div>
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <AppButton variant="outline" icon={Minus} className="min-h-12 min-w-12 px-0" onClick={() => setCart((items) => items.map((row) => row.product.id === item.product.id ? { ...row, quantity: Math.max(1, row.quantity - 1) } : row))}>-</AppButton>
                <span className="text-center text-lg font-bold">{item.quantity}</span>
                <AppButton variant="outline" icon={Plus} className="min-h-12 min-w-12 px-0" onClick={() => setCart((items) => items.map((row) => row.product.id === item.product.id ? { ...row, quantity: row.quantity + 1 } : row))}>+</AppButton>
              </div>
              <TextInput className="mt-2" label="خصم الصنف" type="number" value={item.discount} onChange={(event) => setCart((items) => items.map((row) => row.product.id === item.product.id ? { ...row, discount: Number(event.target.value) } : row))} />
              <p className="mt-2 text-left text-lg font-extrabold">{formatMoney(item.product.sellingPrice * item.quantity - item.discount)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <div className="rounded-2xl border border-border bg-muted/35 p-4">
            <p className="text-xs font-semibold text-muted-foreground">إجمالي الفاتورة</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">{formatMoney(total)}</p>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">المجموع قبل الخصم</span><span className="font-semibold">{formatMoney(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">خصومات الأصناف</span><span className="font-semibold">{formatMoney(itemDiscount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">خصم الفاتورة</span><span className="font-semibold">{formatMoney(invoiceDiscount)}</span></div>
              <div className="flex justify-between text-success"><span>الباقي للعميل</span><span className="font-bold">{formatMoney(change)}</span></div>
            </div>
          </div>

          <TextInput className="mt-3" label="خصم الفاتورة" type="number" value={invoiceDiscount} onChange={(event) => setInvoiceDiscount(Number(event.target.value))} />
          <div className="mt-3">
            <span className="mb-2 block text-sm font-semibold text-foreground">طريقة الدفع</span>
            <div className="grid grid-cols-3 gap-2">
              <AppButton variant={paymentMethod === "CASH" ? "primary" : "outline"} className="w-full" icon={Wallet} onClick={() => setPaymentMethod("CASH")}>نقدي</AppButton>
              <AppButton variant={paymentMethod === "CARD" ? "primary" : "outline"} className="w-full" icon={CreditCard} onClick={() => setPaymentMethod("CARD")}>بطاقة</AppButton>
              <AppButton variant={paymentMethod === "WALLET" ? "primary" : "outline"} className="w-full" icon={Wallet} onClick={() => setPaymentMethod("WALLET")}>محفظة</AppButton>
            </div>
          </div>
          <TextInput className="mt-3" label="المبلغ المدفوع" type="number" value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} />
          {canViewCustomers && (
            <div className="mt-3 rounded-2xl border border-border p-3">
              <TextInput label="عميل اختياري" placeholder="بحث بالاسم أو الهاتف" value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} />
              {selectedCustomer ? (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-muted p-2 text-sm">
                  <span>{selectedCustomer.name} - {selectedCustomer.phone}</span>
                  <button className="font-semibold text-primary" onClick={() => setSelectedCustomer(null)}>إزالة</button>
                </div>
              ) : (
                <div className="mt-2 grid gap-2">
                  {customers.map((customer) => (
                    <button key={customer.id} className="rounded-xl bg-muted p-2 text-right text-sm hover:bg-primary/10" onClick={() => setSelectedCustomer(customer)}>
                      {customer.name} - {customer.phone}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">البيع الائتماني مؤجل؛ يجب تغطية إجمالي الفاتورة بالمدفوعات.</p>
            </div>
          )}
          <div className="grid gap-2">
            <AppButton icon={paymentMethod === "CARD" ? CreditCard : Wallet} className="h-14 text-base" disabled={!canSell || saving || cart.length === 0} onClick={completeSale}>{saving ? "جار إتمام البيع..." : "إتمام البيع الآن"}</AppButton>
            {canHold && <AppButton variant="outline" icon={Pause} className="h-12" disabled={cart.length === 0} onClick={holdOrder}>تعليق الطلب</AppButton>}
            <AppButton variant="ghost" icon={Trash2} className="h-12" onClick={() => setCart([])}>تفريغ السلة</AppButton>
          </div>
        </div>
      </AppCard>

      <Modal open={Boolean(invoice)} title="تم إتمام البيع بنجاح" onClose={closeReceipt} size="xl">
        {invoice && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
              <AppCard className="bg-success/5">
                <p className="text-sm font-semibold text-success">تم تحديث المخزون والفاتورة</p>
                <h3 className="mt-2 text-2xl font-extrabold">{invoice.invoiceNumber}</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">الإجمالي</span><span className="font-bold">{formatMoney(invoice.total)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">المدفوع</span><span className="font-bold">{formatMoney(invoice.paidAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">الباقي</span><span className="font-bold text-success">{formatMoney(invoice.changeAmount)}</span></div>
                </div>
              </AppCard>
              {receiptPayload ? <ReceiptPreview payload={receiptPayload} /> : <div className="rounded-xl bg-muted p-3"><b>{invoice.invoiceNumber}</b></div>}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {canPrintReceipts && <PrintButton label="طباعة الفاتورة" disabled={!receiptPayload} />}
              <AppButton variant="outline" onClick={closeReceipt}>بيع جديد</AppButton>
            </div>
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
