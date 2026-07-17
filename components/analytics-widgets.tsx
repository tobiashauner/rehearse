import {
  AnswerLengthIllustration,
  CadenceIllustration,
  ClockIllustration,
  EmptyTile,
  ScoresIllustration,
  Tile,
  TrendChart,
  TrendIllustration,
} from "@/components/tiles";

/*
 * Analytics page widgets, built from the data the pipeline actually
 * produces today (session overall_score/duration, answer transcripts).
 * The spec's STAR/confidence/leadership/communication trends need the
 * evaluation schema to emit those dimensions first — deliberately not
 * previewed here until they exist. Same tile pattern as the dashboard:
 * live data, or an illustrated empty state that explains what fills in.
 */

export type WeekBucket = { label: string; count: number };

function Stat({ value, unit, sub }: { value: string; unit?: string; sub: string }) {
  return (
    <div>
      <p className="text-3xl font-medium tabular-nums">
        {value}
        {unit ? (
          <span className="text-lg font-normal text-muted-foreground"> {unit}</span>
        ) : null}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function AverageScoreTile({ scores }: { scores: number[] }) {
  if (scores.length === 0) {
    return (
      <EmptyTile
        title="Average score"
        description="Your average score across every completed interview lands here."
      >
        <ScoresIllustration />
      </EmptyTile>
    );
  }
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return (
    <Tile title="Average score">
      <Stat
        value={String(Math.round(avg))}
        sub={`across ${scores.length} interview${scores.length === 1 ? "" : "s"}`}
      />
    </Tile>
  );
}

function PracticeTimeTile({
  totalSeconds,
  weekSeconds,
}: {
  totalSeconds: number;
  weekSeconds: number;
}) {
  if (totalSeconds === 0) {
    return (
      <EmptyTile
        title="Practice time"
        description="The time you put into interviewing adds up here, session by session."
      >
        <ClockIllustration />
      </EmptyTile>
    );
  }
  const minutes = Math.round(totalSeconds / 60);
  const [value, unit] =
    minutes < 90
      ? [String(minutes), "min"]
      : [(minutes / 60).toFixed(1), "hrs"];
  return (
    <Tile title="Practice time">
      <Stat
        value={value}
        unit={unit}
        sub={
          weekSeconds > 0
            ? `${Math.round(weekSeconds / 60)} min this week`
            : "none yet this week"
        }
      />
    </Tile>
  );
}

function AnswerLengthTile({
  avgWords,
  answerCount,
}: {
  avgWords: number | null;
  answerCount: number;
}) {
  if (avgWords === null) {
    return (
      <EmptyTile
        title="Answer length"
        description="How long your answers run on average — useful for spotting rambling or one-liners."
      >
        <AnswerLengthIllustration />
      </EmptyTile>
    );
  }
  return (
    <Tile title="Answer length">
      <Stat
        value={String(avgWords)}
        unit="words"
        sub={`average across ${answerCount} answer${answerCount === 1 ? "" : "s"}`}
      />
    </Tile>
  );
}

function ScoreTrendTile({
  scores,
}: {
  scores: { score: number; completedAt: string }[];
}) {
  if (scores.length < 2) {
    return (
      <EmptyTile
        title="Score trend"
        span="lg:col-span-2"
        description={
          scores.length === 1
            ? "One interview scored — complete another and your trend charts here."
            : "Overall scores across every interview, charted over time as you practice."
        }
      >
        <TrendIllustration />
      </EmptyTile>
    );
  }
  return (
    <Tile
      title="Score trend"
      span="lg:col-span-2"
      caption={`Overall scores across your last ${scores.length} interviews.`}
    >
      <TrendChart
        points={scores.map((s) => ({ score: s.score, date: s.completedAt }))}
      />
    </Tile>
  );
}

function CadenceBars({ weeks }: { weeks: WeekBucket[] }) {
  const max = Math.max(...weeks.map((w) => w.count));
  return (
    <div>
      <div className="flex h-36 items-end gap-1.5">
        {weeks.map((week) => (
          <div
            key={week.label}
            className="flex h-full min-w-0 flex-1 flex-col justify-end"
            title={`Week of ${week.label}: ${week.count} session${week.count === 1 ? "" : "s"}`}
          >
            {week.count > 0 ? (
              <div
                className="rounded-t-[4px] bg-badge-accent"
                style={{ height: `${(week.count / max) * 100}%` }}
              />
            ) : (
              <div className="h-0.5 rounded-full bg-foreground/10" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>{weeks[0].label}</span>
        <span>{weeks[weeks.length - 1].label}</span>
      </div>
    </div>
  );
}

function PracticeCadenceTile({ weeks }: { weeks: WeekBucket[] }) {
  const total = weeks.reduce((a, w) => a + w.count, 0);
  if (total === 0) {
    return (
      <EmptyTile
        title="Practice cadence"
        description="Sessions per week, so you can see your rhythm — steady practice beats cramming."
      >
        <CadenceIllustration />
      </EmptyTile>
    );
  }
  return (
    <Tile
      title="Practice cadence"
      caption={`${total} session${total === 1 ? "" : "s"} in the last ${weeks.length} weeks.`}
    >
      <CadenceBars weeks={weeks} />
    </Tile>
  );
}

export function AnalyticsWidgets({
  scored,
  totalSeconds,
  weekSeconds,
  avgWords,
  answerCount,
  weeks,
}: {
  scored: { score: number; completedAt: string }[];
  totalSeconds: number;
  weekSeconds: number;
  avgWords: number | null;
  answerCount: number;
  weeks: WeekBucket[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AverageScoreTile scores={scored.map((s) => s.score)} />
      <PracticeTimeTile totalSeconds={totalSeconds} weekSeconds={weekSeconds} />
      <AnswerLengthTile avgWords={avgWords} answerCount={answerCount} />
      <ScoreTrendTile scores={scored} />
      <PracticeCadenceTile weeks={weeks} />
    </div>
  );
}
