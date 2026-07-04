import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../app/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        title={resolvedTheme === "dark" ? "وضع نهاري" : "وضع مظلم"}
      >
        {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`rounded-md p-2 transition ${theme === "system" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        title="حسب النظام"
      >
        <Monitor size={16} />
      </button>
    </div>
  );
}
