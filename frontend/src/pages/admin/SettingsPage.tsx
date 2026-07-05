import { useEffect, useState } from "react";
import { Barcode, Monitor, Moon, Printer, Settings, Sun } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { useTheme } from "../../app/providers/ThemeProvider";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { settingsService } from "../../services/settingsService";
import type { BarcodeLabelSettings, BarcodeLabelSize, ReceiptPaperSize, ReceiptSettings } from "../../types";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { hasPermission } = useAuth();
  const canUpdateReceipt = hasPermission("settings.receipt.update");
  const [receipt, setReceipt] = useState<ReceiptSettings | null>(null);
  const [barcode, setBarcode] = useState<BarcodeLabelSettings | null>(null);
  const [tab, setTab] = useState<"receipt" | "barcodes" | "hardware" | "theme">("receipt");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const [receiptSettings, barcodeSettings] = await Promise.all([
        settingsService.getReceiptSettings(),
        settingsService.getBarcodeLabelSettings(),
      ]);
      setReceipt(receiptSettings);
      setBarcode(barcodeSettings);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الإعدادات");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveReceipt = async () => {
    if (!receipt) return;
    setReceipt(await settingsService.updateReceiptSettings(receipt));
    setNotice("تم حفظ إعدادات الإيصال");
  };

  const saveBarcode = async () => {
    if (!barcode) return;
    setBarcode(await settingsService.updateBarcodeLabelSettings(barcode));
    setNotice("تم حفظ إعدادات ملصقات الباركود");
  };

  return (
    <div>
      <PageHeader title="الإعدادات" description="إعدادات الطباعة والملصقات والأجهزة للعرض التجريبي." />
      {notice && <p className="mb-4 rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{notice}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        <Tab active={tab === "receipt"} onClick={() => setTab("receipt")} icon={Printer} label="إعدادات الإيصال" />
        <Tab active={tab === "barcodes"} onClick={() => setTab("barcodes")} icon={Barcode} label="ملصقات الباركود" />
        <Tab active={tab === "hardware"} onClick={() => setTab("hardware")} icon={Monitor} label="الأجهزة" />
        <Tab active={tab === "theme"} onClick={() => setTab("theme")} icon={Settings} label="المظهر" />
      </div>

      {tab === "receipt" && receipt && (
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
            <AppButton onClick={saveReceipt} disabled={!canUpdateReceipt}>حفظ إعدادات الإيصال</AppButton>
          </div>
        </AppCard>
      )}

      {tab === "barcodes" && barcode && (
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
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Check label="اسم المنتج" checked={barcode.showProductName} onChange={(showProductName) => setBarcode({ ...barcode, showProductName })} />
            <Check label="السعر" checked={barcode.showPrice} onChange={(showPrice) => setBarcode({ ...barcode, showPrice })} />
            <Check label="رقم الباركود" checked={barcode.showBarcodeText} onChange={(showBarcodeText) => setBarcode({ ...barcode, showBarcodeText })} />
          </div>
          <div className="mt-4 flex justify-end">
            <AppButton onClick={saveBarcode}>حفظ إعدادات الملصقات</AppButton>
          </div>
        </AppCard>
      )}

      {tab === "hardware" && (
        <AppCard>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Monitor size={18} /> الأجهزة</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {["طابعة الإيصالات", "قارئ الباركود", "درج النقدية", "طابعة الباركود", "الميزان"].map((item) => (
              <div key={item} className="rounded-lg border border-border p-3">
                <p className="font-bold">{item}</p>
                <p className="text-sm text-muted-foreground">غير مفعّل في نسخة الويب الحالية.</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">الطباعة الصامتة وإعدادات الأجهزة المتقدمة ستتوفر في نسخة سطح المكتب.</p>
        </AppCard>
      )}

      {tab === "theme" && (
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
