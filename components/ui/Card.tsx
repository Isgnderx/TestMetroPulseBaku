import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
}

export function Card({ children, className, glass, hover }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/5 bg-surface-800",
        glass && "glass-card",
        hover && "hover:border-white/10 hover:bg-surface-700 transition-colors cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-5 pt-5 pb-3", className)}>{children}</div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-sm font-semibold text-foreground", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-5 pb-5", className)}>{children}</div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
  accentColor?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          {Icon && (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{
                backgroundColor: (accentColor ?? "#2196F3") + "22",
              }}
            >
              <Icon
                className="h-4.5 w-4.5"
                style={{ color: accentColor ?? "#2196F3" }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
