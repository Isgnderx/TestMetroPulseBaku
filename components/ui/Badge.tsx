import { cn, demandBgClass, demandColor, lineColor } from "@/lib/utils";
import { DemandLevel, MetroLine } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
        variant === "outline"
          ? "bg-transparent border-white/10 text-muted-foreground"
          : "bg-white/5 border-white/10 text-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

export function DemandBadge({ level, label }: { level: DemandLevel; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
        demandBgClass(level)
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: demandColor(level) }}
      />
      {label}
    </span>
  );
}

export function LineBadge({ line }: { line: MetroLine }) {
  const labels: Record<MetroLine, string> = {
    red: "Red Line",
    green: "Green Line",
    purple: "Purple Line",
  };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border"
      style={{
        backgroundColor: lineColor(line) + "33",
        color: lineColor(line),
        borderColor: lineColor(line) + "55",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: lineColor(line) }}
      />
      {labels[line]}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: number }) {
  const pct = Math.round(level * 100);
  const color = pct >= 80 ? "#2DC653" : pct >= 60 ? "#F4A261" : "#E63946";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border"
      style={{
        backgroundColor: color + "22",
        color,
        borderColor: color + "44",
      }}
    >
      {pct}% confidence
    </span>
  );
}
