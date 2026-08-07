import { Angry, Frown, Laugh, Meh, Smile } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { CSAT_LEVELS } from "@/lib/validations/feedback";
import type { FeedbackReport as Report } from "@/lib/admin/data";
import { cn } from "@/lib/utils";

/*
 * Super-admin feedback report: CSAT summary (responses, average, satisfied %),
 * the 1–5 distribution, and every submission with its comment. Presentational
 * + server-rendered.
 */

const FACES: Record<number, LucideIcon> = {
  1: Angry,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
};
const LABELS: Record<number, string> = Object.fromEntries(
  CSAT_LEVELS.map((l) => [l.value, l.label]),
);

function ratingColor(rating: number): string {
  if (rating >= 4) return "text-score-strong";
  if (rating === 3) return "text-score-developing";
  return "text-score-needs";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function FeedbackReport({ report }: { report: Report }) {
  if (report.total === 0) {
    return (
      <Card>
        <CardContent className="py-4">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No feedback yet</EmptyTitle>
              <EmptyDescription>
                Submissions from the header “Feedback” button will show up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(1, ...report.distribution.map((d) => d.count));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Responses"
          value={report.total.toLocaleString()}
          hint="all time"
        />
        <StatTile
          label="Average CSAT"
          value={`${report.average.toFixed(1)} / 5`}
          hint="mean satisfaction"
        />
        <StatTile
          label="Satisfied"
          value={`${Math.round(report.satisfiedPct)}%`}
          hint="rated 4 or 5"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...report.distribution].reverse().map((d) => {
            const Face = FACES[d.rating];
            return (
              <div key={d.rating} className="flex items-center gap-3">
                <Face
                  className={cn("size-5 shrink-0", ratingColor(d.rating))}
                  aria-hidden="true"
                />
                <span className="w-28 shrink-0 text-sm text-muted-foreground">
                  {LABELS[d.rating]}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${(d.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                  {d.count}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Recent feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.items.map((item) => {
            const Face = FACES[item.rating];
            return (
              <div
                key={item.id}
                className="flex gap-3 rounded-lg border p-3"
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted",
                    ratingColor(item.rating),
                  )}
                  title={LABELS[item.rating]}
                >
                  <Face className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  {item.comment ? (
                    <p className="text-sm whitespace-pre-wrap">{item.comment}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No comment
                    </p>
                  )}
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="truncate">{item.email}</span>
                    {item.pagePath && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{item.pagePath}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="whitespace-nowrap">
                      {fmtDate(item.createdAt)}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
