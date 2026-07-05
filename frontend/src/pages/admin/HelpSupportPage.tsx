import { HelpCircle, PlaySquare } from "lucide-react";
import { Link } from "react-router";
import { AppCard } from "../../components/ui/AppCard";
import { AppButton } from "../../components/ui/AppButton";
import { PageHeader } from "../../components/ui/PageHeader";

export function HelpSupportPage() {
  return (
    <div>
      <PageHeader title="المساعدة والدعم" description="روابط سريعة للدعم الداخلي وتجهيز العرض أمام العملاء." />
      <div className="grid gap-4 lg:grid-cols-2">
        <AppCard>
          <span className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><HelpCircle size={20} /></span>
          <h2 className="mt-4 font-bold">مركز المساعدة</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">هذه الصفحة محفوظة لربط قاعدة المعرفة، الأسئلة الشائعة، والتواصل مع الدعم الفني في مرحلة لاحقة.</p>
        </AppCard>
        <AppCard>
          <span className="inline-flex rounded-2xl bg-warning/10 p-3 text-warning"><PlaySquare size={20} /></span>
          <h2 className="mt-4 font-bold">سيناريو العرض</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">افتح خطوات الديمو الجاهزة عند عرض رصيد على مالك متجر أو مدير سلسلة فروع.</p>
          <Link to="/demo-script" className="mt-4 inline-flex">
            <AppButton variant="outline">فتح سيناريو العرض</AppButton>
          </Link>
        </AppCard>
      </div>
    </div>
  );
}
