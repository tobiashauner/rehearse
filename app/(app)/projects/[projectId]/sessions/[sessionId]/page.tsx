import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InterviewRunner } from "@/components/interview/interview-runner";
import { createClient } from "@/lib/supabase/server";
import {
  CONVERSATION_MODE_OPTIONS,
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  PERSONALITY_OPTIONS,
  optionLabel,
} from "@/lib/validations/session";

const FOLLOWUP_ORDER_BASE = 1000;

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ projectId: string; sessionId: string }>;
}) {
  const { projectId, sessionId } = await params;

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("interview_sessions")
    .select(
      "id, status, interview_type, difficulty, interviewer_personality, conversation_mode, length_minutes, created_at",
    )
    .eq("id", sessionId)
    .eq("project_id", projectId)
    .single();

  if (!session) {
    notFound();
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, order_index")
    .eq("session_id", sessionId);

  const baseQuestionCount = (questions ?? []).filter(
    (q) => q.order_index < FOLLOWUP_ORDER_BASE,
  ).length;

  const reviewHref = `/projects/${projectId}/sessions/${sessionId}/review`;
  const isCompleted = session.status === "completed";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-medium">Interview</h2>
        <Badge variant="accent">
          {optionLabel(INTERVIEW_TYPE_OPTIONS, session.interview_type)}
        </Badge>
        <Badge variant="accent">
          {optionLabel(DIFFICULTY_OPTIONS, session.difficulty)}
        </Badge>
        <Badge variant="outline">
          {optionLabel(PERSONALITY_OPTIONS, session.interviewer_personality)}
        </Badge>
        <Badge variant="outline">
          {optionLabel(CONVERSATION_MODE_OPTIONS, session.conversation_mode)}
        </Badge>
        <Badge variant="outline">{session.length_minutes} min</Badge>
      </div>

      {isCompleted ? (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This interview is complete. Review your scores and feedback.
          </p>
          <Button nativeButton={false} render={<Link href={reviewHref} />}>
            View review
          </Button>
        </div>
      ) : (
        <InterviewRunner
          projectId={projectId}
          sessionId={sessionId}
          status={session.status as "configured" | "in_progress" | "completed"}
          baseQuestionCount={baseQuestionCount}
          lengthMinutes={session.length_minutes}
          reviewHref={reviewHref}
        />
      )}
    </div>
  );
}
