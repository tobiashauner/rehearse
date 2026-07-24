import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CirclePause,
  FileText,
  Mic,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sparkline, formatTileDate } from "@/components/tiles";

/*
 * Project overview: one compact tile per section, each a miniature of what's
 * inside — recent items, the key number, a trend — so the overview is a
 * briefing in itself. Tiles link into their section; the rail handles nav.
 */

// Muted green for "completed" — a state, not a grade, so it stays calm.
const COMPLETE_GREEN = "text-[oklch(0.55_0.12_150)]";

function SectionTile({
  href,
  title,
  icon: Icon,
  children,
}: {
  href: string;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl bg-card p-5 shadow-resting ring-1 ring-foreground/10 outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-badge-accent/10 text-badge-accent">
          <Icon className="size-4" />
        </span>
        <h2 className="font-medium">{title}</h2>
        <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      {children}
    </Link>
  );
}

/** Quiet list rows: tinted, rounded, no card chrome. */
function MiniList({
  items,
}: {
  items: { primary: string; secondary?: string }[];
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-baseline justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2 text-sm"
        >
          <span className="truncate">{item.primary}</span>
          {item.secondary && (
            <span className="shrink-0 text-muted-foreground">
              {item.secondary}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

const SESSION_STATUS: Record<
  string,
  { icon: LucideIcon; label: string; className: string }
> = {
  completed: { icon: CircleCheck, label: "completed", className: COMPLETE_GREEN },
  paused: { icon: CirclePause, label: "paused", className: "text-primary" },
  in_progress: { icon: Mic, label: "in progress", className: "text-badge-accent" },
  configured: {
    icon: CircleDashed,
    label: "ready",
    className: "text-muted-foreground",
  },
  abandoned: {
    icon: CircleDashed,
    label: "abandoned",
    className: "text-muted-foreground",
  },
};

function SessionRows({
  items,
}: {
  items: { primary: string; status: string; score: number | null }[];
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => {
        const status = SESSION_STATUS[item.status] ?? SESSION_STATUS.configured;
        return (
          <li
            key={i}
            className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2 text-sm"
          >
            <span className="truncate">{item.primary}</span>
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5",
                status.className,
              )}
            >
              <status.icon className="size-4" />
              {item.score !== null ? (
                <span className="font-medium tabular-nums">{item.score}</span>
              ) : (
                <span className="text-xs">{status.label}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Empty tile: a larger centered icon with quiet copy underneath. */
function EmptyState({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 py-6 text-center">
      <Icon className="size-8 text-muted-foreground/40" />
      <p className="max-w-[26ch] text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

export type ResourcesTileData = {
  count: number;
  items: { primary: string; secondary?: string }[];
};

export type BriefingTileData = {
  generatedAt: string;
  roleSummary: string;
  skills: string[];
} | null;

export type SessionsTileData = {
  count: number;
  inProgressCount: number;
  latestScore: number | null;
  hasCoachingPlan: boolean;
  recent: { primary: string; status: string; score: number | null }[];
};

export type AnalyticsTileData = {
  scores: number[];
  averageScore: number;
  totalMinutes: number;
} | null;

export function SectionTiles({
  projectId,
  resources,
  briefing,
  hasAnyResource,
  sessions,
  analytics,
}: {
  projectId: string;
  resources: ResourcesTileData;
  briefing: BriefingTileData;
  hasAnyResource: boolean;
  sessions: SessionsTileData;
  analytics: AnalyticsTileData;
}) {
  const base = `/projects/${projectId}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SectionTile
        href={`${base}?tab=resources`}
        title="Resources"
        icon={FileText}
      >
        {resources.count > 0 ? (
          <>
            <MiniList items={resources.items.slice(0, 3)} />
            {resources.count > 3 && (
              <p className="text-sm text-muted-foreground">
                +{resources.count - 3} more
              </p>
            )}
          </>
        ) : (
          <EmptyState icon={FileText}>
            Add your resume and the job description — interviews are built
            from them.
          </EmptyState>
        )}
      </SectionTile>

      <SectionTile
        href={`${base}?tab=briefing`}
        title="AI Briefing"
        icon={Sparkles}
      >
        {briefing ? (
          <>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {briefing.roleSummary}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-1.5">
              {briefing.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">
                Generated {formatTileDate(briefing.generatedAt)}
              </span>
            </div>
          </>
        ) : (
          <EmptyState icon={Sparkles}>
            {hasAnyResource
              ? "Ready to generate — a structured read on the role, your fit, and likely questions."
              : "Needs at least one resource first."}
          </EmptyState>
        )}
      </SectionTile>

      <SectionTile
        href={`${base}?tab=sessions`}
        title="Interview Sessions"
        icon={Mic}
      >
        {sessions.count > 0 ? (
          <>
            <div className="flex items-baseline justify-between gap-3">
              {sessions.latestScore !== null ? (
                <p className="text-2xl font-medium tabular-nums">
                  {Math.round(sessions.latestScore)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    latest score
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not scored yet</p>
              )}
              <p className="text-sm text-muted-foreground">
                {sessions.count} interview{sessions.count === 1 ? "" : "s"}
              </p>
            </div>
            <SessionRows items={sessions.recent.slice(0, 3)} />
            {(sessions.inProgressCount > 0 || sessions.hasCoachingPlan) && (
              <p className="mt-auto text-sm font-medium text-badge-accent">
                {sessions.inProgressCount > 0
                  ? "Interview in progress — pick it back up"
                  : "Coaching plan ready"}
              </p>
            )}
          </>
        ) : (
          <EmptyState icon={Mic}>
            {briefing
              ? "Configure your first interview — questions come from your briefing."
              : "Generate the AI briefing first, then rehearse."}
          </EmptyState>
        )}
      </SectionTile>

      <SectionTile
        href={`${base}?tab=analytics`}
        title="Analytics"
        icon={BarChart3}
      >
        {analytics ? (
          <>
            <div className="flex items-end justify-between gap-4">
              <p className="text-2xl font-medium tabular-nums">
                {Math.round(analytics.averageScore)}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  average
                </span>
              </p>
              <Sparkline scores={analytics.scores.slice(-8)} />
            </div>
            <p className="text-sm text-muted-foreground">
              {analytics.scores.length} scored interview
              {analytics.scores.length === 1 ? "" : "s"}
              {analytics.totalMinutes > 0 &&
                ` · ${analytics.totalMinutes} min practiced`}
            </p>
          </>
        ) : (
          <EmptyState icon={BarChart3}>
            Your score trend, average, and practice time appear here after
            your first completed interview.
          </EmptyState>
        )}
      </SectionTile>
    </div>
  );
}
