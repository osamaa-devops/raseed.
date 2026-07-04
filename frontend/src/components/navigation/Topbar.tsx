import { Bell, ChevronDown, Circle, Store } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../app/providers/AuthProvider";
import { ThemeToggle } from "../theme/ThemeToggle";

export function Topbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed left-0 right-64 top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-topbar px-6">
      <div className="flex items-center gap-2 text-sm">
        <Store size={16} className="text-muted-foreground" />
        <span className="font-bold text-foreground">{auth?.store?.name ?? "رصيد"}</span>
        <span className="text-muted-foreground">/</span>
        <select className="bg-transparent text-muted-foreground outline-none">
          <option>{auth?.branch?.name ?? "بدون فرع"}</option>
        </select>
      </div>
      <div className="mr-auto flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Circle size={9} className="fill-success text-success" />
          متصل
        </span>
        <ThemeToggle />
        <button className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <Bell size={17} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
        </button>
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{auth?.user.name?.[0] ?? "ر"}</span>
          <div className="leading-tight">
            <span className="block text-sm font-semibold text-foreground">{auth?.user.name ?? "مستخدم"}</span>
            <span className="block text-[11px] text-muted-foreground">{auth?.role?.name ?? "role"}</span>
          </div>
          <ChevronDown size={14} className="text-muted-foreground" />
          <button type="button" onClick={handleLogout} className="mr-2 rounded-md px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10">خروج</button>
        </div>
      </div>
    </header>
  );
}
