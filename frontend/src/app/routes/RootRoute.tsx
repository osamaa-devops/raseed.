import { useEffect } from "react";
import { useNavigate } from "react-router";
import { bootstrapService } from "../../services/bootstrapService";
import { systemService } from "../../services/systemService";

export function RootRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    void Promise.all([bootstrapService.getStatus(), systemService.getLicenseStatus()])
      .then(([bootstrap, license]) => {
        if (!license.developmentBypass && !license.valid) {
          navigate("/activate", { replace: true });
          return;
        }

        navigate(bootstrap.needsSetup ? "/onboarding" : "/login", { replace: true });
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  return <div className="min-h-screen bg-background" dir="rtl" />;
}
