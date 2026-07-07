import { Bell, ChevronDown, Circle, Store } from "lucide-react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../app/providers/AuthProvider";
import { DemoModeBanner } from "../demo/DemoModeBanner";
import { ThemeToggle } from "../theme/ThemeToggle";
import { dashboardNavGroups } from "./navigationConfig";
import { isDemoStore } from "../../utils/demo";

export function Topbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const demoMode = isDemoStore(auth?.store);
  const navigationOptions = useMemo(
    () => [
      { label: "الرئيسية", path: "/dashboard" },
      ...dashboardNavGroups.flatMap((group) => group.items.map((item) => ({ label: item.label, path: item.path }))),
    ],
    [],
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-20 border-b border-border bg-topbar/95 backdrop-blur md:right-20 xl:right-72">
      <div className="flex min-h-20 flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 text-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary md:hidden">ر</span>
          <div className="flex items-center gap-2">
            <Store size={16} className="text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{auth?.store?.name ?? "رصيد"}</span>
                {demoMode && <DemoModeBanner compact />}
              </div>
              <p className="text-xs text-muted-foreground">{auth?.branch?.name ?? "بدون فرع"} • تشغيل يومي مباشر</p>
            </div>
          </div>
        </div>
        <div className="mr-auto flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
          <label className="md:hidden">
            <span className="sr-only">التنقل السريع</span>
            <select
              className="min-w-40 rounded-xl border border-border bg-input-background px-3 py-2 text-sm text-foreground outline-none"
              value={location.pathname}
              onChange={(event) => navigate(event.target.value)}
            >
              {navigationOptions.map((item) => (
                <option key={item.path} value={item.path}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <span className="hidden items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success md:inline-flex">
            <Circle size={9} className="fill-success text-success" />
            متصل
          </span>
          <ThemeToggle />
          <button className="relative rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <Bell size={17} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/80 px-2 py-1.5 hover:bg-muted">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{auth?.user.name?.[0] ?? "ر"}</span>
            <div className="leading-tight">
              <span className="block text-sm font-semibold text-foreground">{auth?.user.name ?? "مستخدم"}</span>
              <span className="block text-[11px] text-muted-foreground">{auth?.role?.name ?? "role"}</span>
            </div>
            <ChevronDown size={14} className="hidden text-muted-foreground md:block" />
            <button type="button" onClick={() => void handleLogout()} className="rounded-lg px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10">خروج</button>
          </div>
        </div>
      </div>
    </header>
  );
}
