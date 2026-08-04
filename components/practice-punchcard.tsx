import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PracticeData } from "@/lib/practice";

/*
 * A calm, contribution-graph-style record of practice across every project —
 * one square per day, brighter with more interviews that day. Lives in the
 * home page's right rail, so it's a compact vertical widget: the day-grid fills
 * the column width (columns flex to fit), with a summary stat row and a
 * less→more legend. Deliberately no streak / flame / pressure (PRODUCT.md avoids
 * gamification); it's a reflective log, not a game. Always renders (empty gray
 * grid + encouragement) as its empty state.
 */

// Empty → increasing teal intensity. Literal strings so Tailwind keeps them.
const LEVEL = [
  "bg-foreground/[0.06]",
  "bg-badge-accent/35",
  "bg-badge-accent/65",
  "bg-badge-accent",
];

function Stat({
  value,
  unit,
  label,
}: {
  value: string | number;
  unit?: string;
  label: string;
}) {
  // Two grid children (value on row 1, label on row 2) so labels always share a
  // row regardless of whether a value carries a unit — see the grid in Stats().
  return (
    <>
      <p className="flex items-baseline gap-1 text-xl font-medium leading-none tabular-nums">
        <span>{value}</span>
        {unit && (
          <span className="text-sm font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </>
  );
}

export function PracticePunchcard({ data }: { data: PracticeData }) {
  const plural = (n: number) => (n === 1 ? "" : "s");
  const empty = data.totalSessions === 0;

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h2 className="text-base font-medium">Practice</h2>
          <p className="text-sm text-muted-foreground">
            Each square is a day, across all your projects.
          </p>
        </div>

        {empty ? (
          <p className="text-sm text-muted-foreground">
            No practice logged yet — finish an interview and it&apos;ll start
            showing here.
          </p>
        ) : (
          <div className="grid auto-cols-max grid-flow-col grid-rows-2 gap-x-6 gap-y-1">
            <Stat
              value={data.totalSessions}
              label={`session${plural(data.totalSessions)}`}
            />
            <Stat value={data.totalHours} unit="hrs" label="practiced" />
            <Stat
              value={data.projectCount}
              label={`project${plural(data.projectCount)}`}
            />
          </div>
        )}

        {/* Day-grid — columns flex to fill the column width, cells stay square */}
        <div className="flex w-full gap-[3px]">
          {data.weeks.map((col, ci) => (
            <div key={ci} className="flex flex-1 flex-col gap-[3px]">
              {col.map((cell, ri) => (
                <span
                  key={ri}
                  className={cn(
                    "aspect-square rounded-[3px]",
                    cell.future ? "bg-transparent" : LEVEL[cell.level],
                  )}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Footer: the date range the grid spans + the intensity legend */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {data.startLabel} – {data.endLabel}
          </span>
          <div className="flex items-center gap-1">
            <span>less</span>
            {LEVEL.map((c, i) => (
              <span key={i} className={cn("size-2.5 rounded-[3px]", c)} />
            ))}
            <span>more</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
