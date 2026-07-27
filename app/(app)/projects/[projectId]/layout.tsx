import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { ProjectSidebar } from "@/components/project/project-sidebar";

/*
 * Shared frame for every page inside a project: a labeled "Back to all
 * projects" link on its own row, then the project title above the section
 * rail + content, so pages below only render their own section-level
 * headings.
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

  const subtitle =
    [project.role, project.company].filter(Boolean).join(" @ ") ||
    "No role or company set";

  return (
    <div>
      {/* Frozen top area: back link sits tight above the title, and the whole
          block stays pinned so the project stays identified on long pages.
          Negative margins let the backdrop span the padded content width. */}
      <div className="sticky top-0 z-10 -mx-6 border-b border-border/60 bg-background/85 px-6 pb-4 backdrop-blur-sm sm:-mx-10 sm:px-10">
        <Link
          href="/"
          className="-ml-1 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" />
          Back to all projects
        </Link>

        <div className="mt-1 min-w-0">
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
      </div>

      <div className="flex flex-col gap-6 pt-6 md:flex-row md:gap-0">
        <ProjectSidebar projectId={project.id} />
        <div className="min-w-0 flex-1 md:border-l md:border-border md:pl-10">
          {children}
        </div>
      </div>
    </div>
  );
}
