import { Link, Outlet } from "react-router";
import { useNavigate } from "react-router";
import { Clock, Home, Keyboard, LogOut, ScanLine, Store, User } from "lucide-react";
import { useAuth } from "../app/providers/AuthProvider";
import { ConnectionPill } from "../components/status/ConnectionPill";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export function PosLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const handleExitPos = () => {
    navigate("/dashboard");
  };
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-topbar/95 backdrop-blur">
        <div className="flex min-h-20 flex-wrap items-center gap-4 px-4 py-3 md:px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20">ر</span>
            <div>
              <p className="font-bold">رصيد POS</p>
              <p className="text-xs text-muted-foreground">واجهة بيع سريعة وواضحة للاستخدام اليومي داخل المحل</p>
            </div>
          </div>
          <div className="mr-auto flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><Store size={15} /> {auth?.store?.name ?? "رصيد"} / {auth?.branch?.name ?? "بدون فرع"}</span>
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><User size={15} /> {auth?.user.name ?? "كاشير"}</span>
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><Clock size={15} /> شيفت العمل الحالي</span>
            <ConnectionPill isOnline={isOnline} />
            <span className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 lg:inline-flex"><ScanLine size={15} /> قارئ الباركود جاهز</span>
            <span className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 lg:inline-flex"><Keyboard size={15} /> Enter لإضافة أسرع</span>
            <ThemeToggle />
            <button type="button" onClick={handleExitPos} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground hover:bg-muted">
              <Home size={16} />
              الداشبورد
            </button>
            <button type="button" onClick={() => void handleLogout()} className="inline-flex items-center gap-1.5 rounded-xl bg-danger px-3 py-2 font-semibold text-white hover:bg-danger/90">
              <LogOut size={16} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
