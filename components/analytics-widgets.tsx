import {
  AnswerLengthIllustration,
  CadenceIllustration,
  ClockIllustration,
  DeliveryIllustration,
  EmptyTile,
  ScoresIllustration,
  Tile,
  TrendIllustration,
} from "@/components/tiles";
import {
  ScoreTrendChart,
  type ScoreTrendPoint,
} from "@/components/score-trend-chart";
import { scoreTier } from "@/lib/scoring";
import { TickMeter } from "@/components/tick-meter";
import { ScoreDisc } from "@/components/score-badge";
import { cn } from "@/lib/utils";
import type { DeliverySummary } from "@/lib/analytics";

/** Shared header for the score/delivery tiles: tier disc + label + subtext. */
function StatHeader({
  score,
  sub,
  extra,
}: {
  score: number;
  sub: string;
  extra?: React.ReactNode;
}) {
  const tier = scoreTier(score);
  return (
    <div className="flex items-center gap-3">
      <ScoreDisc score={score} />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-4xl px-2 py-0.5 text-xs font-semibold",
              tier.soft,
              tier.text,
            )}
          >
            {tier.label}
          </span>
          {extra}
        </div>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

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

export function AverageScoreTile({ scores }: { scores: number[] }) {
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
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return (
    <Tile title="Average score">
      <StatHeader
        score={avg}
        sub={`average across ${scores.length} interview${scores.length === 1 ? "" : "s"}`}
      />
    </Tile>
  );
}

export function PracticeTimeTile({
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

export function AnswerLengthTile({
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

/**
 * Project-wide delivery read: the average delivery score across every
 * interview, its trend, and a per-dimension breakdown (pace / fillers /
 * hedging / ownership). Far more meaningful than raw answer length — it's the
 * same coaching signal, aggregated, and it shows whether delivery is improving.
 */
export function DeliverySummaryTile({
  delivery,
}: {
  delivery: DeliverySummary | null;
}) {
  if (!delivery) {
    return (
      <EmptyTile
        title="Delivery"
        description="How you come across — pace, filler words, hedging, and ownership — summarized across your interviews."
      >
        <DeliveryIllustration />
      </EmptyTile>
    );
  }
  return (
    <Tile title="Delivery">
      <StatHeader
        score={delivery.score}
        sub={`average across ${delivery.count} interview${delivery.count === 1 ? "" : "s"}`}
        extra={
          delivery.delta != null && delivery.delta !== 0 ? (
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                delivery.delta > 0
                  ? "text-score-excellent"
                  : "text-score-needs",
              )}
            >
              {delivery.delta > 0 ? "+" : "−"}
              {Math.abs(delivery.delta)}
            </span>
          ) : undefined
        }
      />
      <div className="mt-4 space-y-2.5">
        {(() => {
          const substance = delivery.dimensions.filter(
            (d) => d.group === "substance",
          );
          const shown = (
            substance.length ? substance : delivery.dimensions
          ).slice(0, 4);
          return shown.map((d) => (
            <div key={d.key} className="space-y-1">
              <span className="text-xs text-muted-foreground">{d.label}</span>
              <TickMeter score={d.score} size="sm" />
            </div>
          ));
        })()}
      </div>
      {delivery.observations[0] && (
        <p className="mt-3 text-xs text-muted-foreground">
          {delivery.observations[0]}
        </p>
      )}
    </Tile>
  );
}

export function ScoreTrendTile({ scores }: { scores: ScoreTrendPoint[] }) {
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
  const first = Math.round(scores[0].score);
  const latest = Math.round(scores[scores.length - 1].score);
  const delta = latest - first;
  const avg = Math.round(
    scores.reduce((s, p) => s + p.score, 0) / scores.length,
  );
  return (
    <Tile
      title="Score trend"
      span="lg:col-span-2"
      caption={`Hover a bar for that interview. ${
        delta === 0
          ? "Flat since the first."
          : `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta)} since the first.`
      }`}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Latest score
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                "text-3xl font-semibold leading-none tabular-nums",
                scoreTier(latest).text,
              )}
            >
              {latest}
            </span>
            <span
              className={cn(
                "rounded-4xl px-2 py-0.5 text-xs font-semibold",
                scoreTier(latest).soft,
                scoreTier(latest).text,
              )}
            >
              {scoreTier(latest).label}
            </span>
            {delta !== 0 && (
              <span
                className={cn(
                  "text-sm font-medium tabular-nums",
                  delta > 0 ? "text-score-excellent" : "text-score-needs",
                )}
              >
                {delta > 0 ? "+" : "−"}
                {Math.abs(delta)}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          avg {avg} · {scores.length} interviews
        </p>
      </div>
      <ScoreTrendChart points={scores} />
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

export function PracticeCadenceTile({ weeks }: { weeks: WeekBucket[] }) {
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
  scored: ScoreTrendPoint[];
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
