import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ensureSessionSummary } from "@/app/(app)/projects/[projectId]/sessions/[sessionId]/actions";
import type { SessionSummary } from "@/lib/prompts/session-summary";
import type { AnswerEvaluation } from "@/lib/prompts/answer-evaluation";

function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function ReviewSessionPage({
  params,
}: {
  params: Promise<{ projectId: string; sessionId: string }>;
}) {
  const { projectId, sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select(
      "id, status, overall_score, summary, duration_seconds, completed_at",
    )
    .eq("id", sessionId)
    .eq("project_id", projectId)
    .single();

  if (!session) {
    notFound();
  }

  const interviewHref = `/projects/${projectId}/sessions/${sessionId}`;

  if (session.status !== "completed") {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-medium">Review</h2>
        <p className="text-muted-foreground">
          This interview isn&apos;t finished yet. Complete it to see your review.
        </p>
        <Button nativeButton={false} render={<Link href={interviewHref} />}>
          Go to interview
        </Button>
      </div>
    );
  }

  // Lazily generate the summary if completion didn't produce one.
  if (!session.summary) {
    await ensureSessionSummary(projectId, sessionId);
    const { data: refreshed } = await supabase
      .from("interview_sessions")
      .select("overall_score, summary")
      .eq("id", sessionId)
      .single();
    if (refreshed) {
      session.overall_score = refreshed.overall_score;
      session.summary = refreshed.summary;
    }
  }

  const summary = session.summary as SessionSummary | null;

  // Transcript: questions in the order they were asked, with their answers.
  const { data: questions } = await supabase
    .from("questions")
    .select("id, question, category, order_index, asked_at")
    .eq("session_id", sessionId);

  const questionIds = (questions ?? []).map((q) => q.id);
  const { data: answers } = questionIds.length
    ? await supabase
        .from("answers")
        .select("question_id, transcript, score, feedback, audio_storage_path")
        .in("question_id", questionIds)
        .eq("is_current", true)
    : { data: [] };

  const answerByQuestion = new Map(
    (answers ?? []).map((a) => [a.question_id as string, a]),
  );

  // Signed playback URLs for spoken answers (private bucket, 1h TTL).
  const audioPaths = (answers ?? [])
    .map((a) => a.audio_storage_path as string | null)
    .filter((p): p is string => Boolean(p));
  const audioUrlByPath = new Map<string, string>();
  if (audioPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("interview-audio")
      .createSignedUrls(audioPaths, 60 * 60);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) audioUrlByPath.set(s.path, s.signedUrl);
    }
  }

  const transcript = [...(questions ?? [])]
    .sort((a, b) => {
      const at = a.asked_at ? new Date(a.asked_at).getTime() : Infinity;
      const bt = b.asked_at ? new Date(b.asked_at).getTime() : Infinity;
      return at - bt || a.order_index - b.order_index;
    })
    .filter((q) => answerByQuestion.has(q.id));

  const duration = formatDuration(session.duration_seconds);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-medium">Interview Review</h2>
          <p className="text-muted-foreground">
            {transcript.length} answered
            {duration ? ` · ${duration}` : ""}
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={interviewHref} />}
        >
          Back to interview
        </Button>
      </div>

      {summary ? (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-3xl font-semibold text-primary tabular-nums">
                {Math.round(summary.overallScore)}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Overall score
                </p>
                <p className="text-lg">{summary.headline}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <ReviewList title="Strengths" items={summary.strengths} />
            <ReviewList title="Areas to improve" items={summary.weaknesses} />
            <ReviewList
              title="Questions to revisit"
              items={summary.questionsMissed}
            />
            <ReviewList
              title="Recommended practice"
              items={summary.recommendedPractice}
            />
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">
          We couldn&apos;t generate a summary for this session. Your per-answer
          feedback is still available below.
        </p>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Ready for another round?</p>
            <p className="text-sm text-muted-foreground">
              Your next interview adapts to this performance — new questions
              targeting the areas above.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href={`/projects/${projectId}?tab=sessions`} />}
          >
            Plan next interview
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Transcript</h2>
        {transcript.map((q, index) => {
          const answer = answerByQuestion.get(q.id)!;
          const feedback = answer.feedback as AnswerEvaluation | null;
          const audioPath = answer.audio_storage_path as string | null;
          const audioUrl = audioPath ? audioUrlByPath.get(audioPath) : undefined;
          return (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Q{index + 1}
                  </span>
                  {q.category && <Badge variant="accent">{q.category}</Badge>}
                  {answer.score != null && (
                    <Badge variant="outline" className="tabular-nums">
                      {Math.round(answer.score as number)}/100
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base leading-snug font-medium">
                  {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {audioUrl && (
                  <audio controls preload="none" src={audioUrl} className="w-full" />
                )}
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {(answer.transcript as string | null) || "(no answer given)"}
                </p>
                {feedback && (
                  <div className="space-y-3 border-t pt-4">
                    {feedback.summary && (
                      <p className="text-sm">{feedback.summary}</p>
                    )}
                    <ReviewSubList title="What worked" items={feedback.strengths} />
                    <ReviewSubList
                      title="How to improve"
                      items={feedback.improvements}
                    />
                    <ReviewSubList
                      title="Missed points"
                      items={feedback.missedPoints}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewSubList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
