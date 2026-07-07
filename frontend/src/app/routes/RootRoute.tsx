import { useEffect } from "react";
import { useNavigate } from "react-router";
import { bootstrapService } from "../../services/bootstrapService";

export function RootRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    void bootstrapService
      .getStatus()
      .then((status) => {
        navigate(status.needsSetup ? "/onboarding" : "/login", { replace: true });
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  return <div className="min-h-screen bg-background" dir="rtl" />;
}
