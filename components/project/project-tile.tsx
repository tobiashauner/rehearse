import Link from "next/link";
import {
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CirclePause,
  Mic,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScoreCircle, ScoreDisc } from "@/components/score-badge";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  optionLabel,
} from "@/lib/validations/session";

/*
 * Home-pane project tile: a full-width card. The header carries the project's
 * title/role plus its latest score as a tier circle, and below it every
 * interview is listed in the same style as the project-overview rail — Mic on
 * the left, type + difficulty · status in the middle, and a tier score-circle
 * (or a dashed status circle) on the right. New projects get a hint of what to
 * do next instead of empty metrics.
 */

export type TileInterview = {
  id: string;
  interviewType: string;
  difficulty: string;
  status: "configured" | "in_progress" | "paused" | "completed";
  score: number | null;
  completedAt: string | null;
};

export type ProjectTileData = {
  id: string;
  title: string;
  company: string | null;
  role: string | null;
  status: string;
  createdAt: string;
  /** Completed-session scores, oldest first. */
  scores: number[];
  /** Every interview in the project (any status). */
  interviews: TileInterview[];
};

const STATUS: Record<
  string,
  { icon: LucideIcon; label: string; className: string; rank: number }
> = {
  in_progress: {
    icon: Mic,
    label: "In progress",
    className: "text-badge-accent",
    rank: 0,
  },
  paused: { icon: CirclePause, label: "Paused", className: "text-primary", rank: 1 },
  configured: {
    icon: CircleDashed,
    label: "Ready to start",
    className: "text-muted-foreground",
    rank: 2,
  },
  completed: {
    icon: CircleCheck,
    label: "Completed",
    className: "text-[oklch(0.55_0.12_150)]",
    rank: 3,
  },
};

const MAX_ROWS = 4;

function InterviewRow({
  projectId,
  it,
}: {
  projectId: string;
  it: TileInterview;
}) {
  const meta = STATUS[it.status] ?? STATUS.configured;
  const StatusIcon = meta.icon;
  const score =
    it.status === "completed" && it.score !== null
      ? Math.round(it.score)
      : null;
  const base = `/projects/${projectId}/sessions/${it.id}`;
  const href = it.status === "completed" ? `${base}/review` : base;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-resting ring-1 ring-foreground/10 outline-none transition-colors hover:bg-badge-accent/5 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-badge-accent/10 text-badge-accent">
        <Mic className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {optionLabel(INTERVIEW_TYPE_OPTIONS, it.interviewType)}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {optionLabel(DIFFICULTY_OPTIONS, it.difficulty)} · {meta.label}
        </p>
      </div>
      {score !== null ? (
        <ScoreCircle score={score} />
      ) : (
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25",
            meta.className,
          )}
        >
          <StatusIcon className="size-4" />
        </span>
      )}
    </Link>
  );
}

export function ProjectTile({ project }: { project: ProjectTileData }) {
  const latest = project.scores.at(-1);
  const completedCount = project.scores.length;
  const roleLine =
    [project.role, project.company].filter(Boolean).join(" @ ") ||
    "No role or company set";

  const ordered = [...project.interviews].sort((a, b) => {
    const ra = STATUS[a.status]?.rank ?? 9;
    const rb = STATUS[b.status]?.rank ?? 9;
    if (ra !== rb) return ra - rb;
    // Within completed, most recent first.
    return (
      new Date(b.completedAt ?? 0).getTime() -
      new Date(a.completedAt ?? 0).getTime()
    );
  });
  const shown = ordered.slice(0, MAX_ROWS);
  const remaining = ordered.length - shown.length;

  return (
    <div className="rounded-xl bg-card p-5 shadow-resting ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${project.id}`}
              className="rounded-sm font-medium leading-snug outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {project.title}
            </Link>
            {project.status === "archived" && (
              <Badge variant="outline" className="shrink-0 capitalize">
                archived
              </Badge>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">{roleLine}</p>
        </div>

        {completedCount > 0 && latest !== undefined && (
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-xs text-muted-foreground">Latest score</span>
            <ScoreDisc score={latest} />
          </div>
        )}
      </div>

      {ordered.length > 0 ? (
        <div className="mt-4 space-y-2 rounded-xl bg-accent p-2">
          {shown.map((it) => (
            <InterviewRow key={it.id} projectId={project.id} it={it} />
          ))}
          {remaining > 0 && (
            <Link
              href={`/projects/${project.id}`}
              className="flex items-center justify-center gap-0.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all {ordered.length} interviews
              <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            No interviews yet — add your resume and job description, then
            rehearse.
          </p>
          <Link
            href={`/projects/${project.id}`}
            className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Set up
            <ChevronRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
