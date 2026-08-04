"use client";

import { useTransition } from "react";
import {
  CircleCheck,
  Dumbbell,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  optionLabel,
} from "@/lib/validations/session";
import { ConfigureInterviewDialog } from "@/components/interview/configure-interview-dialog";
import type { CoachingPlan } from "@/lib/prompts/coaching-plan";
import { generateCoachingPlan } from "@/app/(app)/projects/[projectId]/sessions/actions";

export function CoachingPlanPanel({
  projectId,
  plan,
  generatedAt,
  completedSessionCount,
}: {
  projectId: string;
  plan: CoachingPlan | null;
  generatedAt: string | null;
  completedSessionCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  // Nothing to coach on yet — stay out of the way until a session is done.
  if (completedSessionCount === 0 && !plan) return null;

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateCoachingPlan(projectId);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  // Always outline: "New Interview" above is the section's one amber action.
  const generateButton = (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending || completedSessionCount === 0}
      onClick={handleGenerate}
    >
      {isPending && <Spinner />}
      {isPending ? "Generating…" : plan ? "Refresh plan" : "Generate coaching plan"}
    </Button>
  );

  if (!plan) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium">AI Coaching</p>
              <p className="text-sm text-muted-foreground">
                Turn your {completedSessionCount === 1 ? "finished session" : `${completedSessionCount} finished sessions`}{" "}
                into a plan for what to practice next.
              </p>
            </div>
          </div>
          {generateButton}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-base font-medium">AI Coaching Plan</CardTitle>
            <CardDescription>
              {plan.headline}
              {generatedAt &&
                ` · Generated ${new Date(generatedAt).toLocaleDateString()}`}
            </CardDescription>
          </div>
          {generateButton}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress — trend callout */}
        <div className="flex items-start gap-3 rounded-xl bg-primary/[0.08] p-4">
          <TrendingUp className="mt-0.5 size-5 shrink-0 text-badge-accent" />
          <p className="text-sm leading-relaxed">{plan.progress}</p>
        </div>

        {/* Focus areas */}
        <PlanSection icon={Target} title="Focus areas">
          <ol className="space-y-3">
            {plan.focusAreas.map((focus, i) => (
              <li key={i} className="rounded-xl border bg-card p-4 shadow-resting">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-badge-accent text-xs font-semibold text-badge-accent-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <p className="font-medium">{focus.area}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{focus.why}</p>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm">
                  <Dumbbell className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p>
                    <span className="font-medium">Practice:</span>{" "}
                    {focus.practice}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </PlanSection>

        {/* Keep doing */}
        {plan.strengthsToKeep.length > 0 && (
          <PlanSection icon={CircleCheck} title="Keep doing">
            <ul className="space-y-2">
              {plan.strengthsToKeep.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-foreground/80"
                >
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-badge-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </PlanSection>
        )}

        {/* Suggested next interview */}
        <div className="rounded-xl bg-primary/[0.08] p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-badge-accent" />
            <p className="text-sm font-medium">Suggested next interview</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="accent">
              {optionLabel(
                INTERVIEW_TYPE_OPTIONS,
                plan.suggestedNextInterview.interviewType,
              )}
            </Badge>
            <Badge variant="outline">
              {optionLabel(
                DIFFICULTY_OPTIONS,
                plan.suggestedNextInterview.difficulty,
              )}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {plan.suggestedNextInterview.focus}
          </p>
          <div className="mt-3">
            {/* A coaching plan only exists after completed interviews, which
                required a briefing — so hasBriefing is effectively true here;
                createInterviewSession re-checks and errors if it's gone. */}
            <ConfigureInterviewDialog
              projectId={projectId}
              hasBriefing
              completedSessionCount={completedSessionCount}
              initialConfig={{
                interviewType: plan.suggestedNextInterview.interviewType,
                difficulty: plan.suggestedNextInterview.difficulty,
              }}
              triggerLabel="Start this interview"
              title="Start the suggested interview"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** A labeled sub-section of the coaching plan: icon + title, then content. */
function PlanSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
