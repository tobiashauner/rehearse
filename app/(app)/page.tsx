import Link from "next/link";
import { Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import {
  ProjectTile,
  type ProjectTileData,
} from "@/components/project/project-tile";
import { DashboardOnboarding } from "@/components/dashboard-onboarding";
import {
  INTERVIEW_TYPE_OPTIONS,
  optionLabel,
} from "@/lib/validations/session";

/*
 * The single home pane: every project as a metric tile, with one contextual
 * "resume your interview" banner when a session is mid-flight. There is no
 * other top-level surface — analytics and settings live inside each project.
 */

type SessionRow = {
  id: string;
  project_id: string;
  status: string;
  interview_type: string;
  overall_score: number | null;
  started_at: string | null;
  completed_at: string | null;
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, company, role, status, created_at")
    .order("updated_at", { ascending: false });

  if (!projects || projects.length === 0) {
    return <DashboardOnboarding />;
  }

  const { data: sessionRows } = await supabase
    .from("interview_sessions")
    .select(
      "id, project_id, status, interview_type, overall_score, started_at, completed_at",
    )
    .in("status", ["in_progress", "paused", "completed"]);
  const sessions = (sessionRows ?? []) as SessionRow[];

  const byProject = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    const list = byProject.get(s.project_id) ?? [];
    list.push(s);
    byProject.set(s.project_id, list);
  }

  const tiles: ProjectTileData[] = projects.map((p) => {
    const own = byProject.get(p.id) ?? [];
    const scores = own
      .filter((s) => s.status === "completed" && s.overall_score !== null)
      .sort(
        (a, b) =>
          new Date(a.completed_at ?? 0).getTime() -
          new Date(b.completed_at ?? 0).getTime(),
      )
      .map((s) => Number(s.overall_score));
    const activity = own
      .flatMap((s) => [s.started_at, s.completed_at])
      .filter((d): d is string => Boolean(d))
      .sort();
    return {
      id: p.id,
      title: p.title,
      company: p.company,
      role: p.role,
      status: p.status,
      createdAt: p.created_at,
      scores,
      hasInProgress: own.some(
        (s) => s.status === "in_progress" || s.status === "paused",
      ),
      lastActiveAt: activity.at(-1) ?? null,
    };
  });

  // The one interview mid-flight (most recently started) gets the pane's
  // single primary action; everything else stays calm.
  const resumable = sessions
    .filter((s) => s.status === "in_progress" || s.status === "paused")
    .sort(
      (a, b) =>
        new Date(b.started_at ?? 0).getTime() -
        new Date(a.started_at ?? 0).getTime(),
    )[0];
  const resumableProject = resumable
    ? projects.find((p) => p.id === resumable.project_id)
    : undefined;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-medium">Projects</h1>
          <p className="text-muted-foreground">
            One project per application — a role at a company you&apos;re going
            after.
          </p>
        </div>
        <CreateProjectDialog triggerVariant={resumable ? "outline" : "default"} />
      </div>

      {resumable && resumableProject && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-badge-accent/15 text-badge-accent">
                <Mic className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {resumable.status === "paused"
                    ? "You have a paused interview"
                    : "You have an interview mid-flight"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {optionLabel(INTERVIEW_TYPE_OPTIONS, resumable.interview_type)}{" "}
                  interview · {resumableProject.title}
                </p>
              </div>
            </div>
            <Button
              nativeButton={false}
              render={
                <Link
                  href={`/projects/${resumable.project_id}/sessions/${resumable.id}`}
                />
              }
            >
              Resume interview
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <ProjectTile key={tile.id} project={tile} />
        ))}
      </div>
    </div>
  );
}
