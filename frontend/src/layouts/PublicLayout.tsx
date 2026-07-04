import { Outlet } from "react-router";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Outlet />
    </div>
  );
}
