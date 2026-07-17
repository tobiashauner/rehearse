"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Keyboard,
  Mic,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { AudioVisualizer } from "@/components/interview/audio-visualizer";
import { useRecorder } from "@/hooks/use-recorder";
import type { AnswerEvaluation } from "@/lib/prompts/answer-evaluation";
import {
  startInterview,
  getQuestionAudio,
  submitTextAnswer,
  submitAudioAnswer,
  completeInterview,
} from "@/app/(app)/projects/[projectId]/sessions/[sessionId]/actions";

type Question = {
  id: string;
  question: string;
  category: string | null;
  difficulty: string | null;
};

type Phase = "idle" | "answering" | "evaluating" | "feedback" | "finishing";
type AnswerMode = "voice" | "text";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function recordingExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export function InterviewRunner({
  projectId,
  sessionId,
  status,
  baseQuestionCount,
  lengthMinutes,
  reviewHref,
}: {
  projectId: string;
  sessionId: string;
  status: "configured" | "in_progress" | "completed";
  baseQuestionCount: number;
  lengthMinutes: number;
  reviewHref: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<AnswerMode>("voice");
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [pendingNext, setPendingNext] = useState<Question | null>(null);
  const [followUpNext, setFollowUpNext] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRunning = phase !== "idle";

  const recorder = useRecorder();

  // Question TTS playback. `audioQuestionId` is the question whose audio is
  // currently loaded into the element — deriving `hasQuestionAudio` from it
  // resets the replay button on question change without extra state writes.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [audioQuestionId, setAudioQuestionId] = useState<string | null>(null);

  // Elapsed timer, running once the interview is underway.
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // Fetch (generating on first request) and auto-play the question's TTS
  // audio whenever a new question is presented. Failure is non-fatal — the
  // question text is always on screen.
  const questionId = question?.id ?? null;
  const hasQuestionAudio = questionId !== null && audioQuestionId === questionId;
  useEffect(() => {
    if (!questionId) return;
    const audio = audioRef.current;
    let cancelled = false;
    void (async () => {
      const result = await getQuestionAudio(projectId, sessionId, questionId);
      if (cancelled || !result.url || !audio) return;
      audio.src = result.url;
      setAudioQuestionId(questionId);
      // Autoplay can be blocked before the first gesture; the replay button
      // still works, so swallow the rejection.
      void audio.play().catch(() => {});
    })();
    return () => {
      cancelled = true;
      audio?.pause();
    };
  }, [projectId, sessionId, questionId]);

  const stopQuestionAudio = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const begin = useCallback(async () => {
    setPhase("evaluating");
    const result = await startInterview(projectId, sessionId);
    if (result.error) {
      toast.error(result.error);
      setPhase("idle");
      return;
    }
    if (!result.next) {
      // Everything is already answered — wrap up.
      await finish();
      return;
    }
    setQuestion(result.next);
    setPhase("answering");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, sessionId]);

  function applyAnswerResult(result: {
    error?: string;
    evaluation?: AnswerEvaluation | null;
    followUpCreated?: boolean;
    next?: Question | null;
  }) {
    setAnsweredCount((c) => c + 1);
    setEvaluation(result.evaluation ?? null);
    setPendingNext(result.next ?? null);
    setFollowUpNext(Boolean(result.followUpCreated));
    setPhase("feedback");
  }

  async function handleSubmitText() {
    if (!question || answer.trim().length === 0) return;
    stopQuestionAudio();
    setPhase("evaluating");
    const result = await submitTextAnswer(
      projectId,
      sessionId,
      question.id,
      answer,
    );
    if (result.error) {
      toast.error(result.error);
      setPhase("answering");
      return;
    }
    applyAnswerResult(result);
  }

  async function handleStartRecording() {
    stopQuestionAudio();
    await recorder.start();
  }

  async function handleFinishRecording() {
    if (!question) return;
    const recording = await recorder.stop();
    if (!recording) {
      toast.error("Nothing was recorded — try again.");
      return;
    }
    setPhase("evaluating");
    const formData = new FormData();
    formData.append(
      "file",
      new File(
        [recording.blob],
        `answer.${recordingExtension(recording.mimeType)}`,
        { type: recording.mimeType },
      ),
    );
    formData.append("durationSeconds", String(recording.durationSeconds));
    const result = await submitAudioAnswer(
      projectId,
      sessionId,
      question.id,
      formData,
    );
    if (result.error) {
      toast.error(result.error);
      setPhase("answering");
      return;
    }
    setAnswer(("transcript" in result ? result.transcript : null) ?? "");
    applyAnswerResult(result);
  }

  function handleContinue() {
    if (!pendingNext) {
      void finish();
      return;
    }
    setQuestion(pendingNext);
    setPendingNext(null);
    setEvaluation(null);
    setAnswer("");
    setPhase("answering");
  }

  async function finish() {
    recorder.cancel();
    stopQuestionAudio();
    setPhase("finishing");
    const result = await completeInterview(projectId, sessionId);
    if (result?.error) {
      toast.error(result.error);
      setPhase("feedback");
      return;
    }
    router.push(reviewHref);
    router.refresh();
  }

  // Idle: start / resume screen.
  if (phase === "idle") {
    const resuming = status === "in_progress";
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {resuming ? "Resume your interview" : "Ready when you are"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {baseQuestionCount} questions
            {" · "}~{lengthMinutes} min
            {" · "}The interviewer asks each question out loud. Answer by
            speaking — you&apos;ll get instant feedback and natural follow-ups.
            You can always type instead.
          </p>
          <Button onClick={begin}>
            <Mic />
            {resuming ? "Resume Interview" : "Start Interview"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const busy = phase === "evaluating" || phase === "finishing";
  const recording = recorder.status === "recording";

  return (
    <div className="space-y-4">
      {/* Hidden element that plays the interviewer's TTS question audio. */}
      <audio
        ref={audioRef}
        onPlay={() => setSpeaking(true)}
        onPause={() => setSpeaking(false)}
        onEnded={() => setSpeaking(false)}
        className="hidden"
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Question {Math.max(answeredCount + 1, 1)}
          {baseQuestionCount ? ` of ~${baseQuestionCount}` : ""}
        </span>
        <span className="tabular-nums">
          {formatElapsed(elapsed)} / {lengthMinutes}:00
        </span>
      </div>

      {question && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              {question.category && (
                <Badge variant="accent">{question.category}</Badge>
              )}
              {question.difficulty && (
                <Badge variant="outline" className="capitalize">
                  {question.difficulty}
                </Badge>
              )}
            </div>
            <div className="flex items-start gap-3">
              <CardTitle className="flex-1 text-xl leading-snug font-medium">
                {question.question}
              </CardTitle>
              {hasQuestionAudio && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void audioRef.current?.play()}
                  disabled={speaking}
                  aria-label="Replay question audio"
                  className={speaking ? "text-primary" : "text-muted-foreground"}
                >
                  <Volume2 className={speaking ? "animate-pulse" : undefined} />
                </Button>
              )}
            </div>
            {speaking && (
              <p className="text-sm text-muted-foreground">
                The interviewer is speaking…
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {phase === "feedback" && evaluation ? (
              <AnswerFeedback
                evaluation={evaluation}
                answer={answer}
                spoken={mode === "voice"}
                followUpNext={followUpNext}
                hasNext={pendingNext !== null}
                onContinue={handleContinue}
              />
            ) : mode === "voice" ? (
              <div className="space-y-4">
                {recording && recorder.analyser ? (
                  <div className="flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <span className="relative flex size-3 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
                      <span className="relative inline-flex size-3 rounded-full bg-destructive" />
                    </span>
                    <AudioVisualizer
                      analyser={recorder.analyser}
                      className="h-10 min-w-0 flex-1 text-primary"
                    />
                    <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                      {formatElapsed(recorder.elapsed)}
                    </span>
                  </div>
                ) : (
                  busy && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Spinner />
                      {phase === "evaluating"
                        ? "Transcribing and evaluating your answer…"
                        : "Wrapping up…"}
                    </div>
                  )
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {recording ? (
                    <Button onClick={handleFinishRecording}>
                      <Square />
                      Finish answer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStartRecording}
                      disabled={busy || recorder.status === "requesting"}
                    >
                      <Mic />
                      {recorder.status === "requesting"
                        ? "Allowing microphone…"
                        : "Start answer"}
                    </Button>
                  )}
                  {!recording && !busy && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMode("text")}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
                      >
                        <Keyboard className="size-4" />
                        Type instead
                      </button>
                      <button
                        type="button"
                        onClick={finish}
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                      >
                        End interview early
                      </button>
                    </>
                  )}
                </div>

                {recorder.error && (
                  <p className="text-sm text-destructive">{recorder.error}</p>
                )}
              </div>
            ) : (
              <>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer as if you were speaking it aloud…"
                  className="min-h-40"
                  disabled={busy}
                  autoFocus
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={handleSubmitText}
                    disabled={answer.trim().length === 0 || busy}
                  >
                    {phase === "evaluating" && <Spinner />}
                    {phase === "evaluating" ? "Evaluating…" : "Submit Answer"}
                  </Button>
                  {phase === "answering" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMode("voice")}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
                      >
                        <Mic className="size-4" />
                        Answer out loud
                      </button>
                      <button
                        type="button"
                        onClick={finish}
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                      >
                        End interview early
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {phase === "finishing" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Scoring your interview and preparing your review…
        </div>
      )}
    </div>
  );
}

function AnswerFeedback({
  evaluation,
  answer,
  spoken,
  followUpNext,
  hasNext,
  onContinue,
}: {
  evaluation: AnswerEvaluation;
  answer: string;
  spoken: boolean;
  followUpNext: boolean;
  hasNext: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5 rounded-lg border bg-muted/40 p-4">
        {spoken && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            What we heard
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
          {answer}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary tabular-nums">
          {Math.round(evaluation.score)}
        </div>
        <p className="text-sm">{evaluation.summary}</p>
      </div>

      <FeedbackList title="What worked" items={evaluation.strengths} />
      <FeedbackList title="How to improve" items={evaluation.improvements} />
      <FeedbackList
        title="A strong answer would also cover"
        items={evaluation.missedPoints}
      />

      {followUpNext && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <Sparkles className="size-4 text-primary" />
          The interviewer has a follow-up for you.
        </div>
      )}

      <Button onClick={onContinue}>
        {hasNext ? "Next question" : "Finish & see review"}
        <ArrowRight />
      </Button>
    </div>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
