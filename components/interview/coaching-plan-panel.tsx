"use client";

import { useTransition } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
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
      <CardContent className="space-y-5">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <TrendingUp className="mt-0.5 size-4 shrink-0" />
          <p>{plan.progress}</p>
        </div>

        <ol className="space-y-3">
          {plan.focusAreas.map((focus, i) => (
            <li key={i} className="rounded-lg border p-3">
              <p className="text-sm font-medium">
                {i + 1}. {focus.area}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{focus.why}</p>
              <p className="mt-1 text-sm">
                <span className="font-medium">Practice:</span> {focus.practice}
              </p>
            </li>
          ))}
        </ol>

        {plan.strengthsToKeep.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Keep doing</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {plan.strengthsToKeep.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t pt-4 text-sm">
          <span className="font-medium">Suggested next interview:</span>
          <Badge variant="accent">
            {optionLabel(
              INTERVIEW_TYPE_OPTIONS,
              plan.suggestedNextInterview.interviewType,
            )}
          </Badge>
          <Badge variant="outline">
            {optionLabel(DIFFICULTY_OPTIONS, plan.suggestedNextInterview.difficulty)}
          </Badge>
          <span className="text-muted-foreground">
            {plan.suggestedNextInterview.focus}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
