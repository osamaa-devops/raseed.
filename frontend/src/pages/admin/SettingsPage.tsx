import { useEffect, useState } from "react";
import { Barcode, Database, Monitor, Moon, Printer, Settings, Shield, Sun } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { useTheme } from "../../app/providers/ThemeProvider";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { settingsService } from "../../services/settingsService";
import { systemService } from "../../services/systemService";
import type { BackupStatus, BarcodeLabelSettings, BarcodeLabelSize, LicenseStatus, ReceiptPaperSize, ReceiptSettings } from "../../types";

type SettingsTab = "receipt" | "barcodes" | "system" | "hardware" | "theme";
type HardwareSettings = {
  receiptPrinterName: string;
  barcodePrinterName: string;
  scannerMode: "keyboard" | "serial";
  autoFocusBarcode: boolean;
  autoPrintReceipt: boolean;
  openCashDrawerAfterSale: boolean;
  receiptCopies: number;
};

const HARDWARE_SETTINGS_KEY = "raseed-hardware-settings";
const defaultHardwareSettings: HardwareSettings = {
  receiptPrinterName: "",
  barcodePrinterName: "",
  scannerMode: "keyboard",
  autoFocusBarcode: true,
  autoPrintReceipt: false,
  openCashDrawerAfterSale: false,
  receiptCopies: 1,
};

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { hasPermission } = useAuth();
  const canUpdateReceipt = hasPermission("settings.receipt.update");
  const canViewReceipt = hasPermission("settings.receipt.view") || canUpdateReceipt;
  const canManageBarcodes = hasPermission("printing.barcodes");
  const canManageSystem = hasPermission("backup.manage") || hasPermission("license.manage");
  const [receipt, setReceipt] = useState<ReceiptSettings | null>(null);
  const [barcode, setBarcode] = useState<BarcodeLabelSettings | null>(null);
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [backup, setBackup] = useState<BackupStatus | null>(null);
  const [hardware, setHardware] = useState<HardwareSettings>(defaultHardwareSettings);
  const [licenseKey, setLicenseKey] = useState("");
  const [backupPath, setBackupPath] = useState("");
  const [tab, setTab] = useState<SettingsTab>("receipt");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const availableTabs: SettingsTab[] = [
    ...(canViewReceipt ? ["receipt" as const] : []),
    ...(canManageBarcodes ? ["barcodes" as const] : []),
    ...(canManageSystem ? ["system" as const] : []),
    "hardware",
    "theme",
  ];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [receiptSettings, barcodeSettings] = await Promise.all([
        canViewReceipt ? settingsService.getReceiptSettings() : Promise.resolve(null),
        canManageBarcodes ? settingsService.getBarcodeLabelSettings() : Promise.resolve(null),
      ]);
      setReceipt(receiptSettings);
      setBarcode(barcodeSettings);
      if (canManageSystem) {
        const [licenseStatus, backupStatus] = await Promise.all([
          systemService.getLicenseStatus(),
          systemService.getBackupStatus().catch(() => null),
        ]);
        setLicense(licenseStatus);
        if (backupStatus) {
          setBackup(backupStatus);
          setBackupPath(backupStatus.lastBackupPath ?? "");
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [canManageSystem, canManageBarcodes, canViewReceipt]);

  useEffect(() => {
    if (!availableTabs.includes(tab)) {
      setTab(availableTabs[0] ?? "theme");
    }
  }, [availableTabs, tab]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HARDWARE_SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<HardwareSettings>;
      setHardware({ ...defaultHardwareSettings, ...parsed });
    } catch {
      setHardware(defaultHardwareSettings);
    }
  }, []);

  const saveReceipt = async () => {
    if (!receipt) return;
    setSaving("receipt");
    setError(null);
    try {
      setReceipt(await settingsService.updateReceiptSettings(receipt));
      setNotice("تم حفظ إعدادات الإيصال");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ إعدادات الإيصال");
    } finally {
      setSaving(null);
    }
  };

  const saveBarcode = async () => {
    if (!barcode) return;
    setSaving("barcodes");
    setError(null);
    try {
      setBarcode(await settingsService.updateBarcodeLabelSettings(barcode));
      setNotice("تم حفظ إعدادات ملصقات الباركود");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ إعدادات ملصقات الباركود");
    } finally {
      setSaving(null);
    }
  };

  const saveBackupDir = async () => {
    if (!backup) return;
    setSaving("backup-dir");
    try {
      const next = await systemService.updateBackupSettings(backup.backupDir);
      setBackup(next);
      setNotice("تم حفظ مجلد النسخ الاحتياطي");
    } finally {
      setSaving(null);
    }
  };

  const createBackup = async () => {
    setSaving("backup-create");
    try {
      const result = await systemService.createBackup();
      setNotice(`تم إنشاء نسخة احتياطية: ${result.outputPath}`);
      const next = await systemService.getBackupStatus();
      setBackup(next);
    } finally {
      setSaving(null);
    }
  };

  const restoreBackup = async () => {
    if (!backupPath.trim()) {
      setError("اختر ملف النسخة الاحتياطية أولًا");
      return;
    }
    setSaving("backup-restore");
    try {
      await systemService.restoreBackup(backupPath.trim());
      setNotice("تمت استعادة النسخة الاحتياطية");
    } finally {
      setSaving(null);
    }
  };

  const activateLicense = async () => {
    if (!licenseKey.trim()) return;
    setSaving("license");
    try {
      const result = await systemService.activateLicense(licenseKey.trim());
      setNotice(result.activated ? "تم تفعيل الترخيص" : "تعذر التفعيل");
      setLicense(await systemService.getLicenseStatus());
    } finally {
      setSaving(null);
    }
  };

  const chooseBackupDir = async () => {
    const directory = await window.raseedDesktop?.pickDirectory?.();
    if (!directory || !backup) return;
    setBackup({ ...backup, backupDir: directory });
  };

  const chooseBackupFile = async () => {
    const file = await window.raseedDesktop?.pickFile?.({ filters: [{ name: "Encrypted backup", extensions: ["enc"] }] });
    if (file) setBackupPath(file);
  };

  const revealBackupFolder = async () => {
    if (!backup?.lastBackupPath || !window.raseedDesktop?.showItemInFolder) return;
    await window.raseedDesktop.showItemInFolder(backup.lastBackupPath);
  };

  const saveHardware = () => {
    window.localStorage.setItem(HARDWARE_SETTINGS_KEY, JSON.stringify(hardware));
    setNotice("تم حفظ إعدادات الأجهزة على هذا الجهاز");
  };

  return (
    <div>
      <PageHeader title="الإعدادات" description="إعدادات الإيصال والباركود والنسخ الاحتياطي والترخيص." />
      {notice && <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{notice}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        {canViewReceipt && <Tab active={tab === "receipt"} onClick={() => setTab("receipt")} icon={Printer} label="إعدادات الإيصال" />}
        {canManageBarcodes && <Tab active={tab === "barcodes"} onClick={() => setTab("barcodes")} icon={Barcode} label="ملصقات الباركود" />}
        {canManageSystem && <Tab active={tab === "system"} onClick={() => setTab("system")} icon={Shield} label="الترخيص والنسخ" />}
        <Tab active={tab === "hardware"} onClick={() => setTab("hardware")} icon={Monitor} label="الأجهزة" />
        <Tab active={tab === "theme"} onClick={() => setTab("theme")} icon={Settings} label="المظهر" />
      </div>
      {loading && <AppCard>جار تحميل الإعدادات...</AppCard>}

      {!loading && tab === "receipt" && receipt && (
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Printer size={18} /> إعدادات الإيصال</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="اسم المتجر" value={receipt.storeName ?? ""} onChange={(event) => setReceipt({ ...receipt, storeName: event.target.value })} />
            <TextInput label="الهاتف" value={receipt.storePhone ?? ""} onChange={(event) => setReceipt({ ...receipt, storePhone: event.target.value })} />
            <TextInput label="العنوان" value={receipt.storeAddress ?? ""} onChange={(event) => setReceipt({ ...receipt, storeAddress: event.target.value })} />
            <SelectInput label="حجم الورق" value={receipt.paperSize} onChange={(event) => setReceipt({ ...receipt, paperSize: event.target.value as ReceiptPaperSize })}>
              <option value="MM_58">58mm</option>
              <option value="MM_80">80mm</option>
              <option value="A4">A4</option>
            </SelectInput>
            <TextInput label="رسالة أعلى الإيصال" value={receipt.receiptHeader ?? ""} onChange={(event) => setReceipt({ ...receipt, receiptHeader: event.target.value })} />
            <TextInput label="رسالة نهاية الإيصال" value={receipt.receiptFooter ?? ""} onChange={(event) => setReceipt({ ...receipt, receiptFooter: event.target.value })} />
            <TextInput label="رابط الشعار" value={receipt.logoUrl ?? ""} onChange={(event) => setReceipt({ ...receipt, logoUrl: event.target.value })} />
            <TextInput label="الرقم الضريبي" value={receipt.taxNumber ?? ""} onChange={(event) => setReceipt({ ...receipt, taxNumber: event.target.value })} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Check label="الشعار" checked={receipt.showLogo} onChange={(showLogo) => setReceipt({ ...receipt, showLogo })} />
            <Check label="الرقم الضريبي" checked={receipt.showTaxNumber} onChange={(showTaxNumber) => setReceipt({ ...receipt, showTaxNumber })} />
            <Check label="اسم الكاشير" checked={receipt.showCashierName} onChange={(showCashierName) => setReceipt({ ...receipt, showCashierName })} />
            <Check label="اسم الفرع" checked={receipt.showBranchName} onChange={(showBranchName) => setReceipt({ ...receipt, showBranchName })} />
            <Check label="بيانات العميل" checked={receipt.showCustomerInfo} onChange={(showCustomerInfo) => setReceipt({ ...receipt, showCustomerInfo })} />
          </div>
          <div className="mt-4 flex justify-end">
            <AppButton onClick={saveReceipt} disabled={!canUpdateReceipt || saving === "receipt"}>{saving === "receipt" ? "جار الحفظ..." : "حفظ إعدادات الإيصال"}</AppButton>
          </div>
        </AppCard>
      )}

      {!loading && tab === "barcodes" && barcode && (
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Barcode size={18} /> إعدادات ملصقات الباركود</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <SelectInput label="حجم الملصق" value={barcode.labelSize} onChange={(event) => setBarcode({ ...barcode, labelSize: event.target.value as BarcodeLabelSize })}>
              <option value="SMALL">صغير</option>
              <option value="MEDIUM">متوسط</option>
              <option value="LARGE">كبير</option>
              <option value="CUSTOM">مخصص</option>
            </SelectInput>
            <TextInput label="عدد الأعمدة" type="number" value={barcode.columns} onChange={(event) => setBarcode({ ...barcode, columns: Number(event.target.value) })} />
            <TextInput label="عدد الصفوف" type="number" value={barcode.rows ?? ""} onChange={(event) => setBarcode({ ...barcode, rows: event.target.value ? Number(event.target.value) : null })} />
            <TextInput label="الهامش العلوي" type="number" value={barcode.marginTop ?? ""} onChange={(event) => setBarcode({ ...barcode, marginTop: event.target.value ? Number(event.target.value) : null })} />
            <TextInput label="الهامش الأيمن" type="number" value={barcode.marginRight ?? ""} onChange={(event) => setBarcode({ ...barcode, marginRight: event.target.value ? Number(event.target.value) : null })} />
            <TextInput label="الهامش السفلي" type="number" value={barcode.marginBottom ?? ""} onChange={(event) => setBarcode({ ...barcode, marginBottom: event.target.value ? Number(event.target.value) : null })} />
            <TextInput label="الهامش الأيسر" type="number" value={barcode.marginLeft ?? ""} onChange={(event) => setBarcode({ ...barcode, marginLeft: event.target.value ? Number(event.target.value) : null })} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Check label="اسم المنتج" checked={barcode.showProductName} onChange={(showProductName) => setBarcode({ ...barcode, showProductName })} />
            <Check label="السعر" checked={barcode.showPrice} onChange={(showPrice) => setBarcode({ ...barcode, showPrice })} />
            <Check label="رقم الباركود" checked={barcode.showBarcodeText} onChange={(showBarcodeText) => setBarcode({ ...barcode, showBarcodeText })} />
          </div>
          <div className="mt-4 flex justify-end">
            <AppButton onClick={saveBarcode} disabled={saving === "barcodes"}>{saving === "barcodes" ? "جار الحفظ..." : "حفظ إعدادات الملصقات"}</AppButton>
          </div>
        </AppCard>
      )}

      {!loading && tab === "system" && canManageSystem && (
        <div className="grid gap-4 lg:grid-cols-2">
          <AppCard>
            <h2 className="mb-4 flex items-center gap-2 font-bold"><Shield size={18} /> حالة الترخيص</h2>
            {license && (
              <div className="space-y-3 text-sm">
                <p className="rounded-lg bg-muted p-3 font-semibold">{license.message}</p>
                <p><span className="font-semibold">البصمة:</span> <span className="break-all font-mono">{license.fingerprint}</span></p>
                <p><span className="font-semibold">الحالة:</span> {license.valid ? "مفعل" : "غير مفعل"}</p>
                <TextInput label="مفتاح التفعيل" placeholder="RASEED-XXXX-XXXX-XXXX-XXXX" value={licenseKey} onChange={(event) => setLicenseKey(event.target.value)} />
                <div className="flex gap-3">
                  <AppButton onClick={activateLicense} disabled={saving === "license"}>{saving === "license" ? "جار التفعيل..." : "تفعيل الترخيص"}</AppButton>
                </div>
              </div>
            )}
          </AppCard>

          <AppCard>
            <h2 className="mb-4 flex items-center gap-2 font-bold"><Database size={18} /> النسخ الاحتياطي</h2>
            {backup && (
              <div className="space-y-3 text-sm">
                <TextInput label="مجلد النسخ الاحتياطي" value={backup.backupDir} onChange={(event) => setBackup({ ...backup, backupDir: event.target.value })} />
                <div className="flex flex-wrap gap-2">
                  <AppButton variant="outline" onClick={chooseBackupDir}>اختيار مجلد</AppButton>
                  <AppButton onClick={saveBackupDir} disabled={saving === "backup-dir"}>{saving === "backup-dir" ? "جار الحفظ..." : "حفظ المجلد"}</AppButton>
                </div>
                <p><span className="font-semibold">آخر نسخة:</span> {backup.lastBackupAt ? new Date(backup.lastBackupAt).toLocaleString("ar-EG") : "لا توجد نسخة بعد"}</p>
                <p className="break-all"><span className="font-semibold">المسار الأخير:</span> {backup.lastBackupPath ?? "غير متاح"}</p>
                <div className="flex flex-wrap gap-2">
                  <AppButton onClick={createBackup} disabled={saving === "backup-create"}>{saving === "backup-create" ? "جار الإنشاء..." : "إنشاء نسخة الآن"}</AppButton>
                  <AppButton variant="outline" onClick={chooseBackupFile}>اختيار ملف للاستعادة</AppButton>
                  <AppButton variant="outline" onClick={revealBackupFolder} disabled={!backup.lastBackupPath || !window.raseedDesktop?.showItemInFolder}>فتح آخر نسخة</AppButton>
                  <AppButton variant="danger" onClick={restoreBackup} disabled={!backupPath.trim() || saving === "backup-restore"}>{saving === "backup-restore" ? "جار الاستعادة..." : "استعادة النسخة"}</AppButton>
                </div>
                <TextInput label="مسار ملف النسخة" value={backupPath} onChange={(event) => setBackupPath(event.target.value)} />
              </div>
            )}
          </AppCard>
        </div>
      )}

      {!loading && tab === "hardware" && (
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Monitor size={18} /> الأجهزة</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="اسم طابعة الإيصالات" value={hardware.receiptPrinterName} onChange={(event) => setHardware({ ...hardware, receiptPrinterName: event.target.value })} />
            <TextInput label="اسم طابعة الباركود" value={hardware.barcodePrinterName} onChange={(event) => setHardware({ ...hardware, barcodePrinterName: event.target.value })} />
            <SelectInput label="وضع قارئ الباركود" value={hardware.scannerMode} onChange={(event) => setHardware({ ...hardware, scannerMode: event.target.value as HardwareSettings["scannerMode"] })}>
              <option value="keyboard">Keyboard wedge</option>
              <option value="serial">Serial / COM</option>
            </SelectInput>
            <TextInput label="عدد نسخ الإيصال" type="number" value={hardware.receiptCopies} onChange={(event) => setHardware({ ...hardware, receiptCopies: Math.max(1, Number(event.target.value) || 1) })} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Check label="تركيز تلقائي على حقل الباركود" checked={hardware.autoFocusBarcode} onChange={(autoFocusBarcode) => setHardware({ ...hardware, autoFocusBarcode })} />
            <Check label="طباعة الإيصال تلقائيًا بعد البيع" checked={hardware.autoPrintReceipt} onChange={(autoPrintReceipt) => setHardware({ ...hardware, autoPrintReceipt })} />
            <Check label="فتح درج الكاش بعد البيع" checked={hardware.openCashDrawerAfterSale} onChange={(openCashDrawerAfterSale) => setHardware({ ...hardware, openCashDrawerAfterSale })} />
          </div>
          <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            هذه الإعدادات تحفظ محليًا على الجهاز الحالي. اختيار الملفات والمجلدات وعرضها يتفعل أكثر داخل نسخة سطح المكتب.
          </p>
          <div className="mt-4 flex justify-end">
            <AppButton onClick={saveHardware}>حفظ إعدادات الأجهزة</AppButton>
          </div>
        </AppCard>
      )}

      {!loading && tab === "theme" && (
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Settings size={18} /> المظهر</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { value: "light", label: "نهاري", icon: Sun },
              { value: "dark", label: "مظلم", icon: Moon },
              { value: "system", label: "حسب النظام", icon: Monitor },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                className={`rounded-lg border p-4 text-right transition ${theme === option.value ? "border-primary bg-secondary text-secondary-foreground" : "border-border hover:bg-muted"}`}
              >
                <option.icon className="mb-3" size={20} />
                <span className="font-bold">{option.label}</span>
              </button>
            ))}
          </div>
        </AppCard>
      )}

      {!loading && ((tab === "receipt" && !receipt) || (tab === "barcodes" && !barcode)) && (
        <AppCard>هذا القسم غير متاح بصلاحيات الحساب الحالي.</AppCard>
      )}
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Settings; label: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
      <Icon size={16} />
      {label}
    </button>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
