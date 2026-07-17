import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddResourceDialog } from "@/components/project/add-resource-dialog";
import { ResourceList } from "@/components/project/resource-list";
import { GenerateBriefingButton } from "@/components/interview/generate-briefing-button";
import { AiBriefingView } from "@/components/interview/ai-briefing-view";
import { AiBriefingOnboarding } from "@/components/interview/ai-briefing-onboarding";
import { ConfigureInterviewDialog } from "@/components/interview/configure-interview-dialog";
import { SessionList } from "@/components/interview/session-list";
import { CoachingPlanPanel } from "@/components/interview/coaching-plan-panel";
import { ProjectAnalytics } from "@/components/project/project-analytics";
import { SectionTiles } from "@/components/project/section-tiles";
import { RESOURCE_TYPE_OPTIONS } from "@/lib/validations/resource";
import {
  INTERVIEW_TYPE_OPTIONS,
  optionLabel,
} from "@/lib/validations/session";
import type { ProjectAnalysis } from "@/lib/prompts/project-analysis";
import type { CoachingPlan } from "@/lib/prompts/coaching-plan";

/*
 * Project page. The default view is the overview: a compact summary tile per
 * section. ?tab=<section> renders that single section; the section rail in
 * the project layout carries navigation (the param is still named `tab` so
 * older deep links keep working).
 */

const SECTION_TITLES: Record<string, string> = {
  resources: "Resources",
  briefing: "AI Briefing",
  sessions: "Interview Sessions",
  analytics: "Analytics",
  settings: "Settings",
};

export default async function ProjectDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { projectId } = await params;
  const { tab } = await searchParams;
  const section = tab && SECTION_TITLES[tab] ? tab : null;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, company, role, status, created_at")
    .eq("id", projectId)
    .single();

  if (!project) {
    notFound();
  }

  const { data: resources } = await supabase
    .from("resources")
    .select("id, project_id, type, name, storage_path, url, content, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const { data: briefing } = await supabase
    .from("ai_briefings")
    .select("content, generated_at")
    .eq("project_id", projectId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select(
      "id, status, interview_type, difficulty, interviewer_personality, length_minutes, overall_score, duration_seconds, completed_at, created_at",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const { data: coachingPlan } = await supabase
    .from("coaching_plans")
    .select("recommendations, generated_at")
    .eq("project_id", projectId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const RESUME_LIKE_TYPES = ["resume", "cover_letter", "portfolio_pdf", "personal_notes"];
  const hasResume = (resources ?? []).some((r) => RESUME_LIKE_TYPES.includes(r.type));
  const hasJobDescription = (resources ?? []).some((r) => r.type === "job_description");
  const hasAnyResource = (resources ?? []).length > 0;

  const allSessions = sessions ?? [];
  const completedSessions = allSessions.filter((s) => s.status === "completed");
  const scores = completedSessions
    .filter((s) => s.overall_score !== null && s.completed_at !== null)
    .sort(
      (a, b) =>
        new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime(),
    )
    .map((s) => Number(s.overall_score));

  const analysis = briefing?.content as ProjectAnalysis | undefined;

  // ---- Section view -----------------------------------------------------

  if (section) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-medium">{SECTION_TITLES[section]}</h2>

        {section === "resources" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <AddResourceDialog projectId={project.id} />
            </div>
            <ResourceList projectId={project.id} resources={resources ?? []} />
          </div>
        )}

        {section === "briefing" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <GenerateBriefingButton
                projectId={project.id}
                hasBriefing={!!briefing}
                hasResources={hasAnyResource}
              />
            </div>
            {analysis ? (
              <AiBriefingView analysis={analysis} />
            ) : (
              <AiBriefingOnboarding
                hasResume={hasResume}
                hasJobDescription={hasJobDescription}
                hasAnyResource={hasAnyResource}
              />
            )}
          </div>
        )}

        {section === "sessions" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <ConfigureInterviewDialog
                projectId={project.id}
                hasBriefing={!!briefing}
                completedSessionCount={completedSessions.length}
              />
            </div>
            <CoachingPlanPanel
              projectId={project.id}
              plan={
                (coachingPlan?.recommendations as CoachingPlan | undefined) ?? null
              }
              generatedAt={coachingPlan?.generated_at ?? null}
              completedSessionCount={completedSessions.length}
            />
            <SessionList projectId={project.id} sessions={allSessions} />
          </div>
        )}

        {section === "analytics" && <ProjectAnalytics projectId={project.id} />}

        {section === "settings" && (
          <p className="max-w-prose text-muted-foreground">
            Project settings — interviewer voice, playback speed, auto-advance,
            and recording retention — will live here.
          </p>
        )}
      </div>
    );
  }

  // ---- Overview: compact summary tile per section -----------------------
  // (The project title lives in the layout header, above the rail.)

  return (
    <div className="space-y-8">
      <SectionTiles
        projectId={project.id}
        hasAnyResource={hasAnyResource}
        resources={{
          count: (resources ?? []).length,
          items: (resources ?? []).map((r) => ({
            primary: r.name || optionLabel(RESOURCE_TYPE_OPTIONS, r.type),
            secondary: r.name
              ? optionLabel(RESOURCE_TYPE_OPTIONS, r.type)
              : undefined,
          })),
        }}
        briefing={
          analysis && briefing
            ? {
                generatedAt: briefing.generated_at,
                roleSummary: analysis.roleSummary,
                skills: analysis.requiredSkills ?? [],
              }
            : null
        }
        sessions={{
          count: allSessions.length,
          inProgressCount: allSessions.filter((s) => s.status === "in_progress")
            .length,
          latestScore: scores.at(-1) ?? null,
          hasCoachingPlan: !!coachingPlan,
          recent: allSessions.map((s) => ({
            primary: optionLabel(INTERVIEW_TYPE_OPTIONS, s.interview_type),
            secondary:
              s.status === "completed" && s.overall_score !== null
                ? `${Math.round(Number(s.overall_score))}`
                : s.status.replace("_", " "),
          })),
        }}
        analytics={
          scores.length > 0
            ? {
                scores,
                averageScore:
                  scores.reduce((a, b) => a + b, 0) / scores.length,
                totalMinutes: Math.round(
                  completedSessions.reduce(
                    (sum, s) => sum + (s.duration_seconds ?? 0),
                    0,
                  ) / 60,
                ),
              }
            : null
        }
      />
    </div>
  );
}
