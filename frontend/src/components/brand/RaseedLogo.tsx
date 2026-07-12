type LogoTone = "light" | "dark" | "auto";
type LogoMode = "mark" | "full";

type RaseedLogoProps = {
  mode?: LogoMode;
  tone?: LogoTone;
  subtitle?: string;
  className?: string;
  markClassName?: string;
};

export function RaseedLogo({ mode = "full", tone = "auto", subtitle, className = "", markClassName = "" }: RaseedLogoProps) {
  const isLight = tone === "light";
  const textClass = isLight ? "text-white" : "text-foreground";
  const subTextClass = isLight ? "text-sidebar-foreground/70" : "text-muted-foreground";

  return (
    <div className={`inline-flex items-center gap-3 ${className}`} aria-label="رصيد">
      <span
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-white shadow-lg shadow-primary/20 ${markClassName || "h-11 w-11"}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 48 48" className="h-full w-full" focusable="false">
          <path className="fill-primary" d="M13 5h21a6 6 0 0 1 6 6v29l-4.2-2.5L31.6 40l-4.2-2.5L23.2 40 19 37.5 14.8 40 10.6 37.5 7 40V11a6 6 0 0 1 6-6Z" />
          <path fill="currentColor" d="M15.5 13h16.8a2 2 0 1 1 0 4H15.5a2 2 0 1 1 0-4Zm0 7h12.8a2 2 0 1 1 0 4H15.5a2 2 0 1 1 0-4Z" opacity=".55" />
          <path fill="currentColor" d="M31.8 33.4c-1.5 1.4-3.6 2.1-6.3 2.1h-7.4a2.4 2.4 0 0 1 0-4.8h7.5c1.3 0 2.3-.3 2.9-.8.6-.5.9-1.3.9-2.4v-1.2H19a2.4 2.4 0 0 1 0-4.8h15.1v6c0 2.4-.8 4.4-2.3 5.9Z" />
          <circle cx="34.5" cy="15.5" r="3.2" className="fill-accent" />
        </svg>
      </span>
      {mode === "full" && (
        <span className="min-w-0 leading-tight">
          <span className={`block text-base font-extrabold ${textClass}`}>رصيد</span>
          {subtitle && <span className={`block truncate text-xs ${subTextClass}`}>{subtitle}</span>}
        </span>
      )}
    </div>
  );
}
