import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { ProjectTopNav } from "@/components/project/project-top-nav";
import { ProjectShell } from "@/components/project/project-shell";
import { InterviewRail } from "@/components/project/interview-rail";

/*
 * Shared frame for every page inside a project: a pinned top area (back link,
 * title, and the horizontal section nav), then the body — a persistent
 * interview rail on the left with the section/interview detail on the right
 * (the focused sections render full-width; ProjectShell decides).
 */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, company, role, status")
    .eq("id", projectId)
    .single();

  if (!project) {
    notFound();
  }

  const [{ data: sessions }, { data: briefing }, { count: completedCount }] =
    await Promise.all([
      supabase
        .from("interview_sessions")
        .select(
          "id, status, interview_type, difficulty, interviewer_personality, length_minutes, overall_score, completed_at, created_at",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("ai_briefings")
        .select("project_id")
        .eq("project_id", projectId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("interview_sessions")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("status", "completed"),
    ]);

  const subtitle =
    [project.role, project.company].filter(Boolean).join(" @ ") ||
    "No role or company set";

  return (
    <div>
      {/* Pinned top area: back link, title, and the section nav. */}
      <div className="sticky top-0 z-10 -mx-6 border-b border-border/60 bg-background/85 px-6 pb-4 backdrop-blur-sm sm:-mx-10 sm:px-10">
        <Link
          href="/"
          className="-ml-1 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" />
          Back to all projects
        </Link>

        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-3xl font-medium tracking-tight">
                {project.title}
              </h1>
              {project.status === "archived" && (
                <Badge variant="outline" className="capitalize">
                  archived
                </Badge>
              )}
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[0.9375rem] font-medium text-foreground/75">
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{subtitle}</span>
            </p>
          </div>
          <ProjectTopNav projectId={project.id} />
        </div>
      </div>

      <div className="pt-6">
        <ProjectShell
          rail={
            <InterviewRail
              projectId={project.id}
              sessions={sessions ?? []}
              hasBriefing={!!briefing}
              completedCount={completedCount ?? 0}
            />
          }
        >
          {children}
        </ProjectShell>
      </div>
    </div>
  );
}
