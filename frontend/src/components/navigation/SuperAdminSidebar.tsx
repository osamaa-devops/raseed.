import { NavLink } from "react-router";
import { superAdminNav } from "./navigationConfig";
import { RaseedLogo } from "../brand/RaseedLogo";

export function SuperAdminSidebar() {
  return (
    <aside className="fixed right-0 top-0 z-30 flex h-full w-64 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <RaseedLogo tone="light" subtitle="إدارة المنصة" markClassName="h-9 w-9 rounded-lg" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {superAdminNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/super-admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-primary/20 text-white" : "hover:bg-sidebar-accent hover:text-white"}`
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
