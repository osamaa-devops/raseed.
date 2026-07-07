import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Store, ShieldUser, FileText } from "lucide-react";
import { bootstrapService } from "../../services/bootstrapService";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { TextInput } from "../../components/forms/FormControls";

const initialForm = {
  shopName: "",
  shopPhone: "",
  shopAddress: "",
  receiptFooter: "شكراً لتعاملكم معنا",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerPassword: "",
};

export function OnboardingWizardPage() {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const steps = useMemo(() => [
    { title: "بيانات المحل", icon: Store, fields: ["shopName", "shopPhone", "shopAddress", "receiptFooter"] as const },
    { title: "حساب المالك", icon: ShieldUser, fields: ["ownerName", "ownerEmail", "ownerPhone", "ownerPassword"] as const },
    { title: "مراجعة", icon: FileText, fields: [] as const },
  ], []);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await bootstrapService.setup({
        shopName: form.shopName,
        shopPhone: form.shopPhone,
        shopAddress: form.shopAddress,
        receiptFooter: form.receiptFooter,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail || undefined,
        ownerPhone: form.ownerPhone,
        ownerPassword: form.ownerPassword,
      });
      await refreshMe();
      navigate("/login", { replace: true });
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "تعذر إكمال الإعداد الأولي");
    } finally {
      setSaving(false);
    }
  };

  const current = steps[step];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4" dir="rtl">
      <AppCard className="w-full max-w-3xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold">إعداد أول تشغيل</h1>
            <p className="mt-1 text-sm text-muted-foreground">نشأ متجر جديد على الجهاز المحلي. ابدأ ببيانات المحل ثم أنشئ حساب المالك.</p>
          </div>
          <div className="rounded-2xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary">خطوة {step + 1} من {steps.length}</div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-xl border p-4 text-right transition ${index === step ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/40"}`}
              >
                <Icon className="mb-3 text-primary" size={18} />
                <p className="font-bold">{item.title}</p>
              </button>
            );
          })}
        </div>
        {step === 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="اسم المحل" value={form.shopName} onChange={(event) => setForm((currentForm) => ({ ...currentForm, shopName: event.target.value }))} />
            <TextInput label="هاتف المحل" value={form.shopPhone} onChange={(event) => setForm((currentForm) => ({ ...currentForm, shopPhone: event.target.value }))} />
            <TextInput className="md:col-span-2" label="العنوان" value={form.shopAddress} onChange={(event) => setForm((currentForm) => ({ ...currentForm, shopAddress: event.target.value }))} />
            <TextInput className="md:col-span-2" label="تذييل الفاتورة" value={form.receiptFooter} onChange={(event) => setForm((currentForm) => ({ ...currentForm, receiptFooter: event.target.value }))} />
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="اسم المالك" value={form.ownerName} onChange={(event) => setForm((currentForm) => ({ ...currentForm, ownerName: event.target.value }))} />
            <TextInput label="البريد الإلكتروني" value={form.ownerEmail} onChange={(event) => setForm((currentForm) => ({ ...currentForm, ownerEmail: event.target.value }))} />
            <TextInput label="هاتف المالك" value={form.ownerPhone} onChange={(event) => setForm((currentForm) => ({ ...currentForm, ownerPhone: event.target.value }))} />
            <TextInput label="كلمة المرور" type="password" value={form.ownerPassword} onChange={(event) => setForm((currentForm) => ({ ...currentForm, ownerPassword: event.target.value }))} />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <p><span className="font-semibold">المحل:</span> {form.shopName || "-"}</p>
            <p><span className="font-semibold">المالك:</span> {form.ownerName || "-"}</p>
            <p><span className="font-semibold">الهاتف:</span> {form.ownerPhone || "-"}</p>
            <p><span className="font-semibold">العنوان:</span> {form.shopAddress || "-"}</p>
          </div>
        )}
        {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
        <div className="flex flex-wrap justify-between gap-3">
          <AppButton variant="outline" onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))} disabled={step === 0 || saving}>السابق</AppButton>
          <div className="flex gap-2">
            {step < steps.length - 1 ? (
              <AppButton onClick={() => setStep((currentStep) => Math.min(steps.length - 1, currentStep + 1))} disabled={saving}>التالي</AppButton>
            ) : (
              <AppButton onClick={() => void submit()} disabled={saving}>{saving ? "جار الإعداد..." : "إنهاء الإعداد"}</AppButton>
            )}
          </div>
        </div>
      </AppCard>
    </div>
  );
}
