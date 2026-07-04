import { Outlet, useNavigate } from "react-router";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../app/providers/AuthProvider";
import { SuperAdminSidebar } from "../components/navigation/SuperAdminSidebar";
import { ThemeToggle } from "../components/theme/ThemeToggle";

export function SuperAdminLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <SuperAdminSidebar />
      <header className="fixed left-0 right-64 top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-topbar px-6">
        <ShieldCheck size={18} className="text-primary" />
        <span className="font-bold">لوحة تحكم منصة رصيد</span>
        <div className="mr-auto flex items-center gap-3">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">سوبر أدمن</span>
          <span className="text-sm text-muted-foreground">{auth?.user.name}</span>
          <ThemeToggle />
          <button type="button" onClick={handleLogout} className="rounded-lg px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/10">خروج</button>
        </div>
      </header>
      <main className="mr-64 pt-16">
        <div className="mx-auto max-w-7xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
