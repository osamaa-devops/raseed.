import { useNavigate } from "react-router";
import { Store, Users, PackageCheck } from "lucide-react";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";

const steps = [
  { title: "بيانات المحل", icon: Store },
  { title: "الفروع والمستخدمين", icon: Users },
  { title: "تجهيز المنتجات", icon: PackageCheck },
];

export function OnboardingWizardPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <AppCard className="w-full max-w-2xl">
        <h1 className="text-xl font-bold">إعداد رصيد لأول مرة</h1>
        <p className="mt-1 text-sm text-muted-foreground">مسار إرشادي محفوظ للربط الحقيقي لاحقًا.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-xl border border-border bg-muted/30 p-4">
              <step.icon className="mb-3 text-primary" />
              <p className="font-bold">{step.title}</p>
            </div>
          ))}
        </div>
        <AppButton className="mt-6" onClick={() => navigate("/dashboard")}>إنهاء والذهاب للوحة التحكم</AppButton>
      </AppCard>
    </div>
  );
}
