/*
 * The "Delivery" analysis card on the review page. Two tiers of signal:
 * substance (specificity / structure / directness, from the LLM) and habits
 * (pace / hedging / filler words, deterministic), each a meter + coaching note.
 * Ownership and other neutral notes render as unscored observations below. The
 * header number is the delivery sub-score folded (lightly) into the overall.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { scoreTier } from "@/lib/scoring";
import { TickMeter } from "@/components/tick-meter";
import type { DeliveryMetric, DeliveryReport } from "@/lib/delivery";
import { cn } from "@/lib/utils";

function MetricRow({ metric }: { metric: DeliveryMetric }) {
  const tier = scoreTier(metric.score);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">
          {metric.label}
          {metric.approximate && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              approx.
            </span>
          )}
        </span>
        {metric.value && (
          <span className={cn("text-sm tabular-nums", tier.text)}>
            {metric.value}
          </span>
        )}
      </div>
      <TickMeter score={metric.score} className="mt-2" />
      <p className="mt-1.5 text-xs text-muted-foreground">{metric.note}</p>
    </div>
  );
}

export function DeliveryPanel({ report }: { report: DeliveryReport }) {
  const tier = scoreTier(report.score);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">Delivery</CardTitle>
            <p className="text-sm text-muted-foreground">
              How you came across — folded lightly into your score.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn("text-2xl font-semibold tabular-nums", tier.text)}
            >
              {report.score}
            </span>
            <span
              className={cn(
                "rounded-4xl px-2 py-0.5 text-xs font-semibold",
                tier.soft,
                tier.text,
              )}
            >
              {tier.label}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {report.metrics.map((m) => (
            <MetricRow key={m.key} metric={m} />
          ))}
        </div>
        {report.observations.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Also noticed
            </p>
            <ul className="mt-1.5 space-y-1">
              {report.observations.map((o, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
