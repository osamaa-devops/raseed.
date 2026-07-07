import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Keyboard, Minus, Pause, Plus, Printer, RotateCcw, ScanLine, Search, Trash2, Wallet } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { DemoModeBanner } from "../../components/demo/DemoModeBanner";
import { EmptyState } from "../../components/feedback/EmptyState";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { PrintButton } from "../../components/printing/PrintButton";
import { ReceiptPreview } from "../../components/printing/ReceiptPreview";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { posService } from "../../services/posService";
import { customersService } from "../../services/customersService";
import { productsService } from "../../services/productsService";
import { shiftsService } from "../../services/shiftsService";
import { receiptService } from "../../services/receiptService";
import type { CashierShift, Customer, HeldOrder, Invoice, Payment, Product, ProductVariant, ReceiptPayload } from "../../types";
import { isDemoStore } from "../../utils/demo";

type CatalogItem = { product: Product; variant: ProductVariant; displayName: string; searchText: string };
type CartItem = { product: Product; variant: ProductVariant; quantity: number; discount: number };
type PaymentMode = Payment["method"] | "MIXED";

type MixedPayments = { CASH: number; CARD: number; INSTAPAY: number; WALLET: number };

const emptyMixed: MixedPayments = { CASH: 0, CARD: 0, INSTAPAY: 0, WALLET: 0 };

export function PosPage() {
  const { auth, hasPermission } = useAuth();
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? "";
  const canSell = hasPermission("pos.sell");
  const canHold = hasPermission("pos.hold_order");
  const canReturn = hasPermission("returns.create") || hasPermission("invoices.refund");
  const canPrintReceipts = hasPermission("printing.receipts") || hasPermission("invoices.print");
  const canViewCustomers = hasPermission("customers.view");
  const demoMode = isDemoStore(auth?.store);
  const searchRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [shift, setShift] = useState<CashierShift | null>(null);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMode>("CASH");
  const [mixedPayments, setMixedPayments] = useState<MixedPayments>(emptyMixed);
  const [amountPaid, setAmountPaid] = useState("");
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [receiptPayload, setReceiptPayload] = useState<ReceiptPayload | null>(null);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + priceFor(item) * item.quantity, 0), [cart]);
  const itemDiscount = useMemo(() => cart.reduce((sum, item) => sum + item.discount, 0), [cart]);
  const total = Math.max(0, subtotal - itemDiscount - invoiceDiscount);
  const paid = paymentMethod === "CASH" ? Number(amountPaid || total) : paymentMethod === "MIXED" ? sumMixed(mixedPayments) : Number(amountPaid || total);
  const change = Math.max(0, paid - total);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const load = async () => {
    if (!branchId) return;
    setError(null);
    try {
      const [productResponse, currentShift, held, recent, customerResponse] = await Promise.all([
        productsService.getProducts({ search: query, status: "ACTIVE", limit: 100 }),
        shiftsService.getCurrentShift(branchId),
        canHold ? posService.getHeldOrders(branchId) : Promise.resolve([]),
        posService.getRecentInvoices(branchId),
        canViewCustomers ? customersService.getCustomers({ search: customerQuery, status: "ACTIVE", limit: 8 }) : Promise.resolve({ items: [] }),
      ]);
      const nextCatalog = flattenCatalog(productResponse.items);
      setProducts(productResponse.items);
      setCatalog(nextCatalog);
      setShift(currentShift);
      setHeldOrders(held);
      setRecentInvoices(recent);
      setCustomers(customerResponse.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل بيانات الكاشير");
    }
  };

  useEffect(() => {
    void load();
  }, [branchId]);

  useEffect(() => {
    searchRef.current?.focus();
  }, [branchId, query]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "F4") {
        event.preventDefault();
        void holdOrder();
      }
      if (event.key === "F6") {
        event.preventDefault();
        const current = cart[0];
        if (current) setError("خصم الصنف يُعدّل من داخل السلة.");
      }
      if (event.key === "F8") {
        event.preventDefault();
        document.getElementById("payment-methods")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (event.key === "F9") {
        event.preventDefault();
        window.print();
      }
      if (event.key === "Escape") {
        setError(null);
        setNotice(null);
        if (invoice) closeReceipt();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart, invoice]);

  useEffect(() => {
    if (!canViewCustomers || !branchId) return;
    const timeoutId = window.setTimeout(() => {
      void customersService.getCustomers({ search: customerQuery, status: "ACTIVE", limit: 8 }).then((response) => setCustomers(response.items)).catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [branchId, canViewCustomers, customerQuery]);

  const addCatalogItem = (item: CatalogItem) => {
    if (item.product.status !== "ACTIVE" || item.variant.status !== "ACTIVE") {
      setError("هذا الصنف غير متاح للبيع.");
      return;
    }
    if (item.variant.stockQuantity <= 0) {
      setError(`المقاس ${item.variant.size} - ${item.variant.color} غير متوفر.`);
      return;
    }
    setCart((items) => {
      const existing = items.find((row) => row.variant.id === item.variant.id);
      if (existing) return items.map((row) => row.variant.id === item.variant.id ? { ...row, quantity: row.quantity + 1 } : row);
      return [...items, { product: item.product, variant: item.variant, quantity: 1, discount: 0 }];
    });
  };

  const searchHint = query.trim() ? `نتائج البحث: ${catalog.length}` : "امسح الباركود أو اكتب اسم المنتج ثم اضغط Enter";

  const submitSearch = async () => {
    const normalizedQuery = query.trim().toLowerCase();
    const exactMatch = normalizedQuery
      ? catalog.find((item) => [item.variant.barcode, item.variant.sku, item.product.name, item.displayName].some((value) => value?.toLowerCase() === normalizedQuery))
      : null;

    if (exactMatch) {
      addCatalogItem(exactMatch);
      setNotice(`تمت إضافة ${exactMatch.displayName} إلى السلة`);
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
      const paymentRows = paymentMethod === "MIXED"
        ? buildMixedPayments(mixedPayments)
        : [{ method: paymentMethod, amount: paid }];
      const created = await posService.createSale({
        branchId,
        shiftId: shift.id,
        customerId: selectedCustomer?.id,
        items: cart.map((item) => ({ variantId: item.variant.id, productId: item.product.id, quantity: item.quantity, unitPrice: priceFor(item), discount: item.discount })),
        payments: paymentRows,
        invoiceDiscount,
      });
      setInvoice(created);
      setReceiptPayload(await receiptService.getInvoiceReceipt(created.id));
      setCart([]);
      setInvoiceDiscount(0);
      setSelectedCustomer(null);
      setAmountPaid("");
      setMixedPayments(emptyMixed);
      setPaymentMethod("CASH");
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
      data: { items: cart.map((item) => ({ productId: item.product.id, variantId: item.variant.id, name: item.product.name, size: item.variant.size, color: item.variant.color, quantity: item.quantity, discount: item.discount, price: priceFor(item) })) },
      note: `طلب معلق ${new Date().toLocaleTimeString("ar-EG")}`,
    });
    setCart([]);
    setNotice("تم حفظ الطلب المعلق");
    await load();
  };

  const loadHeldOrder = (heldOrder: HeldOrder) => {
    const data = heldOrder.data as { items?: Array<{ productId?: string; variantId?: string; quantity: number; discount?: number }> };
    const next = (data.items ?? []).map((item) => {
      const catalogItem = catalog.find((candidate) => candidate.variant.id === item.variantId || candidate.product.id === item.productId);
      return catalogItem ? { product: catalogItem.product, variant: catalogItem.variant, quantity: item.quantity, discount: item.discount ?? 0 } : null;
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

  if (!hasPermission("pos.access")) {
    return <EmptyState icon={CreditCard} title="لا تملك صلاحية POS" description="تواصل مع مدير المتجر لتفعيل صلاحية الكاشير." />;
  }

  return (
    <div className="grid min-h-[calc(100vh-5rem)] gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_460px]" dir="rtl">
      <section>
        {demoMode && <DemoModeBanner />}
        <AppCard className="mb-4 overflow-hidden border-primary/10 bg-background">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-2 text-sm font-semibold text-primary">مسح سريع للباركود أو البحث بالاسم</p>
              <div className="relative">
                <ScanLine className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input
                  ref={searchRef}
                  className="h-16 w-full rounded-2xl border border-primary/20 bg-background pr-12 pl-4 text-lg font-semibold text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void submitSearch();
                    }
                  }}
                  placeholder="امسح الباركود أو اكتب اسم المنتج / SKU"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1.5"><Keyboard size={14} /> F2 بحث</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1.5"><Keyboard size={14} /> F4 تعليق</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1.5"><Keyboard size={14} /> F8 الدفع</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1.5">{searchHint}</span>
              </div>
            </div>
            <div className="grid gap-2 lg:min-w-42">
              <AppButton icon={Search} className="h-16" onClick={() => void submitSearch()}>بحث وإضافة</AppButton>
              <AppButton variant="outline" className="h-12" onClick={() => void load()}>تحديث البيانات</AppButton>
            </div>
          </div>
        </AppCard>

        <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <MetricCard title="عدد العناصر" value={totalItems.toLocaleString("ar-EG")} hint="وحدات داخل السلة" />
          <MetricCard title="إجمالي الفاتورة" value={formatMoney(total)} hint="بعد الخصومات" />
          <MetricCard title="العميل" value={selectedCustomer?.name ?? "بيع مباشر"} hint={selectedCustomer?.phone ?? "بدون ربط عميل"} />
          <MetricCard title="حالة الشيفت" value={shift ? "مفتوح" : "غير مفتوح"} hint={auth?.branch?.name ?? "-"} tone={shift ? "success" : "warning"} />
        </div>

        {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
        {notice && <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{notice}</p>}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {catalog.map((item) => (
            <button
              key={item.variant.id}
              type="button"
              onClick={() => addCatalogItem(item)}
              disabled={item.variant.stockQuantity <= 0 || item.variant.status !== "ACTIVE" || item.product.status !== "ACTIVE"}
              className="flex min-h-44 flex-col rounded-2xl border border-border bg-card p-3 text-right transition hover:-translate-y-0.5 hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">ر</span>
                <div className="flex flex-col items-end gap-1 text-[11px]">
                  <span className="rounded-full bg-muted px-2 py-1 font-semibold text-muted-foreground">{item.variant.size} / {item.variant.color}</span>
                  <span className={`rounded-full px-2 py-1 font-semibold ${item.variant.stockQuantity > 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {item.variant.stockQuantity > 0 ? `متاح ${item.variant.stockQuantity.toLocaleString("ar-EG")}` : "غير متوفر"}
                  </span>
                </div>
              </div>
              <span className="line-clamp-2 font-bold text-foreground">{item.displayName}</span>
              <span className="mt-1 text-xs text-muted-foreground">{item.variant.barcode ?? item.variant.sku ?? "بدون كود"}</span>
              <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                <div className="grid">
                  <span className="text-lg font-extrabold text-foreground">{priceFor({ product: item.product, variant: item.variant, quantity: 1, discount: 0 }).toLocaleString("ar-EG")} ج</span>
                  <span className="text-[11px] text-muted-foreground">سعر البيع</span>
                </div>
                <span className="text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">إضافة</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <AppCard>
            <h2 className="mb-3 font-bold">طلبات معلقة</h2>
            {heldOrders.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد طلبات معلقة</p> : heldOrders.map((held) => (
              <div key={held.id} className="mb-2 flex items-center justify-between rounded-xl bg-muted p-2">
                <button type="button" className="text-sm font-semibold" onClick={() => loadHeldOrder(held)}>{held.note ?? "طلب معلق"}</button>
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
            <p className="mt-1 text-xs text-muted-foreground">أضف الصنف ثم اضبط المقاسات والخصم قبل إتمام البيع.</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{totalItems.toLocaleString("ar-EG")} صنف</span>
        </div>

        <div className="flex-1 space-y-3">
          {cart.length === 0 && <p className="rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">ابدأ بمسح الباركود أو اختر صنفًا من الشبكة لإضافة أول عنصر.</p>}
          {cart.map((item) => (
            <div key={item.variant.id} className="rounded-2xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-bold">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{item.variant.size} / {item.variant.color} • {item.variant.barcode ?? item.variant.sku ?? "بدون كود"}</p>
                </div>
                <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-danger" onClick={() => setCart((items) => items.filter((row) => row.variant.id !== item.variant.id))}><Trash2 size={16} /></button>
              </div>
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <AppButton variant="outline" icon={Minus} className="min-h-12 min-w-12 px-0" onClick={() => setCart((items) => items.map((row) => row.variant.id === item.variant.id ? { ...row, quantity: Math.max(1, row.quantity - 1) } : row))}>-</AppButton>
                <span className="text-center text-lg font-bold">{item.quantity}</span>
                <AppButton variant="outline" icon={Plus} className="min-h-12 min-w-12 px-0" onClick={() => setCart((items) => items.map((row) => row.variant.id === item.variant.id ? { ...row, quantity: row.quantity + 1 } : row))}>+</AppButton>
              </div>
              <TextInput className="mt-2" label="خصم الصنف" type="number" value={item.discount} onChange={(event) => setCart((items) => items.map((row) => row.variant.id === item.variant.id ? { ...row, discount: Number(event.target.value) } : row))} />
              <p className="mt-2 text-left text-lg font-extrabold">{formatMoney(priceFor(item) * item.quantity - item.discount)}</p>
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
          <div className="mt-3" id="payment-methods">
            <span className="mb-2 block text-sm font-semibold text-foreground">طريقة الدفع</span>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              <AppButton variant={paymentMethod === "CASH" ? "primary" : "outline"} className="w-full" icon={Wallet} onClick={() => setPaymentMethod("CASH")}>نقدي</AppButton>
              <AppButton variant={paymentMethod === "CARD" ? "primary" : "outline"} className="w-full" icon={CreditCard} onClick={() => setPaymentMethod("CARD")}>بطاقة</AppButton>
              <AppButton variant={paymentMethod === "INSTAPAY" ? "primary" : "outline"} className="w-full" icon={Wallet} onClick={() => setPaymentMethod("INSTAPAY")}>إنستا باي</AppButton>
              <AppButton variant={paymentMethod === "WALLET" ? "primary" : "outline"} className="w-full" icon={Wallet} onClick={() => setPaymentMethod("WALLET")}>محفظة</AppButton>
              <AppButton variant={paymentMethod === "MIXED" ? "primary" : "outline"} className="w-full" icon={CreditCard} onClick={() => setPaymentMethod("MIXED")}>مختلط</AppButton>
            </div>
          </div>

          {paymentMethod === "MIXED" ? (
            <div className="mt-3 grid gap-2 rounded-2xl border border-border p-3">
              <p className="text-sm font-semibold">قسّم المبلغ</p>
              {(["CASH", "CARD", "INSTAPAY", "WALLET"] as const).map((method) => (
                <TextInput key={method} label={paymentLabel(method)} type="number" value={mixedPayments[method]} onChange={(event) => setMixedPayments((current) => ({ ...current, [method]: Number(event.target.value) }))} />
              ))}
              <p className="text-xs text-muted-foreground">المجموع الحالي: {formatMoney(sumMixed(mixedPayments))}</p>
            </div>
          ) : (
            <TextInput className="mt-3" label="المبلغ المدفوع" type="number" value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} />
          )}

          {canViewCustomers && (
            <div className="mt-3 rounded-2xl border border-border p-3">
              <TextInput label="عميل اختياري" placeholder="بحث بالاسم أو الهاتف" value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} />
              {selectedCustomer ? (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-muted p-2 text-sm">
                  <span>{selectedCustomer.name} - {selectedCustomer.phone}</span>
                  <button type="button" className="font-semibold text-primary" onClick={() => setSelectedCustomer(null)}>إزالة</button>
                </div>
              ) : (
                <div className="mt-2 grid gap-2">
                  {customers.map((customer) => (
                    <button key={customer.id} type="button" className="rounded-xl bg-muted p-2 text-right text-sm hover:bg-primary/10" onClick={() => setSelectedCustomer(customer)}>
                      {customer.name} - {customer.phone}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">البيع الائتماني مؤجل؛ يجب تغطية إجمالي الفاتورة بالمدفوعات.</p>
            </div>
          )}

          <div className="grid gap-2">
            <AppButton icon={CreditCard} className="h-14 text-base" disabled={!canSell || saving || cart.length === 0} onClick={completeSale}>{saving ? "جار إتمام البيع..." : "إتمام البيع الآن"}</AppButton>
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

function flattenCatalog(products: Product[]) {
  const items: CatalogItem[] = [];
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      items.push({
        product,
        variant,
        displayName: `${product.name} - ${variant.size} / ${variant.color}`,
        searchText: `${product.name} ${product.brand ?? ""} ${variant.size} ${variant.color} ${variant.sku ?? ""} ${variant.barcode ?? ""}`.toLowerCase(),
      });
    }
  }
  return items;
}

function priceFor(item: CartItem) {
  return item.variant.discountPrice ?? item.variant.sellingPrice;
}

function paymentLabel(method: "CASH" | "CARD" | "INSTAPAY" | "WALLET") {
  return method === "CASH" ? "نقدي" : method === "CARD" ? "بطاقة" : method === "INSTAPAY" ? "إنستا باي" : "محفظة";
}

function sumMixed(mixed: MixedPayments) {
  return mixed.CASH + mixed.CARD + mixed.INSTAPAY + mixed.WALLET;
}

function buildMixedPayments(mixed: MixedPayments) {
  return (["CASH", "CARD", "INSTAPAY", "WALLET"] as const)
    .map((method) => ({ method, amount: mixed[method] }))
    .filter((payment) => payment.amount > 0);
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}

function goToReturn(invoiceNumber: string) {
  window.location.href = `/returns?invoice=${encodeURIComponent(invoiceNumber)}`;
}

function MetricCard({ title, value, hint, tone = "default" }: { title: string; value: string; hint: string; tone?: "default" | "success" | "warning" }) {
  return (
    <AppCard className="p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className={`mt-2 text-2xl font-extrabold ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </AppCard>
  );
}
