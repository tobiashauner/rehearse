"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleCheck,
  CircleDashed,
  CirclePause,
  Mic,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreCircle } from "@/components/score-badge";
import { ConfigureInterviewDialog } from "@/components/interview/configure-interview-dialog";
import {
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  optionLabel,
} from "@/lib/validations/session";
import type { Database } from "@/types/database";

/*
 * Persistent left rail listing every interview. Stays mounted across Overview
 * ↔ interview navigation (it lives in the project layout) and highlights the
 * interview currently open. "New Interview" lives at the top.
 */

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

const STATUS: Record<
  string,
  { icon: LucideIcon; label: string; className: string }
> = {
  completed: {
    icon: CircleCheck,
    label: "Completed",
    className: "text-[oklch(0.55_0.12_150)]",
  },
  paused: { icon: CirclePause, label: "Paused", className: "text-primary" },
  in_progress: {
    icon: Mic,
    label: "In progress",
    className: "text-badge-accent",
  },
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

export function InterviewRail({
  projectId,
  sessions,
  hasBriefing,
  completedCount,
}: {
  projectId: string;
  sessions: Session[];
  hasBriefing: boolean;
  completedCount: number;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Interviews</h2>
        <ConfigureInterviewDialog
          projectId={projectId}
          hasBriefing={hasBriefing}
          completedSessionCount={completedCount}
          triggerLabel={
            <>
              <Plus data-icon="inline-start" />
              New
            </>
          }
        />
      </div>

      <div className="rounded-2xl bg-accent p-2.5">
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No interviews yet — start one to begin.
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <RailCard
                key={session.id}
                projectId={projectId}
                session={session}
                active={pathname.includes(`/sessions/${session.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RailCard({
  projectId,
  session,
  active,
}: {
  projectId: string;
  session: Session;
  active: boolean;
}) {
  const status = STATUS[session.status] ?? STATUS.configured;
  const StatusIcon = status.icon;
  const score =
    session.status === "completed" && session.overall_score !== null
      ? Math.round(Number(session.overall_score))
      : null;

  // Completed → straight to the review; others open the runner.
  const base = `/projects/${projectId}/sessions/${session.id}`;
  const href = session.status === "completed" ? `${base}/review` : base;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl bg-card p-3 shadow-resting outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "bg-badge-accent/5 ring-2 ring-badge-accent"
          : "ring-1 ring-foreground/10 hover:bg-badge-accent/5",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-badge-accent/10 text-badge-accent">
        <Mic className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {optionLabel(INTERVIEW_TYPE_OPTIONS, session.interview_type)}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {optionLabel(DIFFICULTY_OPTIONS, session.difficulty)} · {status.label}
        </p>
      </div>
      {score !== null ? (
        <ScoreCircle score={score} />
      ) : (
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25",
            status.className,
          )}
        >
          <StatusIcon className="size-4" />
        </span>
      )}
    </Link>
  );
}
