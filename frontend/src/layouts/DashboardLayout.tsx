import { Outlet } from "react-router";
import { Sidebar } from "../components/navigation/Sidebar";
import { Topbar } from "../components/navigation/Topbar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Sidebar />
      <Topbar />
      <main className="pt-24 md:mr-20 xl:mr-72">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
