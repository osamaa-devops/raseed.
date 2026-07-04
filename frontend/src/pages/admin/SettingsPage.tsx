import { Monitor, Moon, Settings, Sun } from "lucide-react";
import { AppCard } from "../../components/ui/AppCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { useTheme } from "../../app/providers/ThemeProvider";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <PageHeader title="الإعدادات" description="إعدادات المحل والثيم كمكان مخصص للتطوير القادم." />
      <AppCard>
        <h2 className="mb-4 flex items-center gap-2 font-bold"><Settings size={18} /> المظهر</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { value: "light", label: "نهاري", icon: Sun },
            { value: "dark", label: "مظلم", icon: Moon },
            { value: "system", label: "حسب النظام", icon: Monitor },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value as "light" | "dark" | "system")}
              className={`rounded-xl border p-4 text-right transition ${theme === option.value ? "border-primary bg-secondary text-secondary-foreground" : "border-border hover:bg-muted"}`}
            >
              <option.icon className="mb-3" size={20} />
              <span className="font-bold">{option.label}</span>
            </button>
          ))}
        </div>
      </AppCard>
    </div>
  );
}
