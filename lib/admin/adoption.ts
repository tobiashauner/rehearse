import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { listAllUsers } from "@/lib/admin/data";
import {
  CONVERSATION_MODE_OPTIONS,
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  PERSONALITY_OPTIONS,
  optionLabel,
} from "@/lib/validations/session";

/*
 * Adoption / engagement report for the admin area. Aggregates projects and
 * interview_sessions (read cross-user via the service-role client) plus signup
 * dates from the Admin API into: growth over time, an activation funnel,
 * repeat-usage ratios, feature popularity, and a per-user breakdown.
 *
 * Server-only; callers must sit behind requireSuperAdmin(). Reads are
 * paginated so nothing is silently truncated at Supabase's 1000-row cap.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_WEEKS = 52;

export type WeekPoint = {
  weekStartIso: string;
  label: string;
  newUsers: number;
  newProjects: number;
  newInterviews: number;
};

export type Breakdown = { key: string; label: string; count: number };

export type PerUserAdoption = {
  userId: string;
  email: string;
  name: string | null;
  signedUpAt: string;
  projects: number;
  interviews: number;
  completedInterviews: number;
  lastActivity: string | null;
};

export type AdoptionReport = {
  totals: {
    users: number;
    projects: number;
    interviews: number;
    completedInterviews: number;
  };
  funnel: {
    signedUp: number;
    createdProject: number;
    ranInterview: number;
    completedInterview: number;
    repeatInterviewers: number;
  };
  perWeek: WeekPoint[];
  interviewsPerActiveUser: number;
  interviewsPerProject: number;
  byType: Breakdown[];
  byDifficulty: Breakdown[];
  byPersonality: Breakdown[];
  byMode: Breakdown[];
  perUser: PerUserAdoption[];
};

/** Monday 00:00 UTC of the week containing `d`. */
function weekStart(d: Date): Date {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dayFromMonday = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - dayFromMonday);
  return x;
}

function weekLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Fetch every row of a select, paging past Supabase's 1000-row page cap. */
async function fetchAll<T>(
  run: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await run(from, from + pageSize - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

function toBreakdown(
  counts: Map<string, number>,
  options: readonly { value: string; label: string }[],
): Breakdown[] {
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: optionLabel(options, key), count }))
    .sort((a, b) => b.count - a.count);
}

export async function buildAdoptionReport(): Promise<AdoptionReport> {
  const admin = createAdminClient();

  const [users, projects, sessions] = await Promise.all([
    listAllUsers(),
    fetchAll<{ id: string; user_id: string; created_at: string }>((from, to) =>
      admin.from("projects").select("id, user_id, created_at").range(from, to),
    ),
    fetchAll<{
      id: string;
      project_id: string;
      created_at: string;
      completed_at: string | null;
      status: string;
      interview_type: string;
      difficulty: string;
      interviewer_personality: string;
      conversation_mode: string;
    }>((from, to) =>
      admin
        .from("interview_sessions")
        .select(
          "id, project_id, created_at, completed_at, status, interview_type, difficulty, interviewer_personality, conversation_mode",
        )
        .range(from, to),
    ),
  ]);

  const projectUser = new Map(projects.map((p) => [p.id, p.user_id]));

  // Per-user rollup, seeded from every account (so zero-activity users show).
  const perUser = new Map<string, PerUserAdoption>();
  for (const u of users) {
    perUser.set(u.id, {
      userId: u.id,
      email: u.email,
      name: u.name,
      signedUpAt: u.createdAt,
      projects: 0,
      interviews: 0,
      completedInterviews: 0,
      lastActivity: null,
    });
  }
  const bumpActivity = (userId: string, iso: string | null) => {
    if (!iso) return;
    const pu = perUser.get(userId);
    if (pu && (!pu.lastActivity || iso > pu.lastActivity)) pu.lastActivity = iso;
  };

  for (const p of projects) {
    const pu = perUser.get(p.user_id);
    if (pu) pu.projects += 1;
    bumpActivity(p.user_id, p.created_at);
  }

  const byType = new Map<string, number>();
  const byDifficulty = new Map<string, number>();
  const byPersonality = new Map<string, number>();
  const byMode = new Map<string, number>();
  let completedInterviews = 0;

  for (const s of sessions) {
    const userId = projectUser.get(s.project_id);
    const completed = s.status === "completed";
    if (completed) completedInterviews += 1;
    if (userId) {
      const pu = perUser.get(userId);
      if (pu) {
        pu.interviews += 1;
        if (completed) pu.completedInterviews += 1;
      }
      bumpActivity(userId, s.created_at);
      bumpActivity(userId, s.completed_at);
    }
    byType.set(s.interview_type, (byType.get(s.interview_type) ?? 0) + 1);
    byDifficulty.set(s.difficulty, (byDifficulty.get(s.difficulty) ?? 0) + 1);
    byPersonality.set(
      s.interviewer_personality,
      (byPersonality.get(s.interviewer_personality) ?? 0) + 1,
    );
    byMode.set(s.conversation_mode, (byMode.get(s.conversation_mode) ?? 0) + 1);
  }

  // Weekly time series across the active range (capped to the last MAX_WEEKS).
  const allDates = [
    ...users.map((u) => u.createdAt),
    ...projects.map((p) => p.created_at),
    ...sessions.map((s) => s.created_at),
  ]
    .map((d) => new Date(d).getTime())
    .filter((n) => Number.isFinite(n));

  const perWeek: WeekPoint[] = [];
  if (allDates.length > 0) {
    const firstWeek = weekStart(new Date(Math.min(...allDates)));
    const lastWeek = weekStart(new Date());
    const byWeek = new Map<string, WeekPoint>();
    for (
      let t = firstWeek.getTime();
      t <= lastWeek.getTime();
      t += 7 * DAY_MS
    ) {
      const iso = new Date(t).toISOString();
      byWeek.set(iso, {
        weekStartIso: iso,
        label: weekLabel(iso),
        newUsers: 0,
        newProjects: 0,
        newInterviews: 0,
      });
    }
    const add = (iso: string, field: keyof Pick<WeekPoint, "newUsers" | "newProjects" | "newInterviews">) => {
      const key = weekStart(new Date(iso)).toISOString();
      const point = byWeek.get(key);
      if (point) point[field] += 1;
    };
    users.forEach((u) => add(u.createdAt, "newUsers"));
    projects.forEach((p) => add(p.created_at, "newProjects"));
    sessions.forEach((s) => add(s.created_at, "newInterviews"));
    perWeek.push(...[...byWeek.values()].slice(-MAX_WEEKS));
  }

  const perUserArr = [...perUser.values()].sort(
    (a, b) =>
      b.interviews - a.interviews ||
      b.projects - a.projects ||
      b.signedUpAt.localeCompare(a.signedUpAt),
  );

  const createdProject = perUserArr.filter((u) => u.projects > 0).length;
  const ranInterview = perUserArr.filter((u) => u.interviews > 0).length;
  const completedInterview = perUserArr.filter(
    (u) => u.completedInterviews > 0,
  ).length;
  const repeatInterviewers = perUserArr.filter((u) => u.interviews >= 2).length;

  return {
    totals: {
      users: users.length,
      projects: projects.length,
      interviews: sessions.length,
      completedInterviews,
    },
    funnel: {
      signedUp: users.length,
      createdProject,
      ranInterview,
      completedInterview,
      repeatInterviewers,
    },
    perWeek,
    interviewsPerActiveUser: ranInterview ? sessions.length / ranInterview : 0,
    interviewsPerProject: projects.length ? sessions.length / projects.length : 0,
    byType: toBreakdown(byType, INTERVIEW_TYPE_OPTIONS),
    byDifficulty: toBreakdown(byDifficulty, DIFFICULTY_OPTIONS),
    byPersonality: toBreakdown(byPersonality, PERSONALITY_OPTIONS),
    byMode: toBreakdown(byMode, CONVERSATION_MODE_OPTIONS),
    perUser: perUserArr,
  };
}
