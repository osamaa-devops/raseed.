import { Link } from "react-router";
import { BarChart3, CheckCircle, Package, Receipt, ScanBarcode, ShieldCheck, Store, Users } from "lucide-react";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";

const benefits = [
  { icon: ScanBarcode, title: "بيع أسرع بالباركود" },
  { icon: Package, title: "متابعة المخزون لحظة بلحظة" },
  { icon: BarChart3, title: "تقارير أرباح واضحة" },
  { icon: Users, title: "صلاحيات للموظفين" },
  { icon: Receipt, title: "فواتير وطباعة" },
  { icon: Store, title: "مناسب لأكثر من نوع محل" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-white">ر</span>
            <span className="text-lg font-bold">رصيد</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login"><AppButton variant="ghost">تسجيل الدخول</AppButton></Link>
            <Link to="/request-demo"><AppButton>اطلب تجربة مجانية</AppButton></Link>
          </div>
        </div>
      </header>
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">
              <ShieldCheck size={14} />
              نظام POS عربي للسوبر ماركت والمحلات
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
              نظام كاشير ومخزون ذكي للسوبر ماركت والمحلات
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              تابع مبيعاتك، مخزونك، أرباحك، وموظفينك من مكان واحد.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/request-demo"><AppButton>اطلب تجربة مجانية</AppButton></Link>
              <Link to="/login"><AppButton variant="outline">شاهد العرض التوضيحي</AppButton></Link>
            </div>
          </div>
          <AppCard className="p-4">
            <div className="rounded-lg bg-sidebar p-4 text-white">
              <p className="text-sm text-white/70">ماركت المدينة</p>
              <p className="mt-2 text-3xl font-bold">8,500 ج</p>
              <p className="text-sm text-white/70">مبيعات اليوم</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["47 فاتورة", "3 منتجات منخفضة", "2,300 ج ربح", "شيفت نشط"].map((item) => (
                <div key={item} className="rounded-lg bg-muted p-3 text-sm font-bold">{item}</div>
              ))}
            </div>
          </AppCard>
        </section>
        <section className="border-y border-border bg-muted/40 py-14">
          <div className="mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <AppCard key={benefit.title}>
                <benefit.icon className="mb-3 text-primary" size={22} />
                <h2 className="font-bold">{benefit.title}</h2>
              </AppCard>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
