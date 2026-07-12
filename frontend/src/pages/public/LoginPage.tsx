import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { TextInput } from "../../components/forms/FormControls";
import { bootstrapService } from "../../services/bootstrapService";
import { RaseedLogo } from "../../components/brand/RaseedLogo";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    void bootstrapService.getStatus().then((status) => setNeedsSetup(status.needsSetup)).catch(() => setNeedsSetup(false));
  }, []);

  const submit = async () => {
    setError(null);
    try {
      const response = await login(identity.trim(), password.trim());
      if (response.role?.name === "super_admin") {
        navigate("/super-admin");
      } else {
        navigate("/dashboard");
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "تعذر تسجيل الدخول");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <RaseedLogo mode="mark" className="mb-3 justify-center" markClassName="h-14 w-14 rounded-2xl" />
          <h1 className="text-xl font-bold">تسجيل الدخول</h1>
          <p className="mt-1 text-sm text-muted-foreground">مرحبًا بك في رصيد</p>
        </div>
        <AppCard className="space-y-4">
          <TextInput label="رقم الهاتف أو البريد" placeholder="owner@raseed.local" value={identity} onChange={(event) => setIdentity(event.target.value)} />
          <TextInput label="كلمة المرور" type="password" placeholder="********" value={password} onChange={(event) => setPassword(event.target.value)} />
          {needsSetup && (
            <p className="rounded-lg bg-warning/10 p-3 text-sm font-semibold text-warning">يبدو أن هذه أول مرة تشغّل فيها النظام. أكمل الإعداد الأولي قبل تسجيل الدخول.</p>
          )}
          {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
          <AppButton className="w-full" onClick={submit} disabled={isLoading}>{isLoading ? "جار تسجيل الدخول..." : "تسجيل الدخول"}</AppButton>
          <Link to="/" className="block">
            <AppButton variant="outline" className="w-full">الرجوع للصفحة الرئيسية</AppButton>
          </Link>
          {needsSetup && <AppButton variant="outline" className="w-full" onClick={() => navigate("/onboarding")}>بدء الإعداد</AppButton>}
          {import.meta.env.DEV && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">حسابات محلية للاختبار</p>
              <p>السوبر أدمن: <span className="font-semibold">admin@raseed.local</span> / <span className="font-semibold">RaseedAdmin!2026</span></p>
              <p>المالك: <span className="font-semibold">owner@raseed.local</span> / <span className="font-semibold">hello2026</span></p>
              <p>الكاشير: <span className="font-semibold">cashier@raseed.local</span> / <span className="font-semibold">hello2026</span></p>
            </div>
          )}
          <Link to="/contact" className="block text-center text-sm font-semibold text-primary">تواصل مع الدعم</Link>
        </AppCard>
      </div>
    </div>
  );
}
