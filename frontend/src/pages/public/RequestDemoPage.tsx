import { useState } from "react";
import { useNavigate } from "react-router";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { SelectInput, TextInput } from "../../components/forms/FormControls";
import { Textarea } from "../../components/ui/textarea";
import { demoRequestsService } from "../../services/demoRequestsService";

export function RequestDemoPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    storeName: "",
    ownerName: "",
    phone: "",
    email: "",
    businessType: "محل ملابس",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await demoRequestsService.create({
        storeName: form.storeName.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        businessType: form.businessType,
        notes: form.notes.trim() || undefined,
      });
      setSuccess("تم حفظ طلب التواصل. سيظهر في لوحة المنصة لمتابعته.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر تسجيل الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <AppCard className="w-full max-w-lg space-y-4">
        <div>
          <h1 className="text-xl font-bold">تواصل مع رصيد</h1>
          <p className="mt-1 text-sm text-muted-foreground">سجّل بيانات المحل، وسيتم حفظها للمتابعة من لوحة المنصة.</p>
        </div>
        <TextInput required label="اسم المحل" value={form.storeName} onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))} />
        <TextInput required label="اسم المالك" value={form.ownerName} onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))} />
        <TextInput required label="رقم الهاتف" placeholder="01000000000" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
        <TextInput label="البريد الإلكتروني" placeholder="owner@example.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        <SelectInput label="نوع النشاط" value={form.businessType} onChange={(event) => setForm((current) => ({ ...current, businessType: event.target.value }))}>
          <option>محل ملابس</option>
          <option>بوتيك</option>
          <option>أحذية</option>
          <option>إكسسوارات</option>
          <option>تجزئة عامة</option>
        </SelectInput>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground">ملاحظات</span>
          <Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="أي تفاصيل إضافية تريد أن يراها فريق المتابعة" />
        </label>
        {success && <p className="rounded-lg bg-success/10 p-3 text-sm font-semibold text-success">{success}</p>}
        {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
        <div className="flex gap-2">
          <AppButton className="flex-1" onClick={submit} disabled={submitting || !form.storeName.trim() || !form.ownerName.trim() || !form.phone.trim()}>
            {submitting ? "جار الحفظ..." : "إرسال الطلب"}
          </AppButton>
          <AppButton variant="outline" className="flex-1" onClick={() => navigate("/login")}>العودة</AppButton>
        </div>
      </AppCard>
    </div>
  );
}
