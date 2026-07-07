import { Outlet } from "react-router";
import { useNavigate } from "react-router";
import { Circle, Clock, Keyboard, ScanLine, Store, User } from "lucide-react";
import { useAuth } from "../app/providers/AuthProvider";
import { DemoModeBanner } from "../components/demo/DemoModeBanner";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import { isDemoStore } from "../utils/demo";

export function PosLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const demoMode = isDemoStore(auth?.store);
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-topbar/95 backdrop-blur">
        <div className="flex min-h-20 flex-wrap items-center gap-4 px-4 py-3 md:px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20">ر</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">رصيد POS</p>
                {demoMode && <DemoModeBanner compact />}
              </div>
              <p className="text-xs text-muted-foreground">واجهة بيع سريعة وواضحة للعرض أمام أصحاب المتاجر</p>
            </div>
          </div>
          <div className="mr-auto flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><Store size={15} /> {auth?.store?.name ?? "رصيد"} / {auth?.branch?.name ?? "بدون فرع"}</span>
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><User size={15} /> {auth?.user.name ?? "كاشير"}</span>
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><Clock size={15} /> شيفت العمل الحالي</span>
            <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-success"><Circle size={9} className="fill-success text-success" /> متصل</span>
            <span className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 lg:inline-flex"><ScanLine size={15} /> قارئ الباركود جاهز</span>
            <span className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 lg:inline-flex"><Keyboard size={15} /> Enter لإضافة أسرع</span>
            <ThemeToggle />
            <button type="button" onClick={() => void handleLogout()} className="rounded-xl px-3 py-2 text-danger hover:bg-danger/10">خروج</button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
