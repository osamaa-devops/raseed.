import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Archive, Download, Eye, History, Layers, MinusCircle, Plus, SlidersHorizontal } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { EmptyState } from "../../components/feedback/EmptyState";
import { LoadingSkeleton } from "../../components/feedback/LoadingSkeleton";
import { Modal } from "../../components/feedback/Modal";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { DataTable } from "../../components/tables/DataTable";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { inventoryService, type AddStockPayload, type AdjustStockPayload, type RemoveStockPayload } from "../../services/inventoryService";
import { importExportService } from "../../services/importExportService";
import type { InventoryBatch, InventoryMovement, InventoryStock } from "../../types";

type Tab = "stocks" | "low" | "expiry" | "movements";
type ModalMode = "add" | "remove" | "adjust" | null;

const movementLabels: Record<InventoryMovement["type"], string> = {
  INITIAL: "رصيد افتتاحي",
  ADD_STOCK: "إضافة كمية",
  REMOVE_STOCK: "خصم كمية",
  ADJUSTMENT_IN: "تسوية بالزيادة",
  ADJUSTMENT_OUT: "تسوية بالنقص",
  DAMAGE: "تالف",
  EXPIRED: "منتهي الصلاحية",
  RETURN: "مرتجع",
  SALE: "بيع",
  PURCHASE: "شراء",
  TRANSFER_IN: "تحويل وارد",
  TRANSFER_OUT: "تحويل صادر",
};

const stockStatusLabels: Record<InventoryStock["stockStatus"], { label: string; tone: "success" | "warning" | "danger" }> = {
  in_stock: { label: "متوفر", tone: "success" },
  low_stock: { label: "منخفض", tone: "warning" },
  out_of_stock: { label: "نفد", tone: "danger" },
};

export function InventoryPage() {
  const { auth, hasPermission } = useAuth();
  const branchId = auth?.branch?.id ?? auth?.user.branchId ?? "";
  const branchName = auth?.branch?.name ?? "الفرع الحالي";
  const canView = hasPermission("inventory.view");
  const canAdd = hasPermission("inventory.add_stock");
  const canRemove = hasPermission("inventory.remove_stock");
  const canAdjust = hasPermission("inventory.adjust");
  const canViewMovements = hasPermission("inventory.view_movements");
  const canViewAlerts = hasPermission("inventory.view_alerts");
  const canExport = hasPermission("inventory.export");

  const [tab, setTab] = useState<Tab>("stocks");
  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [lowStock, setLowStock] = useState<InventoryStock[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<InventoryBatch[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<InventoryStock | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovement | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [addForm, setAddForm] = useState({ quantity: 1, purchasePrice: "", expiryDate: "", batchNumber: "", reason: "", notes: "" });
  const [removeForm, setRemoveForm] = useState({ quantity: 1, type: "DAMAGE" as RemoveStockPayload["type"], reason: "", notes: "" });
  const [adjustForm, setAdjustForm] = useState({ newQuantity: 0, reason: "", notes: "" });

  const currentRows = useMemo(() => stocks.filter((stock) => !status || stock.stockStatus === status), [stocks, status]);

  const load = async () => {
    if (!canView || !branchId) return;
    setLoading(true);
    setError(null);
    try {
      const [stockResponse, lowResponse, expiryResponse, movementResponse] = await Promise.all([
        inventoryService.getInventoryStocks({ branchId, search, limit: 100 }),
        canViewAlerts ? inventoryService.getLowStock({ branchId, limit: 100 }) : Promise.resolve({ items: [], meta: { page: 1, limit: 100, total: 0, pages: 0 } }),
        canViewAlerts ? inventoryService.getExpiryAlerts({ branchId, days: 30 }) : Promise.resolve([]),
        canViewMovements ? inventoryService.getInventoryMovements({ branchId, limit: 100 }) : Promise.resolve({ items: [], meta: { page: 1, limit: 100, total: 0, pages: 0 } }),
      ]);
      setStocks(stockResponse.items);
      setLowStock(lowResponse.items);
      setExpiryAlerts(expiryResponse);
      setMovements(movementResponse.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل بيانات المخزون");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [branchId, canView, canViewAlerts, canViewMovements]);

  const openModal = (mode: ModalMode, stock: InventoryStock) => {
    setSelectedStock(stock);
    setModalMode(mode);
    setAddForm({ quantity: 1, purchasePrice: "", expiryDate: "", batchNumber: "", reason: "", notes: "" });
    setRemoveForm({ quantity: 1, type: "DAMAGE", reason: "", notes: "" });
    setAdjustForm({ newQuantity: stock.quantity, reason: "", notes: "" });
  };

  const closeModal = () => {
    setSelectedStock(null);
    setSelectedMovement(null);
    setModalMode(null);
  };

  const saveInventoryAction = async () => {
    if (!selectedStock || !branchId) return;
    setSaving(true);
    setError(null);
    try {
      if (modalMode === "add") {
        const payload: AddStockPayload = {
          branchId,
          productId: selectedStock.productId,
          quantity: Number(addForm.quantity),
          purchasePrice: addForm.purchasePrice ? Number(addForm.purchasePrice) : undefined,
          expiryDate: addForm.expiryDate || undefined,
          batchNumber: addForm.batchNumber || undefined,
          reason: addForm.reason || undefined,
          notes: addForm.notes || undefined,
        };
        await inventoryService.addStock(payload);
        setNotice("تمت إضافة الكمية وتسجيل الحركة");
      }
      if (modalMode === "remove") {
        await inventoryService.removeStock({
          branchId,
          productId: selectedStock.productId,
          quantity: Number(removeForm.quantity),
          type: removeForm.type,
          reason: removeForm.reason,
          notes: removeForm.notes || undefined,
        });
        setNotice("تم خصم الكمية وتسجيل الحركة");
      }
      if (modalMode === "adjust") {
        const payload: AdjustStockPayload = {
          branchId,
          productId: selectedStock.productId,
          newQuantity: Number(adjustForm.newQuantity),
          reason: adjustForm.reason,
          notes: adjustForm.notes || undefined,
        };
        await inventoryService.adjustStock(payload);
        setNotice("تم تعديل الرصيد وتسجيل الحركة");
      }
      closeModal();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ حركة المخزون");
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return <EmptyState icon={Layers} title="لا تملك صلاحية عرض المخزون" description="تواصل مع مدير المتجر لتحديث الصلاحيات." />;
  }

  return (
    <div>
      <PageHeader title="المخزون" description={`أرصدة وحركات مخزون ${branchName}`} actions={canExport ? <AppButton variant="outline" icon={Download} onClick={() => void importExportService.exportInventory("xlsx", { branchId, status })}>تصدير</AppButton> : null} />
      <AppCard className="mb-4 bg-muted/35">
        <p className="text-sm font-semibold text-foreground">معلومة مهمة</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">كل عملية بيع أو مرتجع أو إضافة أو تسوية يتم تسجيلها تلقائيًا في سجل الحركات، لذلك مراجعة المخزون هنا تكفي لمعرفة ما حدث فعليًا داخل الفرع.</p>
      </AppCard>
      {notice && <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{notice}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        <TabButton active={tab === "stocks"} onClick={() => setTab("stocks")}>الرصيد الحالي</TabButton>
        {canViewAlerts && <TabButton active={tab === "low"} onClick={() => setTab("low")}>مخزون منخفض</TabButton>}
        {canViewAlerts && <TabButton active={tab === "expiry"} onClick={() => setTab("expiry")}>تنبيهات الصلاحية</TabButton>}
        {canViewMovements && <TabButton active={tab === "movements"} onClick={() => setTab("movements")}>سجل الحركات</TabButton>}
      </div>

      {tab === "stocks" && (
        <>
          <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_220px_auto]">
            <TextInput placeholder="بحث بالمنتج أو الباركود أو SKU" value={search} onChange={(event) => setSearch(event.target.value)} />
            <SelectInput value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">كل الحالات</option>
              <option value="in_stock">متوفر</option>
              <option value="low_stock">منخفض</option>
              <option value="out_of_stock">نفد</option>
            </SelectInput>
            <AppButton variant="outline" onClick={load}>بحث</AppButton>
          </div>
          {loading ? <LoadingSkeleton /> : <StockTable rows={currentRows} canAdd={canAdd} canRemove={canRemove} canAdjust={canAdjust} onAction={openModal} onMovement={setSelectedMovementFromStock(movements, setSelectedMovement)} />}
        </>
      )}

      {tab === "low" && (
        loading ? <LoadingSkeleton /> : lowStock.length === 0 ? <EmptyState icon={AlertTriangle} title="لا توجد منتجات منخفضة" description="كل المنتجات أعلى من حد إعادة الطلب." /> : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lowStock.map((stock) => (
              <AppCard key={stock.id}>
                <h2 className="font-bold">{stock.product.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">الكمية الحالية: {formatNumber(stock.quantity)} {stock.product.unitType}</p>
                <p className="text-sm text-muted-foreground">الحد الأدنى: {formatNumber(stock.minStock)}</p>
                <p className="text-sm text-muted-foreground">الفرع: {stock.branch.name}</p>
                {canAdd && <AppButton className="mt-4" icon={Plus} onClick={() => openModal("add", stock)}>إضافة كمية</AppButton>}
              </AppCard>
            ))}
          </div>
        )
      )}

      {tab === "expiry" && (
        loading ? <LoadingSkeleton /> : expiryAlerts.length === 0 ? <EmptyState icon={Archive} title="لا توجد دفعات قرب الانتهاء" description="لا توجد دفعات تنتهي خلال 30 يومًا." /> : (
          <DataTable
            columns={["المنتج", "رقم الدفعة", "المتبقي", "تاريخ الانتهاء", "الأيام المتبقية", "الفرع"]}
            rows={expiryAlerts}
            renderRow={(batch) => (
              <tr key={batch.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{batch.product.name}</td>
                <td className="px-4 py-3">{batch.batchNumber ?? "-"}</td>
                <td className="px-4 py-3">{formatNumber(batch.remainingQuantity)} {batch.product.unitType}</td>
                <td className="px-4 py-3">{formatDate(batch.expiryDate)}</td>
                <td className="px-4 py-3">{batch.daysRemaining ?? "-"} يوم</td>
                <td className="px-4 py-3">{batch.branch.name}</td>
              </tr>
            )}
          />
        )
      )}

      {tab === "movements" && (
        loading ? <LoadingSkeleton /> : movements.length === 0 ? <EmptyState icon={History} title="لا توجد حركات" description="أي تغيير في المخزون سيظهر هنا." /> : (
          <DataTable
            columns={["التاريخ", "المنتج", "الفرع", "النوع", "الكمية", "قبل", "بعد", "المستخدم", "السبب", ""]}
            rows={movements}
            renderRow={(movement) => (
              <tr key={movement.id} className="border-t border-border">
                <td className="px-4 py-3">{formatDateTime(movement.createdAt)}</td>
                <td className="px-4 py-3 font-semibold">{movement.product?.name ?? "-"}</td>
                <td className="px-4 py-3">{movement.branch?.name ?? "-"}</td>
                <td className="px-4 py-3">{movementLabels[movement.type]}</td>
                <td className="px-4 py-3">{formatNumber(movement.quantity)}</td>
                <td className="px-4 py-3">{formatNumber(movement.quantityBefore)}</td>
                <td className="px-4 py-3">{formatNumber(movement.quantityAfter)}</td>
                <td className="px-4 py-3">{movement.user?.name ?? "-"}</td>
                <td className="px-4 py-3">{movement.reason ?? "-"}</td>
                <td className="px-4 py-3"><AppButton variant="ghost" icon={Eye} onClick={() => setSelectedMovement(movement)}>تفاصيل</AppButton></td>
              </tr>
            )}
          />
        )
      )}

      <InventoryActionModal
        mode={modalMode}
        stock={selectedStock}
        addForm={addForm}
        removeForm={removeForm}
        adjustForm={adjustForm}
        saving={saving}
        onAddChange={setAddForm}
        onRemoveChange={setRemoveForm}
        onAdjustChange={setAdjustForm}
        onClose={closeModal}
        onSave={saveInventoryAction}
      />
      <MovementDetailsModal movement={selectedMovement} onClose={() => setSelectedMovement(null)} />
    </div>
  );
}

function StockTable({ rows, canAdd, canRemove, canAdjust, onAction, onMovement }: {
  rows: InventoryStock[];
  canAdd: boolean;
  canRemove: boolean;
  canAdjust: boolean;
  onAction: (mode: ModalMode, stock: InventoryStock) => void;
  onMovement: (stock: InventoryStock) => void;
}) {
  if (rows.length === 0) return <EmptyState icon={Layers} title="لا توجد أرصدة مخزون" description="ابدأ بإضافة كمية لأي منتج من الكتالوج." />;
  return (
    <DataTable
      columns={["المنتج", "الباركود", "التصنيف", "الفرع", "الكمية الحالية", "الحد الأدنى", "الحالة", "آخر حركة", "الإجراءات"]}
      rows={rows}
      renderRow={(stock) => {
        const status = stockStatusLabels[stock.stockStatus];
        return (
          <tr key={stock.id} className="border-t border-border hover:bg-table-row-hover">
            <td className="px-4 py-3 font-semibold">{stock.product.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{stock.product.barcode ?? "-"}</td>
            <td className="px-4 py-3">{stock.product.category?.name ?? "-"}</td>
            <td className="px-4 py-3">{stock.branch.name}</td>
            <td className="px-4 py-3">{formatNumber(stock.quantity)} {stock.product.unitType}</td>
            <td className="px-4 py-3">{formatNumber(stock.minStock)}</td>
            <td className="px-4 py-3"><StatusBadge label={status.label} tone={status.tone} /></td>
            <td className="px-4 py-3">{formatDateTime(stock.lastMovementAt)}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {canAdd && <AppButton variant="outline" icon={Plus} onClick={() => onAction("add", stock)}>إضافة</AppButton>}
                {canRemove && <AppButton variant="ghost" icon={MinusCircle} onClick={() => onAction("remove", stock)}>خصم</AppButton>}
                {canAdjust && <AppButton variant="ghost" icon={SlidersHorizontal} onClick={() => onAction("adjust", stock)}>تعديل</AppButton>}
                <AppButton variant="ghost" icon={History} onClick={() => onMovement(stock)}>حركة</AppButton>
              </div>
            </td>
          </tr>
        );
      }}
    />
  );
}

function InventoryActionModal(props: {
  mode: ModalMode;
  stock: InventoryStock | null;
  addForm: { quantity: number; purchasePrice: string; expiryDate: string; batchNumber: string; reason: string; notes: string };
  removeForm: { quantity: number; type: RemoveStockPayload["type"]; reason: string; notes: string };
  adjustForm: { newQuantity: number; reason: string; notes: string };
  saving: boolean;
  onAddChange: (form: { quantity: number; purchasePrice: string; expiryDate: string; batchNumber: string; reason: string; notes: string }) => void;
  onRemoveChange: (form: { quantity: number; type: RemoveStockPayload["type"]; reason: string; notes: string }) => void;
  onAdjustChange: (form: { newQuantity: number; reason: string; notes: string }) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const { mode, stock } = props;
  const title = mode === "add" ? "إضافة كمية" : mode === "remove" ? "خصم تالف أو منتهي" : "تعديل يدوي";
  return (
    <Modal open={Boolean(mode && stock)} title={`${title}${stock ? ` - ${stock.product.name}` : ""}`} onClose={props.onClose}>
      {mode === "add" && (
        <div className="grid gap-3">
          <TextInput label="الكمية" type="number" min="0.001" step="0.001" value={props.addForm.quantity} onChange={(event) => props.onAddChange({ ...props.addForm, quantity: Number(event.target.value) })} />
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="سعر الشراء" type="number" value={props.addForm.purchasePrice} onChange={(event) => props.onAddChange({ ...props.addForm, purchasePrice: event.target.value })} />
            <TextInput label="تاريخ الصلاحية" type="date" value={props.addForm.expiryDate} onChange={(event) => props.onAddChange({ ...props.addForm, expiryDate: event.target.value })} />
          </div>
          <TextInput label="رقم الدفعة" value={props.addForm.batchNumber} onChange={(event) => props.onAddChange({ ...props.addForm, batchNumber: event.target.value })} />
          <TextInput label="السبب" value={props.addForm.reason} onChange={(event) => props.onAddChange({ ...props.addForm, reason: event.target.value })} />
          <TextInput label="ملاحظات" value={props.addForm.notes} onChange={(event) => props.onAddChange({ ...props.addForm, notes: event.target.value })} />
        </div>
      )}
      {mode === "remove" && (
        <div className="grid gap-3">
          <TextInput label="الكمية" type="number" min="0.001" step="0.001" value={props.removeForm.quantity} onChange={(event) => props.onRemoveChange({ ...props.removeForm, quantity: Number(event.target.value) })} />
          <SelectInput label="نوع الخصم" value={props.removeForm.type} onChange={(event) => props.onRemoveChange({ ...props.removeForm, type: event.target.value as RemoveStockPayload["type"] })}>
            <option value="DAMAGE">تالف</option>
            <option value="EXPIRED">منتهي الصلاحية</option>
            <option value="REMOVE_STOCK">خصم عادي</option>
          </SelectInput>
          <TextInput label="السبب" required value={props.removeForm.reason} onChange={(event) => props.onRemoveChange({ ...props.removeForm, reason: event.target.value })} />
          <TextInput label="ملاحظات" value={props.removeForm.notes} onChange={(event) => props.onRemoveChange({ ...props.removeForm, notes: event.target.value })} />
        </div>
      )}
      {mode === "adjust" && (
        <div className="grid gap-3">
          <TextInput label="الرصيد الجديد" type="number" min="0" step="0.001" value={props.adjustForm.newQuantity} onChange={(event) => props.onAdjustChange({ ...props.adjustForm, newQuantity: Number(event.target.value) })} />
          <TextInput label="السبب" required value={props.adjustForm.reason} onChange={(event) => props.onAdjustChange({ ...props.adjustForm, reason: event.target.value })} />
          <TextInput label="ملاحظات" value={props.adjustForm.notes} onChange={(event) => props.onAdjustChange({ ...props.adjustForm, notes: event.target.value })} />
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <AppButton variant="outline" onClick={props.onClose}>إلغاء</AppButton>
        <AppButton onClick={props.onSave} disabled={props.saving}>{props.saving ? "جار الحفظ..." : "حفظ"}</AppButton>
      </div>
    </Modal>
  );
}

function MovementDetailsModal({ movement, onClose }: { movement: InventoryMovement | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(movement)} title="تفاصيل حركة المخزون" onClose={onClose}>
      {movement && (
        <div className="grid gap-2 text-sm">
          <Detail label="المنتج" value={movement.product?.name ?? "-"} />
          <Detail label="النوع" value={movementLabels[movement.type]} />
          <Detail label="الكمية" value={formatNumber(movement.quantity)} />
          <Detail label="قبل" value={formatNumber(movement.quantityBefore)} />
          <Detail label="بعد" value={formatNumber(movement.quantityAfter)} />
          <Detail label="المستخدم" value={movement.user?.name ?? "-"} />
          <Detail label="السبب" value={movement.reason ?? "-"} />
          <Detail label="ملاحظات" value={movement.notes ?? "-"} />
        </div>
      )}
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 rounded-lg bg-muted p-3"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return <button type="button" onClick={onClick} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary"}`}>{children}</button>;
}

function setSelectedMovementFromStock(movements: InventoryMovement[], setSelectedMovement: (movement: InventoryMovement | null) => void) {
  return (stock: InventoryStock) => {
    setSelectedMovement(movements.find((movement) => movement.productId === stock.productId && movement.branchId === stock.branchId) ?? null);
  };
}

function formatNumber(value: number) {
  return value.toLocaleString("ar-EG", { maximumFractionDigits: 3 });
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG").format(new Date(value)) : "-";
}

function formatDateTime(value?: string | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}
