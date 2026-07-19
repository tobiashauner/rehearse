import { Card, CardContent } from "@/components/ui/card";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";

/*
 * First-run home (zero projects): explains the project → materials →
 * rehearse flow and opens project creation directly — the home pane is the
 * project list, so the first project is the only sensible next step.
 */

const STEPS = [
  {
    title: "Create a project",
    detail: "Name the role and company you're preparing for.",
  },
  {
    title: "Add your materials",
    detail: "Upload your resume and paste the job description.",
  },
  {
    title: "Rehearse",
    detail: "Take a mock interview built from them, with feedback on every answer.",
  },
];

export function DashboardOnboarding() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-medium">Welcome to Rehearse</h1>
        <p className="max-w-prose text-muted-foreground">
          Rehearse organizes your prep into projects — one per application, a
          specific role at a specific company. This page becomes that list.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
          <div className="flex flex-col items-start gap-4">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Start with a project</h2>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                A project gathers everything for one application — the role,
                the company, your resume, the job description, your notes.
                Rehearse turns those into mock interviews that ask what this
                interviewer actually would, and gives you structured feedback
                on every answer. Interviewing at three companies? Make three
                projects.
              </p>
            </div>
            <CreateProjectDialog triggerLabel="Create your first project" />
          </div>

          <ol className="flex flex-col gap-4 lg:border-l lg:pl-8">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium text-muted-foreground tabular-nums"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
