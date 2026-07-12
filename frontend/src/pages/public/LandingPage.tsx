import { Link } from "react-router";
import { BarChart3, CheckCircle, Package, Receipt, ScanBarcode, ShieldCheck, Store, Users } from "lucide-react";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { RaseedLogo } from "../../components/brand/RaseedLogo";

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
            <RaseedLogo markClassName="h-9 w-9 rounded-lg" />
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login"><AppButton variant="ghost">تسجيل الدخول</AppButton></Link>
            <Link to="/contact"><AppButton>تواصل مع الدعم</AppButton></Link>
          </div>
        </div>
      </header>
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">
              <ShieldCheck size={14} />
              نظام POS عربي للمحال المحلية
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
              نظام كاشير ومخزون ذكي للمحل الحقيقي
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              اشتغل محليًا على جهازك، وسجّل المبيعات، وتابع المخزون، واطبع الإيصالات من شاشة واحدة.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login"><AppButton>ابدأ التشغيل</AppButton></Link>
              <Link to="/contact"><AppButton variant="outline">طلب تواصل</AppButton></Link>
            </div>
          </div>
          <AppCard className="p-4">
            <div className="rounded-lg bg-sidebar p-4 text-white">
              <p className="text-sm text-white/70">تشغيل محلي</p>
              <p className="mt-2 text-3xl font-bold">بدون إنترنت</p>
              <p className="text-sm text-white/70">نسخة جاهزة للمحل</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["بيع بالباركود", "صلاحيات للموظفين", "إيصال سريع", "شيفت مفتوح"].map((item) => (
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
