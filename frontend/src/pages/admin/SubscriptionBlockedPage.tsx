import { AlertTriangle, CreditCard, LifeBuoy } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { SUBSCRIPTION_BLOCKED_MESSAGE_KEY } from "../../services/apiClient";

export function SubscriptionBlockedPage() {
  const { auth } = useAuth();
  const canViewSubscription = Boolean(auth?.permissions.includes("subscription.view"));
  const blockedMessage = useMemo(() => sessionStorage.getItem(SUBSCRIPTION_BLOCKED_MESSAGE_KEY) ?? "انتهى اشتراك المتجر أو تم إيقافه. برجاء التواصل مع الدعم.", []);

  return (
    <div>
      <PageHeader title="الوصول متوقف" description="تم إيقاف الوصول التشغيلي لهذا المتجر حتى يتم تفعيل الاشتراك." />
      <AppCard className="border-danger/30 bg-danger/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 text-danger" size={18} />
          <div className="space-y-3">
            <div>
              <h2 className="font-bold text-danger">الاشتراك غير متاح</h2>
              <p className="mt-1 text-sm text-muted-foreground">{blockedMessage}</p>
            </div>
            {canViewSubscription ? (
              <p className="text-sm text-muted-foreground">يمكنك مراجعة تفاصيل الخطة الحالية وسجل الدفعات ثم التواصل مع الدعم لاستكمال التجديد أو إعادة التفعيل.</p>
            ) : (
              <p className="text-sm text-muted-foreground">هذا الحساب لا يملك صلاحية إدارة الاشتراك. برجاء الرجوع إلى مالك المتجر أو التواصل مع الدعم.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {canViewSubscription && (
                <Link to="/subscription-billing">
                  <AppButton icon={CreditCard}>عرض الاشتراك</AppButton>
                </Link>
              )}
              <Link to="/help">
                <AppButton variant="outline" icon={LifeBuoy}>المساعدة والدعم</AppButton>
              </Link>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  );
}
