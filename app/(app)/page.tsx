import { createClient } from "@/lib/supabase/server";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import {
  ProjectTile,
  type ProjectTileData,
} from "@/components/project/project-tile";
import { DashboardOnboarding } from "@/components/dashboard-onboarding";
import { PracticePunchcard } from "@/components/practice-punchcard";
import { buildPracticeData } from "@/lib/practice";

/*
 * The single home pane: a two-column layout — full-width project cards on the
 * left (2/3), each listing its own interviews, and a right rail (1/3) with the
 * cross-project practice punch-card.
 */

type SessionRow = {
  id: string;
  project_id: string;
  status: string;
  interview_type: string;
  difficulty: string;
  overall_score: number | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
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
      "id, project_id, status, interview_type, difficulty, overall_score, started_at, completed_at, duration_seconds",
    )
    .in("status", ["configured", "in_progress", "paused", "completed"]);
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
    return {
      id: p.id,
      title: p.title,
      company: p.company,
      role: p.role,
      status: p.status,
      createdAt: p.created_at,
      scores,
      interviews: own.map((s) => ({
        id: s.id,
        interviewType: s.interview_type,
        difficulty: s.difficulty,
        status: s.status as ProjectTileData["interviews"][number]["status"],
        score: s.overall_score,
        completedAt: s.completed_at,
      })),
    };
  });

  // Practice tracked across every project — a calm punch-card, not a streak.
  // The grid spans from the user's first project to today.
  const firstProjectDate = projects.reduce(
    (min, p) => (p.created_at < min ? p.created_at : min),
    projects[0].created_at,
  );
  const practiceData = buildPracticeData(
    sessions
      .filter((s) => s.status === "completed" && s.completed_at)
      .map((s) => ({
        completedAt: s.completed_at as string,
        durationSeconds: s.duration_seconds,
        projectId: s.project_id,
      })),
    firstProjectDate,
  );

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
        <CreateProjectDialog />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-4 lg:col-span-2">
          {tiles.map((tile) => (
            <ProjectTile key={tile.id} project={tile} />
          ))}
        </div>

        <aside className="space-y-6">
          <PracticePunchcard data={practiceData} />
        </aside>
      </div>
    </div>
  );
}
