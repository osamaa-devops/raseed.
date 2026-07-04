import { Outlet } from "react-router";
import { useNavigate } from "react-router";
import { Circle, Clock, Store, User } from "lucide-react";
import { useAuth } from "../app/providers/AuthProvider";
import { ThemeToggle } from "../components/theme/ThemeToggle";

export function PosLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="flex h-16 items-center gap-5 border-b border-border bg-topbar px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">ر</span>
          <div>
            <p className="font-bold">رصيد POS</p>
            <p className="text-xs text-muted-foreground">بيع سريع بدون تشتيت</p>
          </div>
        </div>
        <div className="mr-auto flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Store size={15} /> {auth?.store?.name ?? "رصيد"} / {auth?.branch?.name ?? "بدون فرع"}</span>
          <span className="flex items-center gap-1.5"><User size={15} /> {auth?.user.name ?? "كاشير"} ({auth?.role?.name ?? "role"})</span>
          <span className="flex items-center gap-1.5"><Clock size={15} /> شيفت صباحي</span>
          <span className="flex items-center gap-1.5"><Circle size={9} className="fill-success text-success" /> متصل</span>
          <ThemeToggle />
          <button type="button" onClick={handleLogout} className="rounded-lg px-3 py-2 text-danger hover:bg-danger/10">خروج</button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
