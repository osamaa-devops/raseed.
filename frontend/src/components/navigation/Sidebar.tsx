import { NavLink } from "react-router";
import { LayoutDashboard } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { DemoModeBanner } from "../demo/DemoModeBanner";
import { isDemoStore } from "../../utils/demo";
import { dashboardNavGroups } from "./navigationConfig";
import { canAccessPath } from "../../app/routes/accessControl";

export function Sidebar() {
  const { auth } = useAuth();
  const demoMode = isDemoStore(auth?.store);

  return (
    <aside className="fixed right-0 top-0 z-30 hidden h-full w-20 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground md:flex xl:w-72">
      <NavLink to="/dashboard" className="flex h-20 items-center gap-3 border-b border-sidebar-border px-4 xl:px-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20">ر</span>
        <div className="hidden xl:block">
          <p className="font-bold text-white">رصيد</p>
          <p className="text-xs text-sidebar-foreground/70">{auth?.store?.name ?? "المتجر الحالي"}</p>
        </div>
      </NavLink>
      <nav className="flex-1 overflow-y-auto py-4">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `mx-3 mb-3 flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${isActive ? "bg-primary/20 text-white shadow-sm" : "hover:bg-sidebar-accent hover:text-white"}`
          }
          title="الرئيسية"
        >
          <LayoutDashboard size={17} />
          <span className="hidden xl:inline">الرئيسية</span>
        </NavLink>
        {dashboardNavGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="hidden px-5 py-1 text-[11px] font-bold tracking-[0.18em] text-sidebar-foreground/45 xl:block">{group.label}</p>
            {group.items.filter((item) => canAccessPath(auth, item.path)).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `mx-3 flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${isActive ? "bg-primary/20 text-white shadow-sm" : "hover:bg-sidebar-accent hover:text-white"}`
                }
                title={item.label}
              >
                <item.icon size={17} />
                <span className="hidden xl:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-3 py-4">
        <div className="hidden xl:block">{demoMode && <DemoModeBanner compact />}</div>
      </div>
    </aside>
  );
}
