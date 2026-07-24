import Link from "next/link";
import {
  CircleCheck,
  CircleDashed,
  CirclePause,
  Mic,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  PERSONALITY_OPTIONS,
  optionLabel,
} from "@/lib/validations/session";
import type { Database } from "@/types/database";

type Session = Pick<
  Database["public"]["Tables"]["interview_sessions"]["Row"],
  | "id"
  | "status"
  | "interview_type"
  | "difficulty"
  | "interviewer_personality"
  | "length_minutes"
  | "overall_score"
  | "completed_at"
  | "created_at"
>;

// Muted green for "completed" — a state, not a grade, so it stays calm and
// matches the overview tiles' session rows.
const COMPLETE_GREEN = "text-[oklch(0.55_0.12_150)]";

const STATUS: Record<
  string,
  { icon: LucideIcon; label: string; className: string }
> = {
  completed: { icon: CircleCheck, label: "Completed", className: COMPLETE_GREEN },
  paused: { icon: CirclePause, label: "Paused", className: "text-primary" },
  in_progress: { icon: Mic, label: "In progress", className: "text-badge-accent" },
  configured: {
    icon: CircleDashed,
    label: "Ready to start",
    className: "text-muted-foreground",
  },
  abandoned: {
    icon: CircleDashed,
    label: "Abandoned",
    className: "text-muted-foreground",
  },
};

export function SessionList({
  projectId,
  sessions,
}: {
  projectId: string;
  sessions: Session[];
}) {
  if (sessions.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Mic />
          </EmptyMedia>
          <EmptyTitle>No interviews yet</EmptyTitle>
          <EmptyDescription>Configure one to get started.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(17rem,1fr))]">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          projectId={projectId}
          session={session}
        />
      ))}
    </div>
  );
}

function SessionCard({
  projectId,
  session,
}: {
  projectId: string;
  session: Session;
}) {
  const status = STATUS[session.status] ?? STATUS.configured;
  const StatusIcon = status.icon;
  const score =
    session.status === "completed" && session.overall_score !== null
      ? Math.round(Number(session.overall_score))
      : null;

  const dateLabel =
    session.status === "completed" && session.completed_at
      ? `Completed ${new Date(session.completed_at).toLocaleDateString()}`
      : `Added ${new Date(session.created_at).toLocaleDateString()}`;

  return (
    <Link
      href={`/projects/${projectId}/sessions/${session.id}`}
      className="group flex flex-col gap-3 rounded-xl bg-card p-4 shadow-resting ring-1 ring-foreground/10 outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-badge-accent/10 text-badge-accent">
          <Mic className="size-4.5" />
        </span>
        {score !== null ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary tabular-nums">
            {score}
          </span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              status.className,
            )}
          >
            <StatusIcon className="size-4" />
            {status.label}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="font-medium">
          {optionLabel(INTERVIEW_TYPE_OPTIONS, session.interview_type)}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge variant="accent">
            {optionLabel(DIFFICULTY_OPTIONS, session.difficulty)}
          </Badge>
          <Badge variant="outline">
            {optionLabel(PERSONALITY_OPTIONS, session.interviewer_personality)}
          </Badge>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span>{dateLabel}</span>
        <span>{session.length_minutes} min</span>
      </div>
    </Link>
  );
}
