import { cn } from "@/lib/utils";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

type AlertVariant = "info" | "warning" | "success" | "error";

const ICONS: Record<AlertVariant, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: AlertTriangle,
};

const STYLES: Record<AlertVariant, string> = {
  info: "bg-metro-blue/10 border-metro-blue/20 text-metro-blue",
  warning: "bg-demand-high/10 border-demand-high/20 text-demand-high",
  success: "bg-demand-low/10 border-demand-low/20 text-demand-low",
  error: "bg-demand-surge/10 border-demand-surge/20 text-demand-surge",
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = ICONS[variant];
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        STYLES[variant],
        className
      )}
    >
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  );
}
