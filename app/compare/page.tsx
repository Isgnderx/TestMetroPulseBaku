import Link from "next/link";
import { ArrowLeft, GitCompare } from "lucide-react";

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-surface-900">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div>
          <Link
            href="/"
            className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <GitCompare className="h-5 w-5 text-metro-purple" />
            <h1 className="text-2xl font-bold text-foreground">
              Compare Stations
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Side-by-side station comparison is temporarily unavailable.
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-surface-800 p-5 sm:p-6">
          <p className="text-sm font-semibold text-foreground mb-2">
            Honest status
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This page previously relied on synthetic comparison values.
            To avoid misleading demo output, comparison cards are disabled until
            a fully real compare data path is available.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Link
              href="/map"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-white/15"
            >
              Go to live map
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-metro-blue/20 px-3 py-2 text-xs font-medium text-metro-blue transition-colors hover:bg-metro-blue/30"
            >
              Open leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
