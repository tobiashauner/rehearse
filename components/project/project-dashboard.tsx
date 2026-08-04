import { createClient } from "@/lib/supabase/server";
import { getProjectAnalytics } from "@/lib/analytics";
import { CoachingPlanPanel } from "@/components/interview/coaching-plan-panel";
import {
  DeliverySummaryTile,
  ScoreTrendTile,
} from "@/components/analytics-widgets";
import type { CoachingPlan } from "@/lib/prompts/coaching-plan";

/*
 * The Overview dashboard — the right-hand detail for the project. Interviews
 * live in the persistent left rail (project layout); this shows how the score
 * is progressing, the coaching plan, and practice stats. Fetches its own data.
 */

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-xl font-medium">{title}</h2>;
}

export async function ProjectDashboard({ projectId }: { projectId: string }) {
  const supabase = await createClient();

  const [{ data: coaching }, { count: completedCount }] = await Promise.all([
    supabase
      .from("coaching_plans")
      .select("recommendations, generated_at")
      .eq("project_id", projectId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("interview_sessions")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "completed"),
  ]);

  const analytics = await getProjectAnalytics(projectId);

  return (
    <div className="space-y-10">
      {/* ————— Score progression & highlights ————— */}
      <section className="space-y-4">
        <SectionHeading title="Score progression" />
        <div className="grid gap-3 rounded-2xl bg-accent p-3 sm:gap-4 sm:p-4 lg:grid-cols-3">
          <ScoreTrendTile scores={analytics.scored} />
          <DeliverySummaryTile delivery={analytics.delivery} />
        </div>
      </section>

      {/* ————— Coaching plan ————— */}
      <CoachingPlanPanel
        projectId={projectId}
        plan={(coaching?.recommendations as CoachingPlan | undefined) ?? null}
        generatedAt={coaching?.generated_at ?? null}
        completedSessionCount={completedCount ?? 0}
      />

    </div>
  );
}
