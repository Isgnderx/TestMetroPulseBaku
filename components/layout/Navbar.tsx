"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MapPin, BarChart3, Zap, Info, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { StationSearch } from "@/components/station/StationSearch";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: null },
  { href: "/map", label: "Live Map", icon: MapPin },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Zap },
  { href: "/about-data", label: "About Data", icon: Info },
];

const MOBILE_TABS = [
  { href: "/", label: "Home", icon: null },
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/leaderboard", label: "Ranks", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Zap },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-surface-900/85 backdrop-blur-xl supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-metro-red/20 border border-metro-red/30 group-hover:bg-metro-red/30 transition-colors">
                <div className="h-3 w-3 rounded-full bg-metro-red animate-pulse-slow" />
              </div>
              <div className="leading-none">
                <span className="text-sm font-bold tracking-tight text-foreground">
                  MetroPulse
                </span>
                <span className="ml-1 text-sm font-bold tracking-tight text-metro-red">
                  Baku
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* Search */}
            <div className="hidden md:block w-56 lg:w-72">
              <StationSearch />
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-surface-800/95 backdrop-blur-xl">
            <div className="px-4 py-3">
              <StationSearch className="mb-3" />
              <div className="space-y-1">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active =
                    href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-white/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </nav>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-surface-900/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid w-full max-w-xl grid-cols-4 gap-1">
          {MOBILE_TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex min-h-12 flex-col items-center justify-center rounded-lg px-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {Icon ? <Icon className="mb-0.5 h-4 w-4" /> : <span className="mb-0.5 h-4 text-sm">●</span>}
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
