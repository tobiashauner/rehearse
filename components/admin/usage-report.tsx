import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUsd, type UsageReport as Report } from "@/lib/admin/data";
import { cn } from "@/lib/utils";

/*
 * Super-admin usage report: totals, spend per AI feature, and spend per user,
 * read from the ai_usage_events ledger. Presentational + server-rendered — the
 * data comes pre-aggregated from lib/admin/data.ts.
 */

const KIND_LABELS: Record<string, string> = {
  briefing: "Briefing",
  questions: "Question generation",
  followup: "Follow-ups",
  evaluation: "Answer evaluation",
  summary: "Session summary",
  coaching: "Coaching plan",
  tts: "Voice (TTS)",
  stt: "Transcription (STT)",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
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

export function UsageReport({ report }: { report: Report }) {
  const monthLabel = new Date(report.monthStartIso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const maxKindCents = Math.max(1, ...report.byKind.map((k) => k.cents));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total AI spend"
          value={formatUsd(report.totalCents)}
          hint={`${report.totalEvents.toLocaleString()} calls, all time`}
        />
        <StatTile
          label="This month"
          value={formatUsd(report.monthCents)}
          hint={monthLabel}
        />
        <StatTile
          label="Users"
          value={report.userCount.toLocaleString()}
          hint="total accounts"
        />
        <StatTile
          label="Active this month"
          value={report.activeThisMonth.toLocaleString()}
          hint="users with AI usage"
        />
      </div>

      {report.totalEvents === 0 ? (
        <Card>
          <CardContent className="py-4">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No AI usage yet</EmptyTitle>
                <EmptyDescription>
                  Spend will appear here as users generate briefings, run
                  interviews, and get feedback.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Spend by AI feature
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.byKind.map((k) => (
                <div key={k.kind}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">
                      {KIND_LABELS[k.kind] ?? k.kind}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatUsd(k.cents)}
                      <span className="ml-2 text-xs">
                        ({k.events.toLocaleString()})
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${(k.cents / maxKindCents) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Spend by user
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">This month</TableHead>
                      <TableHead className="text-right">All time</TableHead>
                      <TableHead className="text-right">Last active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.perUser.map((u) => (
                      <TableRow key={u.userId}>
                        <TableCell className="max-w-[16rem]">
                          <span
                            className={cn(
                              "block truncate",
                              u.disabled && "text-muted-foreground line-through",
                            )}
                          >
                            {u.email}
                          </span>
                          {u.disabled && (
                            <Badge variant="destructive" className="mt-1">
                              Disabled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatUsd(u.monthCents)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatUsd(u.totalCents)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                          {fmtDate(u.lastActivity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
