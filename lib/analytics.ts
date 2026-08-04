import { createClient } from "@/lib/supabase/server";
import { formatTileDate } from "@/components/tiles";
import type { WeekBucket } from "@/components/analytics-widgets";
import type { ScoreTrendPoint } from "@/components/score-trend-chart";
import type { DeliveryReport } from "@/lib/delivery";

/*
 * Project analytics computation, shared by the dashboard. Pulls the completed
 * sessions + their answers and derives the score series, practice time, answer
 * length, and weekly cadence. (Formerly inline in the Analytics tab, which has
 * been folded into the single Overview dashboard.)
 */

/** Project-wide delivery read, averaged across every scored interview. */
export type DeliverySummary = {
  /** Average delivery score, 0–100. */
  score: number;
  /** Interviews that carried a delivery read. */
  count: number;
  /** Latest delivery score minus the earliest — the trend. */
  delta: number | null;
  /** Per-dimension averages, substance dimensions first. */
  dimensions: {
    key: string;
    label: string;
    group: "substance" | "habit";
    score: number;
  }[];
  /** Neutral observations from the most recent interview (e.g. ownership). */
  observations: string[];
};

export type ProjectAnalytics = {
  scored: ScoreTrendPoint[];
  totalSeconds: number;
  weekSeconds: number;
  avgWords: number | null;
  answerCount: number;
  weeks: WeekBucket[];
  delivery: DeliverySummary | null;
};

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

export async function getProjectAnalytics(
  projectId: string,
): Promise<ProjectAnalytics> {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select(
      "id, overall_score, completed_at, duration_seconds, interview_type, difficulty, summary",
    )
    .eq("project_id", projectId)
    .eq("status", "completed");
  const completed = sessions ?? [];

  const sessionIds = completed.map((s) => s.id);
  const { data: questions } = sessionIds.length
    ? await supabase.from("questions").select("id").in("session_id", sessionIds)
    : { data: [] };
  const questionIds = (questions ?? []).map((q) => q.id);
  const { data: answers } = questionIds.length
    ? await supabase
        .from("answers")
        .select("transcript")
        .in("question_id", questionIds)
        .eq("is_current", true)
        .not("transcript", "is", null)
    : { data: [] };

  const scored: ScoreTrendPoint[] = completed
    .filter(
      (s): s is typeof s & { overall_score: number; completed_at: string } =>
        s.overall_score !== null && s.completed_at !== null,
    )
    .sort(
      (a, b) =>
        new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime(),
    )
    .map((s) => ({
      score: Number(s.overall_score),
      completedAt: s.completed_at,
      interviewType: s.interview_type,
      difficulty: s.difficulty,
      durationSeconds: s.duration_seconds,
    }));

  const thisWeek = startOfWeek(new Date());
  const totalSeconds = completed.reduce(
    (sum, s) => sum + (s.duration_seconds ?? 0),
    0,
  );
  const weekSeconds = completed.reduce(
    (sum, s) =>
      sum +
      (s.completed_at && new Date(s.completed_at) >= thisWeek
        ? (s.duration_seconds ?? 0)
        : 0),
    0,
  );

  const wordCounts = (answers ?? [])
    .map((a) => (a.transcript ?? "").trim())
    .filter(Boolean)
    .map((t) => t.split(/\s+/).length);
  const avgWords =
    wordCounts.length > 0
      ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
      : null;

  const weeks: WeekBucket[] = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - (7 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return {
      label: formatTileDate(start.toISOString()),
      count: completed.filter(
        (s) =>
          s.completed_at &&
          new Date(s.completed_at) >= start &&
          new Date(s.completed_at) < end,
      ).length,
    };
  });

  // Delivery read, aggregated across every interview that has one (oldest →
  // newest so the trend reads forward). Old sessions predating delivery are
  // simply skipped.
  const reports = completed
    .filter(
      (s): s is typeof s & { completed_at: string } => s.completed_at !== null,
    )
    .sort(
      (a, b) =>
        new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime(),
    )
    .map(
      (s) => (s.summary as { delivery?: DeliveryReport | null } | null)?.delivery,
    )
    .filter((d): d is DeliveryReport => Boolean(d));

  let delivery: DeliverySummary | null = null;
  if (reports.length > 0) {
    const mean = (ns: number[]) =>
      Math.round(ns.reduce((a, b) => a + b, 0) / ns.length);
    const order = [
      "specificity",
      "structure",
      "directness",
      "pace",
      "hedging",
      "fillers",
    ];
    const dimensions = order
      .map((key) => {
        const found = reports
          .map((r) => r.metrics.find((m) => m.key === key))
          .filter((m): m is NonNullable<typeof m> => Boolean(m));
        if (found.length === 0) return null;
        return {
          key,
          label: found[0].label,
          group: found[0].group,
          score: mean(found.map((m) => m.score)),
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
    delivery = {
      score: mean(reports.map((r) => r.score)),
      count: reports.length,
      delta:
        reports.length >= 2
          ? Math.round(reports[reports.length - 1].score - reports[0].score)
          : null,
      dimensions,
      observations: reports[reports.length - 1].observations,
    };
  }

  return {
    scored,
    totalSeconds,
    weekSeconds,
    avgWords,
    answerCount: wordCounts.length,
    weeks,
    delivery,
  };
}
