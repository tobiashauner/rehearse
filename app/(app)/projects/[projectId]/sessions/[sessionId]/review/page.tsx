import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw, SquareCheckBig } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfigureInterviewDialog } from "@/components/interview/configure-interview-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ensureSessionSummary } from "@/app/(app)/projects/[projectId]/sessions/[sessionId]/actions";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { ScoreGauge } from "@/components/score-gauge";
import { ScoreExplainer } from "@/components/score-explainer";
import { ScorePill } from "@/components/score-badge";
import { DeliveryPanel } from "@/components/delivery-panel";
import { scoreTier } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { SessionSummary } from "@/lib/prompts/session-summary";
import type { DeliveryReport } from "@/lib/delivery";
import type { AnswerEvaluation } from "@/lib/prompts/answer-evaluation";

/** Summary as stored: the LLM debrief plus the folded-in delivery read. */
type StoredSummary = SessionSummary & {
  contentScore?: number;
  delivery?: DeliveryReport | null;
};

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
      "id, status, overall_score, summary, duration_seconds, completed_at, interview_type, difficulty, interviewer_personality, conversation_mode, length_minutes, interviewer_voice, playback_rate",
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

  const summary = session.summary as StoredSummary | null;
  const delivery = summary?.delivery ?? null;

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

  // For "Practice again": prefill the configure dialog with this interview's
  // setup. Gate on a briefing still existing; show how many past sessions the
  // new one will adapt to.
  const [{ data: briefing }, { count: completedCount }] = await Promise.all([
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
  const redoConfig = {
    interviewType: session.interview_type,
    difficulty: session.difficulty,
    interviewerPersonality: session.interviewer_personality,
    conversationMode: session.conversation_mode,
    lengthMinutes: String(session.length_minutes),
    interviewerVoice: session.interviewer_voice,
    playbackRate: String(session.playback_rate),
  };

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
          render={<Link href={`/projects/${projectId}`} />}
        >
          Back to overview
        </Button>
      </div>

      <AiDisclaimer />

      {summary ? (
        <>
          <Card>
            <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <ScoreGauge score={summary.overallScore} />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Overall score
                  </p>
                  <span
                    className={cn(
                      "rounded-4xl px-2 py-0.5 text-xs font-semibold",
                      scoreTier(summary.overallScore).soft,
                      scoreTier(summary.overallScore).text,
                    )}
                  >
                    {scoreTier(summary.overallScore).label}
                  </span>
                </div>
                <p className="text-lg leading-snug">{summary.headline}</p>
                {delivery && summary.contentScore != null && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          scoreTier(summary.contentScore).dot,
                        )}
                      />
                      Content{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {summary.contentScore}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          scoreTier(delivery.score).dot,
                        )}
                      />
                      Delivery{" "}
                      <span className="font-medium text-foreground tabular-nums">
                        {delivery.score}
                      </span>
                    </span>
                  </div>
                )}
                <ScoreExplainer />
              </div>
            </CardContent>
          </Card>

          {delivery && <DeliveryPanel report={delivery} />}

          <div className="grid gap-3 rounded-2xl bg-accent p-3 sm:gap-4 sm:p-4 md:grid-cols-2">
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
              Run it back with the same setup — fresh questions that target the
              areas above, so you can see if you&apos;ve improved.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/projects/${projectId}`} />}
            >
              Back to overview
            </Button>
            <ConfigureInterviewDialog
              projectId={projectId}
              hasBriefing={!!briefing}
              completedSessionCount={completedCount ?? 0}
              initialConfig={redoConfig}
              triggerLabel={
                <>
                  <RotateCcw data-icon="inline-start" />
                  Practice again
                </>
              }
              title="Practice again"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Transcript</h2>
        <div className="grid items-start gap-3 rounded-2xl bg-accent p-3 sm:gap-4 sm:p-4 lg:grid-cols-2">
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
                    <ScorePill score={Number(answer.score)} />
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
          <ul className="space-y-2.5 text-sm text-foreground/80">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <SquareCheckBig className="mt-0.5 size-4.5 shrink-0 text-badge-accent" />
                <span>{item}</span>
              </li>
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
