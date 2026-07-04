import { Bell } from "lucide-react";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { demoNotifications } from "../../data/demo/demoUsers";

export function NotificationsPage() {
  return (
    <div>
      <PageHeader title="التنبيهات" description="تنبيهات المخزون والشيفتات والاشتراك." />
      <div className="space-y-3">
        {demoNotifications.map((notification) => (
          <AppCard key={notification.id} className="flex items-start gap-3">
            <Bell className="mt-1 text-primary" size={18} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{notification.title}</h2>
                <StatusBadge label={notification.read ? "مقروء" : "جديد"} tone={notification.read ? "muted" : "warning"} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  );
}
