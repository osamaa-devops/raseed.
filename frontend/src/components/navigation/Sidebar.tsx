import { NavLink } from "react-router";
import { LayoutDashboard } from "lucide-react";
import { dashboardNavGroups } from "./navigationConfig";

export function Sidebar() {
  return (
    <aside className="fixed right-0 top-0 z-30 flex h-full w-64 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground">
      <NavLink to="/dashboard" className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">ر</span>
        <div>
          <p className="font-bold text-white">رصيد</p>
          <p className="text-xs text-sidebar-foreground/70">ماركت المدينة</p>
        </div>
      </NavLink>
      <nav className="flex-1 overflow-y-auto py-4">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `mx-3 mb-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-primary/20 text-white" : "hover:bg-sidebar-accent hover:text-white"}`
          }
        >
          <LayoutDashboard size={17} />
          الرئيسية
        </NavLink>
        {dashboardNavGroups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-5 py-1 text-[11px] font-bold text-sidebar-foreground/50">{group.label}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `mx-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-primary/20 text-white" : "hover:bg-sidebar-accent hover:text-white"}`
                }
              >
                <item.icon size={17} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
