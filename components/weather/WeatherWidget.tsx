import { Droplets, Wind, Thermometer } from "lucide-react";
import { WeatherObservation } from "@/types";
import { cn } from "@/lib/utils";

const CONDITION_LABELS: Record<string, string> = {
  clear: "Clear",
  partly_cloudy: "Partly Cloudy",
  cloudy: "Cloudy",
  rain: "Rain",
  heavy_rain: "Heavy Rain",
  fog: "Foggy",
  snow: "Snow",
  wind: "Windy",
  storm: "Storm",
};

const CONDITION_ICONS: Record<string, string> = {
  clear: "☀️",
  partly_cloudy: "⛅",
  cloudy: "☁️",
  rain: "🌧️",
  heavy_rain: "⛈️",
  fog: "🌫️",
  snow: "❄️",
  wind: "💨",
  storm: "🌩️",
};

interface WeatherWidgetProps {
  weather: WeatherObservation;
  demandNote?: string;
  compact?: boolean;
  className?: string;
}

export function WeatherWidget({ weather, demandNote, compact, className }: WeatherWidgetProps) {
  const icon = CONDITION_ICONS[weather.condition] ?? "🌡️";
  const label = CONDITION_LABELS[weather.condition] ?? weather.condition;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <span>{icon}</span>
        <span>{weather.tempC}°C</span>
        <span className="text-white/20">·</span>
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-white/5 bg-surface-800 p-4", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Weather · Baku City Center
          </p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {weather.tempC}°C
              </p>
              <p className="text-xs text-muted-foreground">
                Feels like {weather.feelsLikeC}°C · {label}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <WeatherStat icon={Droplets} label="Humidity" value={`${weather.humidity}%`} />
        <WeatherStat icon={Wind} label="Wind" value={`${weather.windSpeed} km/h`} />
        <WeatherStat icon={Thermometer} label="Precip." value={`${weather.precipitation} mm`} />
      </div>

      {demandNote && (
        <div className="mt-3 rounded-lg bg-surface-600 border border-white/5 px-3 py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-metro-blue font-medium">Demand insight: </span>
            {demandNote}
          </p>
        </div>
      )}
    </div>
  );
}

function WeatherStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-surface-600 px-2 py-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-xs font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
