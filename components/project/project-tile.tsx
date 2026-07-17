import Link from "next/link";
import { Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sparkline, formatTileDate } from "@/components/tiles";

/*
 * Home-pane project tile: the project's title/role plus its practice state at
 * a glance — latest score with a compact trend, interview count, an
 * in-progress marker, and last activity. New projects get a hint of what to
 * do next instead of empty metrics.
 */

export type ProjectTileData = {
  id: string;
  title: string;
  company: string | null;
  role: string | null;
  status: string;
  createdAt: string;
  /** Completed-session scores, oldest first. */
  scores: number[];
  hasInProgress: boolean;
  /** Most recent session activity (started or completed), if any. */
  lastActiveAt: string | null;
};

export function ProjectTile({ project }: { project: ProjectTileData }) {
  const latest = project.scores.at(-1);
  const count = project.scores.length;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col gap-4 rounded-xl bg-card p-5 shadow-resting ring-1 ring-foreground/10 outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-snug">{project.title}</h3>
          {project.status === "archived" && (
            <Badge variant="outline" className="shrink-0 capitalize">
              archived
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {[project.role, project.company].filter(Boolean).join(" @ ") ||
            "No role or company set"}
        </p>
      </div>

      <div className="mt-auto">
        {count > 0 ? (
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-medium tabular-nums">
                {Math.round(latest!)}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  latest score
                </span>
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {count} interview{count === 1 ? "" : "s"}
              </p>
            </div>
            <Sparkline scores={project.scores.slice(-8)} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No interviews yet — add your resume and job description, then
            rehearse.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span>
          {project.lastActiveAt
            ? `Practiced ${formatTileDate(project.lastActiveAt)}`
            : `Created ${formatTileDate(project.createdAt)}`}
        </span>
        {project.hasInProgress && (
          <span className="flex items-center gap-1 font-medium text-badge-accent">
            <Mic className="size-3" />
            Interview in progress
          </span>
        )}
      </div>
    </Link>
  );
}
