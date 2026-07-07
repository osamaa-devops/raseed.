import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { TextInput } from "../../components/forms/FormControls";
import { bootstrapService } from "../../services/bootstrapService";
import { canAccessPath } from "../../app/routes/accessControl";

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
      const response = await login(identity, password);
      if (response.role?.name === "super_admin") {
        navigate("/super-admin");
      } else if (canAccessPath(response, "/pos") && !canAccessPath(response, "/reports") && !canAccessPath(response, "/products")) {
        navigate("/pos");
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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white">ر</div>
          <h1 className="text-xl font-bold">تسجيل الدخول</h1>
          <p className="mt-1 text-sm text-muted-foreground">مرحبًا بك في رصيد</p>
        </div>
        <AppCard className="space-y-4">
          <TextInput label="رقم الهاتف أو البريد" placeholder="mahmoud@local" value={identity} onChange={(event) => setIdentity(event.target.value)} />
          <TextInput label="كلمة المرور" type="password" placeholder="********" value={password} onChange={(event) => setPassword(event.target.value)} />
          {needsSetup && (
            <p className="rounded-lg bg-warning/10 p-3 text-sm font-semibold text-warning">يبدو أن هذه أول مرة تشغّل فيها النظام. أكمل الإعداد الأولي قبل تسجيل الدخول.</p>
          )}
          {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
          <AppButton className="w-full" onClick={submit} disabled={isLoading}>{isLoading ? "جار تسجيل الدخول..." : "تسجيل الدخول"}</AppButton>
          {needsSetup && <AppButton variant="outline" className="w-full" onClick={() => navigate("/onboarding")}>بدء الإعداد</AppButton>}
          {import.meta.env.DEV && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">حسابات محلية للاختبار</p>
              <p>المالك: <span className="font-semibold">mahmoud@local</span> / <span className="font-semibold">hello2026</span></p>
              <p>الكاشير: <span className="font-semibold">ahmed@local</span> / <span className="font-semibold">hello2026</span></p>
            </div>
          )}
          <Link to="/contact" className="block text-center text-sm font-semibold text-primary">تواصل مع الدعم</Link>
        </AppCard>
      </div>
    </div>
  );
}
