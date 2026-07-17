import Link from "next/link";
import { CirclePlay } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContinueIllustration,
  EmptyTile,
  PracticeIllustration,
  ScoresIllustration,
  Tile,
  TrendChart,
  TrendIllustration,
  formatTileDate,
} from "@/components/tiles";

/*
 * The dashboard's four spec widgets (Continue Interview, Practice Today,
 * Recent Scores, Improvement Trends). Each tile always renders: live data
 * when it exists, otherwise an EmptyTile illustration + explanation so the
 * empty state doubles as feature discovery.
 */

export type DashboardSession = {
  id: string;
  projectId: string;
  projectTitle: string;
  typeLabel: string;
  difficultyLabel: string;
  startedAt: string | null;
  completedAt: string | null;
  overallScore: number | null;
};

export type PracticeTodayState = {
  practicedToday: boolean;
  targetProjectId: string;
} | null;

/* ---------------------------------------------------------------- rows -- */

function SessionRow({
  title,
  badge,
  subtitle,
  trailing,
  href,
}: {
  title: string;
  badge?: string;
  subtitle: string;
  trailing: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
        <CirclePlay className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="truncate">{title}</span>
          {badge ? <Badge variant="outline">{badge}</Badge> : null}
        </p>
        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <span className="shrink-0 text-sm font-medium">{trailing}</span>
    </Link>
  );
}

function ScoreRow({
  title,
  subtitle,
  score,
  href,
}: {
  title: string;
  subtitle: string;
  score: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Badge variant="accent" className="tabular-nums">
        {Math.round(score)}
      </Badge>
    </Link>
  );
}

/* --------------------------------------------------------------- tiles -- */

function ContinueInterviewTile({ sessions }: { sessions: DashboardSession[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyTile
        title="Continue interview"
        span="lg:col-span-2"
        description="Step away mid-interview whenever you need to — your session waits here, ready to resume."
      >
        <ContinueIllustration />
      </EmptyTile>
    );
  }

  return (
    <Tile title="Continue interview" span="lg:col-span-2">
      <ul className="flex flex-col divide-y divide-border">
        {sessions.map((session) => (
          <li key={session.id}>
            <SessionRow
              title={session.typeLabel}
              badge={session.difficultyLabel}
              subtitle={`${session.projectTitle}${
                session.startedAt
                  ? ` · started ${formatTileDate(session.startedAt)}`
                  : ""
              }`}
              trailing="Resume"
              href={`/projects/${session.projectId}/sessions/${session.id}`}
            />
          </li>
        ))}
      </ul>
    </Tile>
  );
}

function PracticeTodayTile({ practice }: { practice: PracticeTodayState }) {
  if (!practice) {
    return (
      <EmptyTile
        title="Practice today"
        description="A daily check-in: see whether you've practiced, and jump straight into a session."
      >
        <PracticeIllustration />
      </EmptyTile>
    );
  }

  return (
    <Tile title="Practice today">
      {practice.practicedToday ? (
        <p className="text-sm text-muted-foreground">
          You&apos;ve practiced today. Another round never hurts — but
          you&apos;ve done the work.
        </p>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Nothing yet today. Even a short session keeps you sharp.
          </p>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/projects/${practice.targetProjectId}`} />}
          >
            Start a session
          </Button>
        </div>
      )}
    </Tile>
  );
}

function RecentScoresTile({ sessions }: { sessions: DashboardSession[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyTile
        title="Recent scores"
        description="Every completed interview gets an overall score, with structured feedback on each answer."
      >
        <ScoresIllustration />
      </EmptyTile>
    );
  }

  return (
    <Tile title="Recent scores">
      <ul className="flex flex-col divide-y divide-border">
        {sessions.map((session) => (
          <li key={session.id}>
            <ScoreRow
              title={session.projectTitle}
              subtitle={`${session.typeLabel}${
                session.completedAt
                  ? ` · ${formatTileDate(session.completedAt)}`
                  : ""
              }`}
              score={session.overallScore ?? 0}
              href={`/projects/${session.projectId}/sessions/${session.id}/review`}
            />
          </li>
        ))}
      </ul>
    </Tile>
  );
}

function ImprovementTrendTile({
  scores,
}: {
  scores: { score: number; completedAt: string }[];
}) {
  if (scores.length < 2) {
    return (
      <EmptyTile
        title="Improvement trends"
        span="lg:col-span-2"
        description={
          scores.length === 1
            ? "One interview scored — complete another and your trend charts here."
            : "Your overall scores chart here as you practice — progress at a glance, not just a feeling."
        }
      >
        <TrendIllustration />
      </EmptyTile>
    );
  }

  return (
    <Tile
      title="Improvement trends"
      span="lg:col-span-2"
      caption={`Overall scores across your last ${scores.length} interviews.`}
    >
      <TrendChart
        points={scores.map((s) => ({ score: s.score, date: s.completedAt }))}
      />
    </Tile>
  );
}

/* ---------------------------------------------------------------- grid -- */

export function DashboardWidgets({
  heading,
  inProgress,
  practice,
  recentScores,
  trendScores,
}: {
  heading?: string;
  inProgress: DashboardSession[];
  practice: PracticeTodayState;
  recentScores: DashboardSession[];
  trendScores: { score: number; completedAt: string }[];
}) {
  const grid = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ContinueInterviewTile sessions={inProgress} />
      <PracticeTodayTile practice={practice} />
      <RecentScoresTile sessions={recentScores} />
      <ImprovementTrendTile scores={trendScores} />
    </div>
  );

  if (!heading) return grid;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">{heading}</h2>
      {grid}
    </div>
  );
}
