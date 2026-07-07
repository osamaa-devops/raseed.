import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { bootstrapService } from "../../services/bootstrapService";
import { systemService } from "../../services/systemService";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { TextInput } from "../../components/forms/FormControls";

export function ActivationPage() {
  const navigate = useNavigate();
  const [licenseKey, setLicenseKey] = useState("");
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [developmentBypass, setDevelopmentBypass] = useState(false);

  useEffect(() => {
    void systemService.getLicenseStatus().then((status) => {
      setFingerprint(status.fingerprint);
      setDevelopmentBypass(status.developmentBypass);
      setMessage(status.message);
      if (status.valid) {
        void bootstrapService.getStatus().then((bootstrap) => navigate(bootstrap.needsSetup ? "/onboarding" : "/login", { replace: true }));
      }
    });
  }, [navigate]);

  const fingerprintDisplay = useMemo(() => {
    if (!fingerprint) return "جارٍ التحميل...";
    return fingerprint.match(/.{1,4}/g)?.join("-") ?? fingerprint;
  }, [fingerprint]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await systemService.activateLicense(licenseKey.trim());
      if (response.activated) {
        const bootstrap = await bootstrapService.getStatus();
        navigate(bootstrap.needsSetup ? "/onboarding" : "/login", { replace: true });
      }
    } catch (activateError) {
      setError(activateError instanceof Error ? activateError.message : "تعذر تفعيل الترخيص");
    } finally {
      setBusy(false);
    }
  };

  if (developmentBypass) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4" dir="rtl">
        <AppCard className="w-full max-w-lg space-y-4">
          <h1 className="text-xl font-bold">التفعيل غير مطلوب في وضع التطوير</h1>
          <p className="text-sm text-muted-foreground">يمكنك المتابعة مباشرة إلى الإعداد أو تسجيل الدخول.</p>
          <AppButton onClick={async () => {
            const bootstrap = await bootstrapService.getStatus();
            navigate(bootstrap.needsSetup ? "/onboarding" : "/login", { replace: true });
          }}>
            المتابعة
          </AppButton>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4" dir="rtl">
      <AppCard className="w-full max-w-xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold">تفعيل الجهاز</h1>
          <p className="mt-1 text-sm text-muted-foreground">هذا الجهاز يحتاج تفعيلًا مرة واحدة قبل الاستخدام.</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">بصمة الجهاز</p>
          <p className="mt-2 break-all text-sm font-mono">{fingerprintDisplay}</p>
        </div>

        <TextInput label="مفتاح التفعيل" placeholder="RASEED-XXXX-XXXX-XXXX-XXXX" value={licenseKey} onChange={(event) => setLicenseKey(event.target.value)} />
        {message && <p className="rounded-lg bg-primary/10 p-3 text-sm font-semibold text-primary">{message}</p>}
        {error && <p className="rounded-lg bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <AppButton onClick={submit} disabled={busy || !licenseKey.trim()}>
            {busy ? "جار التفعيل..." : "تفعيل"}
          </AppButton>
        </div>
      </AppCard>
    </div>
  );
}
