import { Eye, PackageCheck, Plus, Send, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { branchesService } from "../../services/branchesService";
import { productsService } from "../../services/productsService";
import { purchaseOrdersService } from "../../services/purchaseOrdersService";
import { suppliersService } from "../../services/suppliersService";
import type { Branch, Product, PurchaseOrder, PurchaseOrderStatus, ReceivePurchaseOrderRequest, Supplier, SupplierPaymentMethod } from "../../types";

const emptyForm = { branchId: "", supplierId: "", productId: "", quantity: 1, purchasePrice: 0, expectedDeliveryDate: "", discountTotal: 0, taxTotal: 0, notes: "" };

export function PurchaseOrdersPage() {
  const { auth, hasPermission } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [summary, setSummary] = useState({ total: 0, paidAmount: 0, remainingAmount: 0 });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filters, setFilters] = useState({ search: "", supplierId: "", branchId: "", status: "" as PurchaseOrderStatus | "", dateFrom: "", dateTo: "" });
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [receiveOrder, setReceiveOrder] = useState<PurchaseOrder | null>(null);
  const [receivePaid, setReceivePaid] = useState(0);
  const [receivePaymentMethod, setReceivePaymentMethod] = useState<SupplierPaymentMethod>("CASH");
  const [receiveNotes, setReceiveNotes] = useState("");
  const [receiveItems, setReceiveItems] = useState<Record<string, { receivedQuantity: number; expiryDate: string; batchNumber: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = hasPermission("purchase_orders.view");
  const canCreate = hasPermission("purchase_orders.create");
  const canUpdate = hasPermission("purchase_orders.update");
  const canCancel = hasPermission("purchase_orders.cancel");
  const canReceive = hasPermission("purchase_orders.receive");

  const load = async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseOrdersService.getPurchaseOrders({ ...filters, limit: 50 });
      setOrders(response.items);
      setSummary(response.summary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل أوامر الشراء");
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    const [supplierResponse, productResponse, branchResponse] = await Promise.all([
      suppliersService.getSuppliers({ status: "ACTIVE", limit: 100 }),
      productsService.getProducts({ status: "ACTIVE", limit: 100 }),
      branchesService.getBranches(),
    ]);
    setSuppliers(supplierResponse.items);
    setProducts(productResponse.items);
    setBranches(branchResponse);
    const branchId = auth?.branch?.id ?? auth?.user.branchId ?? branchResponse[0]?.id ?? "";
    setForm((current) => ({
      ...current,
      branchId: current.branchId || branchId,
      supplierId: current.supplierId || supplierResponse.items[0]?.id || "",
      productId: current.productId || productResponse.items[0]?.id || "",
      purchasePrice: current.purchasePrice || productResponse.items[0]?.purchasePrice || 0,
    }));
  };

  useEffect(() => {
    void loadLookups();
  }, []);

  useEffect(() => {
    void load();
  }, [filters.status, filters.supplierId, filters.branchId, filters.dateFrom, filters.dateTo, canView]);

  const saveOrder = async () => {
    setError(null);
    try {
      await purchaseOrdersService.createPurchaseOrder({
        branchId: form.branchId,
        supplierId: form.supplierId,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        discountTotal: Number(form.discountTotal) || 0,
        taxTotal: Number(form.taxTotal) || 0,
        notes: form.notes || undefined,
        items: [{ productId: form.productId, quantity: Number(form.quantity), purchasePrice: Number(form.purchasePrice) }],
      });
      setForm((current) => ({ ...emptyForm, branchId: current.branchId, supplierId: current.supplierId, productId: current.productId, purchasePrice: current.purchasePrice || 0 }));
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر إنشاء أمر الشراء");
    }
  };

  const changeStatus = async (order: PurchaseOrder, status: PurchaseOrderStatus) => {
    setError(null);
    try {
      await purchaseOrdersService.updatePurchaseOrderStatus(order.id, status);
      await load();
      if (selected?.id === order.id) setSelected(await purchaseOrdersService.getPurchaseOrder(order.id));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "تعذر تحديث حالة أمر الشراء");
    }
  };

  const cancelDraft = async (order: PurchaseOrder) => {
    if (!confirm(`إلغاء أمر الشراء "${order.orderNumber}"؟`)) return;
    await purchaseOrdersService.deletePurchaseOrder(order.id);
    await load();
  };

  const openReceive = (order: PurchaseOrder) => {
    setReceiveOrder(order);
    setReceivePaid(0);
    setReceivePaymentMethod("CASH");
    setReceiveNotes("");
    setReceiveItems(Object.fromEntries(order.items.map((item) => [item.id, { receivedQuantity: Math.max(item.quantity - item.receivedQuantity, 0), expiryDate: item.expiryDate?.slice(0, 10) ?? "", batchNumber: item.batchNumber ?? "" }])));
  };

  const submitReceive = async () => {
    if (!receiveOrder) return;
    setError(null);
    const items: ReceivePurchaseOrderRequest["items"] = Object.entries(receiveItems)
      .filter(([, item]) => Number(item.receivedQuantity) > 0)
      .map(([purchaseOrderItemId, item]) => ({
        purchaseOrderItemId,
        receivedQuantity: Number(item.receivedQuantity),
        expiryDate: item.expiryDate || undefined,
        batchNumber: item.batchNumber || undefined,
      }));
    try {
      const updated = await purchaseOrdersService.receivePurchaseOrder(receiveOrder.id, {
        paidAmount: Number(receivePaid) || 0,
        paymentMethod: receivePaid > 0 ? receivePaymentMethod : undefined,
        notes: receiveNotes || undefined,
        items,
      });
      setReceiveOrder(null);
      setSelected(updated);
      await load();
    } catch (receiveError) {
      setError(receiveError instanceof Error ? receiveError.message : "تعذر استلام أمر الشراء");
    }
  };

  if (!canView) return <PageHeader title="أوامر الشراء" description="ليس لديك صلاحية عرض أوامر الشراء." />;

  return (
    <div>
      <PageHeader title="أوامر الشراء" description="إنشاء أوامر الشراء واستلام المخزون من الموردين." />
      <div className="grid gap-4 md:grid-cols-3">
        <AppCard><p className="text-sm text-muted-foreground">إجمالي الأوامر</p><h3 className="mt-2 text-2xl font-bold">{orders.length}</h3></AppCard>
        <AppCard><p className="text-sm text-muted-foreground">إجمالي القيمة</p><h3 className="mt-2 text-2xl font-bold">{formatMoney(summary.total)}</h3></AppCard>
        <AppCard><p className="text-sm text-muted-foreground">المتبقي</p><h3 className="mt-2 text-2xl font-bold">{formatMoney(summary.remainingAmount)}</h3></AppCard>
      </div>

      <AppCard className="mt-6">
        <div className="grid gap-3 md:grid-cols-6">
          <TextInput label="بحث برقم الأمر" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} onBlur={load} />
          <SelectInput label="المورد" value={filters.supplierId} onChange={(event) => setFilters((current) => ({ ...current, supplierId: event.target.value }))}>
            <option value="">كل الموردين</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </SelectInput>
          <SelectInput label="الفرع" value={filters.branchId} onChange={(event) => setFilters((current) => ({ ...current, branchId: event.target.value }))}>
            <option value="">كل الفروع</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </SelectInput>
          <SelectInput label="الحالة" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as PurchaseOrderStatus | "" }))}>
            <option value="">كل الحالات</option>{(["DRAFT", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"] as PurchaseOrderStatus[]).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </SelectInput>
          <TextInput label="من" type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
          <TextInput label="إلى" type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
        </div>
      </AppCard>

      {canCreate && (
        <AppCard className="mt-6">
          <div className="grid gap-3 md:grid-cols-4">
            <SelectInput label="الفرع" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</SelectInput>
            <SelectInput label="المورد" value={form.supplierId} onChange={(event) => setForm((current) => ({ ...current, supplierId: event.target.value }))}>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</SelectInput>
            <SelectInput label="المنتج" value={form.productId} onChange={(event) => { const product = products.find((item) => item.id === event.target.value); setForm((current) => ({ ...current, productId: event.target.value, purchasePrice: product?.purchasePrice ?? current.purchasePrice })); }}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</SelectInput>
            <TextInput label="الكمية" type="number" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))} />
            <TextInput label="سعر الشراء" type="number" value={form.purchasePrice} onChange={(event) => setForm((current) => ({ ...current, purchasePrice: Number(event.target.value) }))} />
            <TextInput label="تاريخ التسليم المتوقع" type="date" value={form.expectedDeliveryDate} onChange={(event) => setForm((current) => ({ ...current, expectedDeliveryDate: event.target.value }))} />
            <TextInput label="خصم" type="number" value={form.discountTotal} onChange={(event) => setForm((current) => ({ ...current, discountTotal: Number(event.target.value) }))} />
            <TextInput label="ضريبة" type="number" value={form.taxTotal} onChange={(event) => setForm((current) => ({ ...current, taxTotal: Number(event.target.value) }))} />
            <TextInput label="ملاحظات" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>
          <div className="mt-4"><AppButton icon={Plus} onClick={saveOrder} disabled={!form.branchId || !form.supplierId || !form.productId || form.quantity <= 0}>إنشاء أمر شراء</AppButton></div>
        </AppCard>
      )}

      {error && <p className="mt-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {loading ? <AppCard className="mt-6">جار تحميل أوامر الشراء...</AppCard> : (
        <div className="mt-6">
          <DataTable
            columns={["رقم الأمر", "المورد", "الفرع", "الحالة", "الإجمالي", "المدفوع", "المتبقي", "تاريخ الإنشاء", "التسليم المتوقع", "الإجراءات"]}
            rows={orders}
            renderRow={(order) => (
              <tr key={order.id} className="border-t border-border hover:bg-table-row-hover">
                <td className="px-4 py-3 font-semibold">{order.orderNumber}</td>
                <td className="px-4 py-3">{order.supplier?.name ?? "-"}</td>
                <td className="px-4 py-3">{order.branch?.name ?? "-"}</td>
                <td className="px-4 py-3"><StatusBadge label={statusLabel(order.status)} tone={statusTone(order.status)} /></td>
                <td className="px-4 py-3 font-bold">{formatMoney(order.total)}</td>
                <td className="px-4 py-3">{formatMoney(order.paidAmount)}</td>
                <td className="px-4 py-3">{formatMoney(order.remainingAmount)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(order.expectedDeliveryDate)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <AppButton variant="outline" icon={Eye} onClick={() => setSelected(order)}>عرض</AppButton>
                    {canUpdate && order.status === "DRAFT" && <AppButton variant="ghost" icon={Send} onClick={() => void changeStatus(order, "SENT")}>إرسال</AppButton>}
                    {canCancel && ["DRAFT", "SENT"].includes(order.status) && <AppButton variant="danger" icon={XCircle} onClick={() => order.status === "DRAFT" ? void cancelDraft(order) : void changeStatus(order, "CANCELLED")}>إلغاء</AppButton>}
                    {canReceive && ["SENT", "PARTIALLY_RECEIVED"].includes(order.status) && <AppButton icon={PackageCheck} onClick={() => openReceive(order)}>استلام</AppButton>}
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      )}

      <Modal open={Boolean(selected)} title="تفاصيل أمر الشراء" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <h3 className="text-lg font-bold">{selected.orderNumber}</h3>
              <p>{selected.supplier?.name ?? "-"} - {selected.branch?.name ?? "-"}</p>
              <p className="mt-2 font-bold">{formatMoney(selected.total)} / متبقي {formatMoney(selected.remainingAmount)}</p>
            </div>
            <div className="overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted text-muted-foreground"><tr><th className="px-2 py-2 text-right">المنتج</th><th className="px-2 py-2 text-right">المطلوب</th><th className="px-2 py-2 text-right">المستلم</th><th className="px-2 py-2 text-right">السعر</th><th className="px-2 py-2 text-right">الصلاحية</th><th className="px-2 py-2 text-right">التشغيلة</th><th className="px-2 py-2 text-right">الإجمالي</th></tr></thead>
                <tbody>{selected.items.map((item) => <tr key={item.id} className="border-t border-border"><td className="px-2 py-2">{item.productName}</td><td className="px-2 py-2">{item.quantity}</td><td className="px-2 py-2">{item.receivedQuantity}</td><td className="px-2 py-2">{formatMoney(item.purchasePrice)}</td><td className="px-2 py-2">{formatDate(item.expiryDate)}</td><td className="px-2 py-2">{item.batchNumber ?? "-"}</td><td className="px-2 py-2">{formatMoney(item.lineTotal)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(receiveOrder)} title="استلام أمر شراء" onClose={() => setReceiveOrder(null)}>
        {receiveOrder && (
          <div className="space-y-4 text-sm">
            {receiveOrder.items.map((item) => {
              const remaining = Math.max(item.quantity - item.receivedQuantity, 0);
              const state = receiveItems[item.id] ?? { receivedQuantity: 0, expiryDate: "", batchNumber: "" };
              return (
                <AppCard key={item.id}>
                  <div className="mb-3 flex flex-wrap justify-between gap-2">
                    <strong>{item.productName}</strong>
                    <span className="text-muted-foreground">المطلوب {item.quantity} / مستلم {item.receivedQuantity} / متبقي {remaining}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <TextInput label="كمية الاستلام" type="number" value={state.receivedQuantity} onChange={(event) => setReceiveItems((current) => ({ ...current, [item.id]: { ...state, receivedQuantity: Number(event.target.value) } }))} />
                    <TextInput label="تاريخ الصلاحية" type="date" value={state.expiryDate} onChange={(event) => setReceiveItems((current) => ({ ...current, [item.id]: { ...state, expiryDate: event.target.value } }))} />
                    <TextInput label="رقم التشغيلة" value={state.batchNumber} onChange={(event) => setReceiveItems((current) => ({ ...current, [item.id]: { ...state, batchNumber: event.target.value } }))} />
                  </div>
                </AppCard>
              );
            })}
            <div className="grid gap-3 md:grid-cols-3">
              <TextInput label="المبلغ المدفوع" type="number" value={receivePaid} onChange={(event) => setReceivePaid(Number(event.target.value))} />
              <SelectInput label="طريقة الدفع" value={receivePaymentMethod} onChange={(event) => setReceivePaymentMethod(event.target.value as SupplierPaymentMethod)}>
                <option value="CASH">نقدي</option><option value="CARD">بطاقة</option><option value="WALLET">محفظة</option><option value="BANK_TRANSFER">تحويل بنكي</option>
              </SelectInput>
              <TextInput label="ملاحظات" value={receiveNotes} onChange={(event) => setReceiveNotes(event.target.value)} />
            </div>
            <div className="flex gap-2"><AppButton icon={PackageCheck} onClick={submitReceive}>تأكيد الاستلام</AppButton><AppButton variant="outline" onClick={() => setReceiveOrder(null)}>إلغاء</AppButton></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-EG")} ج`;
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "short" }).format(new Date(value)) : "-";
}

function statusLabel(status: PurchaseOrderStatus) {
  const labels = { DRAFT: "مسودة", SENT: "مرسل", PARTIALLY_RECEIVED: "استلام جزئي", RECEIVED: "مستلم", CANCELLED: "ملغي" };
  return labels[status];
}

function statusTone(status: PurchaseOrderStatus) {
  if (status === "RECEIVED") return "success";
  if (status === "CANCELLED") return "danger";
  if (status === "PARTIALLY_RECEIVED") return "warning";
  return "info";
}
