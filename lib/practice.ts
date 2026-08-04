/*
 * Practice punch-card data, aggregated across every project. A calm,
 * contribution-graph-style record of which days you practiced — no streak,
 * flame, or pressure (see PRODUCT.md: the app avoids gamification). Filled
 * intensity reflects how many interviews you completed that day.
 */

export type PracticeCell = {
  /** 0 = none, 1–3 = intensity (sessions that day, capped at 3). */
  level: 0 | 1 | 2 | 3;
  /** A day after today (padding out the current week) — render blank. */
  future: boolean;
};

export type PracticeData = {
  /** Columns of 7 days (Mon→Sun), oldest week first. */
  weeks: PracticeCell[][];
  totalSessions: number;
  /** Total practice hours, one decimal. */
  totalHours: number;
  /** Minutes practiced in the current week. */
  weekMinutes: number;
  projectCount: number;
  /** Date range the grid spans, e.g. "Apr 20" … "Aug 4". */
  startLabel: string;
  endLabel: string;
};

type Input = {
  completedAt: string;
  durationSeconds: number | null;
  projectId: string;
};

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function fmt(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function buildPracticeData(
  sessions: Input[],
  firstProjectDate: string | null,
): PracticeData {
  // Always returns a grid — an empty one (all level 0) drives the empty state.
  const completed = sessions.filter((s) => s.completedAt);

  const byDay = new Map<string, number>();
  for (const s of completed) {
    const k = dayKey(new Date(s.completedAt));
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }

  const totalSessions = completed.length;
  const totalSeconds = completed.reduce(
    (a, s) => a + (s.durationSeconds ?? 0),
    0,
  );
  const totalHours = Math.round(totalSeconds / 360) / 10;
  const projectCount = new Set(completed.map((s) => s.projectId)).size;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7; // Monday = 0
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - dow);

  // Span from the week of the user's first project to this week — clamped so
  // it's never a sliver for brand-new users nor absurdly wide for old accounts.
  let weeksCount = 16;
  if (firstProjectDate) {
    const fp = new Date(firstProjectDate);
    fp.setHours(0, 0, 0, 0);
    const firstMonday = new Date(fp);
    firstMonday.setDate(fp.getDate() - ((fp.getDay() + 6) % 7));
    const between = Math.round(
      (thisMonday.getTime() - firstMonday.getTime()) / (7 * 86_400_000),
    );
    weeksCount = Math.max(18, Math.min(52, between + 1));
  }

  const start = new Date(thisMonday);
  start.setDate(thisMonday.getDate() - (weeksCount - 1) * 7);

  const weekMinutes = Math.round(
    completed.reduce(
      (a, s) =>
        a +
        (new Date(s.completedAt) >= thisMonday ? (s.durationSeconds ?? 0) : 0),
      0,
    ) / 60,
  );

  const weeks: PracticeCell[][] = [];
  for (let w = 0; w < weeksCount; w++) {
    const col: PracticeCell[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const count = byDay.get(dayKey(day)) ?? 0;
      col.push({
        level: Math.min(3, count) as PracticeCell["level"],
        future: day > today,
      });
    }
    weeks.push(col);
  }

  return {
    weeks,
    totalSessions,
    totalHours,
    weekMinutes,
    projectCount,
    startLabel: fmt(start),
    endLabel: fmt(today),
  };
}
