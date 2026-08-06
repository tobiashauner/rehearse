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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdoptionChart } from "@/components/admin/adoption-chart";
import type { AdoptionReport as Report, Breakdown } from "@/lib/admin/adoption";

/*
 * Super-admin adoption report: growth over time, an activation funnel, repeat-
 * usage ratios, feature popularity, and a per-user breakdown. Presentational +
 * server-rendered; the chart is the one client island.
 */

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pct(part: number, whole: number): string {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
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

function FunnelBar({
  label,
  count,
  total,
  hint,
}: {
  label: string;
  count: number;
  total: number;
  hint?: string;
}) {
  const width = total ? Math.max(2, (count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {count.toLocaleString()}
          <span className="ml-2 text-xs">{hint ?? pct(count, total)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/70"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: Breakdown[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No interviews yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>{r.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {r.count.toLocaleString()}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-badge-accent/70"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function AdoptionReport({ report }: { report: Report }) {
  const { totals, funnel } = report;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Users"
          value={totals.users.toLocaleString()}
          hint="total accounts"
        />
        <StatTile
          label="Projects"
          value={totals.projects.toLocaleString()}
          hint="created all time"
        />
        <StatTile
          label="Interviews"
          value={totals.interviews.toLocaleString()}
          hint={`${totals.completedInterviews.toLocaleString()} completed`}
        />
        <StatTile
          label="Repeat users"
          value={funnel.repeatInterviewers.toLocaleString()}
          hint="ran 2+ interviews"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Growth over time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.perWeek.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nothing to chart yet</EmptyTitle>
                <EmptyDescription>
                  Weekly sign-ups, projects, and interviews will appear here as
                  activity accrues.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <AdoptionChart data={report.perWeek} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Activation funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FunnelBar
              label="Signed up"
              count={funnel.signedUp}
              total={funnel.signedUp}
              hint="100%"
            />
            <FunnelBar
              label="Created a project"
              count={funnel.createdProject}
              total={funnel.signedUp}
            />
            <FunnelBar
              label="Ran an interview"
              count={funnel.ranInterview}
              total={funnel.signedUp}
            />
            <FunnelBar
              label="Completed an interview"
              count={funnel.completedInterview}
              total={funnel.signedUp}
            />
            <FunnelBar
              label="Came back (2+ interviews)"
              count={funnel.repeatInterviewers}
              total={funnel.signedUp}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile
            label="Interviews per active user"
            value={report.interviewsPerActiveUser.toFixed(1)}
            hint="users who ran ≥1"
          />
          <StatTile
            label="Interviews per project"
            value={report.interviewsPerProject.toFixed(1)}
            hint="practice depth"
          />
          <StatTile
            label="Activated"
            value={pct(funnel.createdProject, funnel.signedUp)}
            hint="signed up → project"
          />
          <StatTile
            label="Retained"
            value={pct(funnel.repeatInterviewers, funnel.ranInterview)}
            hint="of interviewers, ran 2+"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Feature popularity
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <BreakdownCard title="Interview type" rows={report.byType} />
          <BreakdownCard title="Difficulty" rows={report.byDifficulty} />
          <BreakdownCard title="Interviewer style" rows={report.byPersonality} />
          <BreakdownCard title="Conversation mode" rows={report.byMode} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Per user</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">User</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                  <TableHead className="text-right">Interviews</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="whitespace-nowrap">Joined</TableHead>
                  <TableHead className="pr-6 whitespace-nowrap">
                    Last active
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.perUser.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell className="max-w-[16rem] pl-6">
                      <span className="block truncate">{u.email}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {u.projects}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {u.interviews}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {u.completedInterviews}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {fmtDate(u.signedUpAt)}
                    </TableCell>
                    <TableCell className="pr-6 whitespace-nowrap text-muted-foreground">
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
  );
}
