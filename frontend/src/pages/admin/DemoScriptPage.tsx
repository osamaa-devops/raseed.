import { MonitorPlay, Printer, RotateCcw, ShieldCheck, ShoppingCart, Upload } from "lucide-react";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";

const steps = [
  { title: "تسجيل الدخول", description: "ادخل بحساب المالك التجريبي لفتح لوحة ماركت المدينة وعرض المؤشرات الجاهزة." },
  { title: "فتح الكاشير", description: "اذهب إلى شاشة POS وامسح باركود منتج أو ابحث بالاسم لإظهار سرعة البيع." },
  { title: "إتمام البيع", description: "أكمل فاتورة نقدية واظهر شاشة النجاح ثم افتح معاينة الإيصال للطباعة." },
  { title: "طباعة الإيصال", description: "اعرض الإيصال بالأبيض والأسود لتوضيح جاهزية الطباعة الحرارية." },
  { title: "فحص المخزون", description: "انتقل إلى المخزون لتوضيح أن الكمية انخفضت تلقائيًا مع حركة SALE." },
  { title: "إنشاء مرتجع", description: "افتح صفحة المرتجعات، أنشئ مرتجعًا من آخر فاتورة، ثم اشرح رجوع الكمية للمخزون." },
  { title: "مراجعة لوحة التحكم", description: "ارجع للداشبورد لشرح المبيعات، الربح، الفواتير، وأفضل المنتجات في أقل من دقيقة." },
  { title: "عرض التقارير", description: "افتح التقارير وغيّر التاريخ لتوضيح مبيعات اليوم والربح وطرق الدفع." },
  { title: "استيراد المنتجات", description: "ادخل صفحة الاستيراد والتصدير لعرض ملف Excel الجاهز والاستيراد الآمن." },
  { title: "طباعة الباركود", description: "من صفحة المنتجات اختر أصنافًا ثم افتح معاينة ملصقات الباركود." },
  { title: "لوحة SaaS", description: "سجّل بحساب الأدمن لعرض المتاجر والخطط والمدفوعات وإدارة المنصة." },
];

const highlights = [
  { icon: ShoppingCart, title: "أفضل بداية", description: "ابدأ بالكاشير لأنه أسرع شاشة تبين قيمة رصيد فورًا." },
  { icon: Printer, title: "لحظة الإقناع", description: "الإيصال والباركود يوضحان أن النظام عملي وليس مجرد واجهة عرض." },
  { icon: RotateCcw, title: "المرونة", description: "المرتجع يبين أن المخزون والفواتير يظلان متزامنين بدون عمل يدوي." },
  { icon: Upload, title: "الانتقال السريع", description: "الاستيراد من Excel يطمئن صاحب المتجر أن بدء التشغيل لن يأخذ وقتًا طويلًا." },
  { icon: ShieldCheck, title: "زاوية SaaS", description: "لوحة المنصة توضح أن رصيد مناسب للتوسع كخدمة SaaS متعددة المتاجر." },
  { icon: MonitorPlay, title: "خاتمة العرض", description: "اختم بالداشبورد والتقارير لإظهار أن القرار اليومي صار أوضح وأسرع." },
];

export function DemoScriptPage() {
  return (
    <div>
      <PageHeader title="سيناريو العرض" description="خطوات قصيرة ومنظمة لعرض رصيد أمام أصحاب السوبر ماركت والمتاجر بشكل احترافي." />
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <AppCard>
          <h2 className="mb-4 text-lg font-bold">خطوات الديمو المقترحة</h2>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-semibold text-primary">الخطوة {index + 1}</p>
                <h3 className="mt-1 font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </AppCard>
        <div className="grid gap-4 sm:grid-cols-2">
          {highlights.map((item) => (
            <AppCard key={item.title}>
              <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                <item.icon size={20} />
              </span>
              <h2 className="mt-4 font-bold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </AppCard>
          ))}
        </div>
      </div>
    </div>
  );
}
