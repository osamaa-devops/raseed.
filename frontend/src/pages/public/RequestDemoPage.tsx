import { useNavigate } from "react-router";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { SelectInput, TextInput } from "../../components/forms/FormControls";

export function RequestDemoPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <AppCard className="w-full max-w-lg space-y-4">
        <div>
          <h1 className="text-xl font-bold">اطلب تجربة رصيد</h1>
          <p className="mt-1 text-sm text-muted-foreground">بيانات أولية فقط، بدون تنفيذ تسجيل حقيقي الآن.</p>
        </div>
        <TextInput label="اسم المحل" placeholder="ماركت المدينة" />
        <TextInput label="اسم المالك" placeholder="محمد ناصر" />
        <TextInput label="رقم الهاتف" placeholder="01000000000" />
        <SelectInput label="نوع النشاط">
          <option>سوبر ماركت</option>
          <option>موبايلات</option>
          <option>إلكترونيات</option>
          <option>تجزئة عامة</option>
        </SelectInput>
        <AppButton className="w-full" onClick={() => navigate("/onboarding")}>متابعة الإعداد التجريبي</AppButton>
      </AppCard>
    </div>
  );
}
