import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { ProjectSidebar } from "@/components/project/project-sidebar";

/*
 * Shared frame for every page inside a project: the project title (with a
 * back-to-projects arrow on its left) sits above the section rail + content,
 * so pages below only render their own section-level headings.
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
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <Link
          href="/"
          aria-label="All projects"
          title="All projects"
          className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-3xl font-medium">{project.title}</h1>
            {project.status === "archived" && (
              <Badge variant="outline" className="capitalize">
                archived
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-10">
        <ProjectSidebar projectId={project.id} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
