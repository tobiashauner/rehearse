import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddResourceDialog } from "@/components/project/add-resource-dialog";
import { ResourceList } from "@/components/project/resource-list";
import { GenerateBriefingButton } from "@/components/interview/generate-briefing-button";
import { AiBriefingView } from "@/components/interview/ai-briefing-view";
import { AiBriefingOnboarding } from "@/components/interview/ai-briefing-onboarding";
import { ProjectSettings } from "@/components/project/project-settings";
import { ProjectDashboard } from "@/components/project/project-dashboard";
import type { ProjectAnalysis } from "@/lib/prompts/project-analysis";

/*
 * Project page. The default view (no ?tab=) is the Overview dashboard, which
 * folds in what used to be the separate Interview Sessions and Analytics tabs.
 * ?tab=<section> renders one of the remaining focused sections. The section
 * rail in the project layout carries navigation (param still named `tab` so
 * older deep links keep working — retired tabs fall through to the dashboard).
 */

const SECTION_TITLES: Record<string, string> = {
  resources: "Resources",
  briefing: "AI Briefing",
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

  // ---- Overview: the single dashboard (fetches its own data) -------------
  if (!section) {
    return <ProjectDashboard projectId={project.id} />;
  }

  // ---- Focused sections: resources / briefing / settings -----------------

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

  const RESUME_LIKE_TYPES = ["resume", "cover_letter", "portfolio_pdf", "personal_notes"];
  const hasResume = (resources ?? []).some((r) => RESUME_LIKE_TYPES.includes(r.type));
  const hasJobDescription = (resources ?? []).some((r) => r.type === "job_description");
  const hasAnyResource = (resources ?? []).length > 0;
  const analysis = briefing?.content as ProjectAnalysis | undefined;

  const sectionAction =
    section === "resources" ? (
      <AddResourceDialog projectId={project.id} />
    ) : section === "briefing" ? (
      <GenerateBriefingButton
        projectId={project.id}
        hasBriefing={!!briefing}
        hasResources={hasAnyResource}
      />
    ) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-medium">{SECTION_TITLES[section]}</h2>
        {sectionAction}
      </div>

      {section === "resources" && (
        <ResourceList projectId={project.id} resources={resources ?? []} />
      )}

      {section === "briefing" &&
        (analysis ? (
          <AiBriefingView analysis={analysis} />
        ) : (
          <AiBriefingOnboarding
            hasResume={hasResume}
            hasJobDescription={hasJobDescription}
            hasAnyResource={hasAnyResource}
          />
        ))}

      {section === "settings" && (
        <ProjectSettings
          projectId={project.id}
          project={{
            title: project.title,
            company: project.company,
            role: project.role,
          }}
        />
      )}
    </div>
  );
}
