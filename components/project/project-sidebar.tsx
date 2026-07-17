"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  FileText,
  House,
  Mic,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Section nav shown everywhere inside a project: a left rail on md+, a
 * horizontal pill row on mobile. Active section comes from ?tab= (overview has
 * none); session/review sub-pages highlight Interview Sessions. Back-to-home
 * lives next to the project title in the project layout, not here.
 */

const SECTIONS = [
  { tab: null, label: "Overview", icon: House },
  { tab: "resources", label: "Resources", icon: FileText },
  { tab: "briefing", label: "AI Briefing", icon: Sparkles },
  { tab: "sessions", label: "Interview Sessions", icon: Mic },
  { tab: "analytics", label: "Analytics", icon: BarChart3 },
  { tab: "settings", label: "Settings", icon: Settings },
] as const;

export function ProjectSidebar({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = pathname.includes("/sessions/")
    ? "sessions"
    : searchParams.get("tab");

  return (
    <nav
      aria-label="Project sections"
      className="flex gap-1 overflow-x-auto md:sticky md:top-24 md:w-48 md:shrink-0 md:flex-col md:self-start md:overflow-visible"
    >
      {SECTIONS.map(({ tab, label, icon: Icon }) => {
        const isActive = (currentTab ?? null) === tab;
        return (
          <Link
            key={label}
            href={tab ? `/projects/${projectId}?tab=${tab}` : `/projects/${projectId}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive
                ? "bg-card font-medium text-foreground shadow-resting ring-1 ring-foreground/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
