import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface-900 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-metro-red animate-pulse-slow" />
              <span className="text-sm font-bold text-foreground">
                MetroPulse Baku
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Station-demand intelligence for Baku Metro. Forecasts and crowd
              estimates based on official entry data — not full journey
              reconstruction.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
              Navigation
            </h4>
            <ul className="space-y-2">
              {[
                ["/map", "Live Map"],
                ["/leaderboard", "Leaderboard"],
                ["/insights", "Insights"],
                ["/about-data", "About the Data"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
              Data Notice
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All demand figures are station-entry counts and forecasts. This
              product does not track individual journeys or reconstruct
              passenger paths.{" "}
              <Link
                href="/about-data"
                className="text-metro-blue underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Learn more
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MetroPulse Baku. Station demand
            intelligence.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-metro-green animate-pulse-slow" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
