import { Outlet } from "react-router";
import { Sidebar } from "../components/navigation/Sidebar";
import { Topbar } from "../components/navigation/Topbar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Sidebar />
      <Topbar />
      <main className="mr-64 pt-16">
        <div className="mx-auto max-w-7xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
