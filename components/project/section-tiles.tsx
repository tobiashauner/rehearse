import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sparkline, formatTileDate } from "@/components/tiles";

/*
 * Project overview: one compact tile per section, each a miniature of what's
 * inside — recent items, the key number, a trend — so the overview is a
 * briefing in itself. Tiles link into their section; the rail handles nav.
 */

function SectionTile({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl bg-card p-5 shadow-resting ring-1 ring-foreground/10 outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">{title}</h2>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      {children}
    </Link>
  );
}

function MiniList({ items }: { items: { primary: string; secondary?: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
          <span className="truncate">{item.primary}</span>
          {item.secondary && (
            <span className="shrink-0 text-muted-foreground">{item.secondary}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
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
  recent: { primary: string; secondary?: string }[];
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
      <SectionTile href={`${base}?tab=resources`} title="Resources">
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
          <Hint>
            Nothing here yet. Add your resume and the job description —
            interviews are built from them.
          </Hint>
        )}
      </SectionTile>

      <SectionTile href={`${base}?tab=briefing`} title="AI Briefing">
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
          <Hint>
            {hasAnyResource
              ? "Ready to generate — a structured read on the role, your fit, and likely questions."
              : "Needs at least one resource first."}
          </Hint>
        )}
      </SectionTile>

      <SectionTile href={`${base}?tab=sessions`} title="Interview Sessions">
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
            <MiniList items={sessions.recent.slice(0, 3)} />
            {(sessions.inProgressCount > 0 || sessions.hasCoachingPlan) && (
              <p className="mt-auto text-sm font-medium text-badge-accent">
                {sessions.inProgressCount > 0
                  ? "Interview in progress — pick it back up"
                  : "Coaching plan ready"}
              </p>
            )}
          </>
        ) : (
          <Hint>
            {briefing
              ? "Configure your first interview — questions come from your briefing."
              : "Generate the AI briefing first, then rehearse."}
          </Hint>
        )}
      </SectionTile>

      <SectionTile href={`${base}?tab=analytics`} title="Analytics">
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
          <Hint>Fills in as you complete interviews.</Hint>
        )}
      </SectionTile>
    </div>
  );
}
