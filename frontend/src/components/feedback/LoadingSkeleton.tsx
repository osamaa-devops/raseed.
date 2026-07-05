export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return <div className={`h-32 animate-pulse rounded-2xl bg-muted ${className}`} />;
}
