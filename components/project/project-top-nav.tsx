"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/*
 * Horizontal project section nav — a rounded pill track with the active section
 * as a solid teal pill. Active comes from ?tab= (Overview has none; session/
 * review sub-pages carry no tab, so Overview stays active inside an interview).
 */

const SECTIONS = [
  { tab: null, label: "Overview" },
  { tab: "resources", label: "Resources" },
  { tab: "briefing", label: "AI Briefing" },
  { tab: "settings", label: "Settings" },
] as const;

export function ProjectTopNav({ projectId }: { projectId: string }) {
  const current = useSearchParams().get("tab");

  return (
    <nav
      aria-label="Project sections"
      className="max-w-full overflow-x-auto"
    >
      <div className="inline-flex w-max items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
        {SECTIONS.map(({ tab, label }) => {
          const active = (current ?? null) === tab;
          return (
            <Link
              key={label}
              href={
                tab
                  ? `/projects/${projectId}?tab=${tab}`
                  : `/projects/${projectId}`
              }
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-base font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                active
                  ? "bg-badge-accent font-semibold text-badge-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm",
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
