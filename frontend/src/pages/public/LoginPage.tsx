import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { TextInput } from "../../components/forms/FormControls";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [identity, setIdentity] = useState("owner@raseed.local");
  const [password, setPassword] = useState("RaseedOwner!2026");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      const response = await login(identity, password);
      navigate(response.role?.name === "super_admin" ? "/super-admin" : "/dashboard");
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
          <TextInput label="رقم الهاتف أو البريد" placeholder="owner@raseed.local" value={identity} onChange={(event) => setIdentity(event.target.value)} />
          <TextInput label="كلمة المرور" type="password" placeholder="********" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
          <AppButton className="w-full" onClick={submit} disabled={isLoading}>{isLoading ? "جار تسجيل الدخول..." : "تسجيل الدخول"}</AppButton>
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">بيانات تجريبية:</p>
            <p>owner@raseed.local / RaseedOwner!2026</p>
            <p>admin@raseed.local / RaseedAdmin!2026</p>
          </div>
          <Link to="/request-demo" className="block text-center text-sm font-semibold text-primary">طلب تجربة جديدة</Link>
        </AppCard>
      </div>
    </div>
  );
}
