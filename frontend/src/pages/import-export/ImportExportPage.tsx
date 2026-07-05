import { useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { importExportService } from "../../services/importExportService";
import type { ExportFormat, ImportIssue, ImportPreviewResult, ImportSummary, ProductImportMode, StockImportMode } from "../../types";

const exportItems = [
  { label: "المنتجات", action: importExportService.exportProducts, permission: "products.export" },
  { label: "المخزون", action: importExportService.exportInventory, permission: "inventory.export" },
  { label: "الفواتير", action: importExportService.exportInvoices, permission: "data.export" },
  { label: "المصاريف", action: importExportService.exportExpenses, permission: "data.export" },
  { label: "العملاء", action: importExportService.exportCustomers, permission: "data.export" },
  { label: "الموردين", action: importExportService.exportSuppliers, permission: "data.export" },
  { label: "تقرير المبيعات اليومية", action: importExportService.exportDailySalesReport, permission: "reports.export" },
  { label: "تقرير الأرباح", action: importExportService.exportProfitReport, permission: "reports.export" },
  { label: "تقرير قيمة المخزون", action: importExportService.exportInventoryValueReport, permission: "reports.export" },
];

export function ImportExportPage() {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<"products" | "stock" | "exports" | "templates">("products");
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [productFile, setProductFile] = useState<File | null>(null);
  const [stockFile, setStockFile] = useState<File | null>(null);
  const [productMode, setProductMode] = useState<ProductImportMode>("UPSERT");
  const [stockMode, setStockMode] = useState<StockImportMode>("ADD_TO_EXISTING");
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canImportProducts = hasPermission("products.import") || hasPermission("data.import");
  const canImportInventory = hasPermission("inventory.import") || hasPermission("data.import");

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "تعذر تنفيذ العملية");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="الاستيراد والتصدير" description="قوالب آمنة، معاينة قبل الاستيراد، وتصدير بيانات المتجر." />
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      {summary && <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">تم التنفيذ: إنشاء {summary.created}، تحديث {summary.updated}، تخطي {summary.skipped}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        <Tab active={tab === "products"} onClick={() => { setTab("products"); setPreview(null); }} label="استيراد المنتجات" />
        <Tab active={tab === "stock"} onClick={() => { setTab("stock"); setPreview(null); }} label="استيراد رصيد المخزون" />
        <Tab active={tab === "exports"} onClick={() => setTab("exports")} label="تصدير البيانات" />
        <Tab active={tab === "templates"} onClick={() => setTab("templates")} label="القوالب" />
      </div>

      {tab === "products" && (
        <AppCard>
          <SectionTitle icon={Upload} title="استيراد المنتجات" />
          {!canImportProducts ? <p className="text-sm text-muted-foreground">لا تملك صلاحية استيراد المنتجات.</p> : (
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                <SelectInput label="وضع الاستيراد" value={productMode} onChange={(event) => setProductMode(event.target.value as ProductImportMode)}>
                  <option value="UPSERT">إنشاء وتحديث</option>
                  <option value="CREATE_ONLY">إنشاء فقط</option>
                </SelectInput>
                <FileInput label="ملف المنتجات" onChange={setProductFile} />
                <div className="flex items-end gap-2">
                  <AppButton variant="outline" icon={Download} onClick={() => void run(() => importExportService.downloadProductTemplate("xlsx"))}>القالب</AppButton>
                  <AppButton icon={FileSpreadsheet} disabled={!productFile || busy} onClick={() => productFile && void run(async () => setPreview(await importExportService.previewProductsImport(productFile, productMode)))}>معاينة</AppButton>
                </div>
              </div>
              <PreviewBlock preview={preview} />
              {preview && <AppButton disabled={!productFile || busy || preview.invalidRows > 0} onClick={() => productFile && void run(async () => setSummary(await importExportService.importProducts(productFile, productMode)))}>تأكيد الاستيراد</AppButton>}
            </div>
          )}
        </AppCard>
      )}

      {tab === "stock" && (
        <AppCard>
          <SectionTitle icon={Upload} title="استيراد رصيد المخزون" />
          {!canImportInventory ? <p className="text-sm text-muted-foreground">لا تملك صلاحية استيراد المخزون.</p> : (
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                <SelectInput label="وضع المخزون" value={stockMode} onChange={(event) => setStockMode(event.target.value as StockImportMode)}>
                  <option value="ADD_TO_EXISTING">إضافة على الرصيد الحالي</option>
                  <option value="SET_INITIAL_QUANTITY">تعيين الكمية كبداية</option>
                </SelectInput>
                <FileInput label="ملف المخزون" onChange={setStockFile} />
                <div className="flex items-end gap-2">
                  <AppButton variant="outline" icon={Download} onClick={() => void run(() => importExportService.downloadInitialStockTemplate("xlsx"))}>القالب</AppButton>
                  <AppButton icon={FileSpreadsheet} disabled={!stockFile || busy} onClick={() => stockFile && void run(async () => setPreview(await importExportService.previewInitialStockImport(stockFile, stockMode)))}>معاينة</AppButton>
                </div>
              </div>
              <PreviewBlock preview={preview} />
              {preview && <AppButton disabled={!stockFile || busy || preview.invalidRows > 0} onClick={() => stockFile && void run(async () => setSummary(await importExportService.importInitialStock(stockFile, stockMode)))}>تأكيد الاستيراد</AppButton>}
            </div>
          )}
        </AppCard>
      )}

      {tab === "exports" && (
        <AppCard>
          <SectionTitle icon={Download} title="تصدير البيانات" />
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <SelectInput label="الصيغة" value={format} onChange={(event) => setFormat(event.target.value as ExportFormat)}>
              <option value="xlsx">Excel</option>
              <option value="csv">CSV</option>
            </SelectInput>
            <TextInput label="من تاريخ" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <TextInput label="إلى تاريخ" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {exportItems.filter((item) => hasPermission(item.permission)).map((item) => (
              <button key={item.label} className="rounded-lg border border-border bg-card p-4 text-right transition hover:bg-muted" onClick={() => void run(() => item.action(format, { dateFrom, dateTo }))}>
                <Download className="mb-3" size={18} />
                <span className="font-bold">{item.label}</span>
              </button>
            ))}
          </div>
        </AppCard>
      )}

      {tab === "templates" && (
        <AppCard>
          <SectionTitle icon={FileSpreadsheet} title="القوالب" />
          <div className="grid gap-3 md:grid-cols-2">
            <AppButton variant="outline" icon={Download} onClick={() => void run(() => importExportService.downloadProductTemplate("xlsx"))}>قالب المنتجات Excel</AppButton>
            <AppButton variant="outline" icon={Download} onClick={() => void run(() => importExportService.downloadProductTemplate("csv"))}>قالب المنتجات CSV</AppButton>
            <AppButton variant="outline" icon={Download} onClick={() => void run(() => importExportService.downloadInitialStockTemplate("xlsx"))}>قالب المخزون Excel</AppButton>
            <AppButton variant="outline" icon={Download} onClick={() => void run(() => importExportService.downloadInitialStockTemplate("csv"))}>قالب المخزون CSV</AppButton>
          </div>
        </AppCard>
      )}
    </div>
  );
}

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button className={`rounded-lg border px-4 py-2 text-sm font-bold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`} onClick={onClick}>{label}</button>;
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Upload; title: string }) {
  return <h2 className="mb-4 flex items-center gap-2 font-bold"><Icon size={18} /> {title}</h2>;
}

function FileInput({ label, onChange }: { label: string; onChange: (file: File | null) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input className="rounded-lg border border-border bg-background p-2" type="file" accept=".xlsx,.csv" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
    </label>
  );
}

export function PreviewBlock({ preview }: { preview: ImportPreviewResult | null }) {
  if (!preview) return null;
  return (
    <div className="grid gap-3">
      <div className="grid gap-2 rounded-lg bg-muted p-3 text-sm md:grid-cols-5">
        <span>الإجمالي: {preview.totalRows}</span>
        <span>صالح: {preview.validRows}</span>
        <span>أخطاء: {preview.invalidRows}</span>
        <span>إنشاء: {preview.createCount}</span>
        <span>تحديث: {preview.updateCount}</span>
      </div>
      <IssueTable title="الأخطاء" issues={preview.errors} />
      <IssueTable title="التحذيرات" issues={preview.warnings} />
    </div>
  );
}

function IssueTable({ title, issues }: { title: string; issues: ImportIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="bg-muted px-3 py-2 font-bold">{title}</div>
      <table className="w-full text-sm">
        <thead><tr className="bg-muted/50"><th className="px-3 py-2 text-right">الصف</th><th className="px-3 py-2 text-right">الحقل</th><th className="px-3 py-2 text-right">الرسالة</th></tr></thead>
        <tbody>{issues.map((issue, index) => <tr key={`${issue.row}-${issue.field}-${index}`} className="border-t border-border"><td className="px-3 py-2">{issue.row}</td><td className="px-3 py-2">{issue.field}</td><td className="px-3 py-2">{issue.message}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
