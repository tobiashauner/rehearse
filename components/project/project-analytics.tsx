import { createClient } from "@/lib/supabase/server";
import {
  AnalyticsWidgets,
  type WeekBucket,
} from "@/components/analytics-widgets";
import { formatTileDate } from "@/components/tiles";

/*
 * Project-scoped analytics (the Analytics tab): the same widget set the old
 * global Analytics page used, but computed from this project's sessions and
 * answers only — analytics lives at project level, matching the IA.
 */

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

export async function ProjectAnalytics({ projectId }: { projectId: string }) {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("id, overall_score, completed_at, duration_seconds")
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

  const scored = completed
    .filter(
      (s): s is typeof s & { overall_score: number; completed_at: string } =>
        s.overall_score !== null && s.completed_at !== null,
    )
    .sort(
      (a, b) =>
        new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime(),
    )
    .map((s) => ({ score: Number(s.overall_score), completedAt: s.completed_at }));

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

  return (
    <AnalyticsWidgets
      scored={scored}
      totalSeconds={totalSeconds}
      weekSeconds={weekSeconds}
      avgWords={avgWords}
      answerCount={wordCounts.length}
      weeks={weeks}
    />
  );
}
