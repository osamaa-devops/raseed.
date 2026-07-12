import { NavLink } from "react-router";
import { LayoutDashboard } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { dashboardNavGroups } from "./navigationConfig";
import { canAccessPath } from "../../app/routes/accessControl";
import { RaseedLogo } from "../brand/RaseedLogo";

export function Sidebar() {
  const { auth } = useAuth();

  return (
    <aside className="fixed right-0 top-0 z-30 hidden h-full w-20 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground md:flex xl:w-72">
      <NavLink to="/dashboard" className="flex h-20 items-center gap-3 border-b border-sidebar-border px-4 xl:px-5">
        <RaseedLogo mode="mark" tone="light" markClassName="h-11 w-11 rounded-2xl" />
        <RaseedLogo className="hidden xl:inline-flex" tone="light" subtitle={auth?.store?.name ?? "المتجر الحالي"} markClassName="hidden" />
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
    </aside>
  );
}
