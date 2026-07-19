"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toFile } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  getOpenAIClient,
  OPENAI_MODEL,
  OPENAI_STT_MODEL,
  OPENAI_TTS_MODEL,
  OPENAI_TTS_VOICE,
} from "@/lib/openai/client";
import {
  answerEvaluationSchema,
  buildAnswerEvaluationMessages,
  type AnswerEvaluation,
} from "@/lib/prompts/answer-evaluation";
import {
  followUpGenerationSchema,
  buildFollowUpGenerationMessages,
} from "@/lib/prompts/follow-up-generation";
import {
  sessionSummarySchema,
  buildSessionSummaryMessages,
} from "@/lib/prompts/session-summary";
import type { ProjectAnalysis } from "@/lib/prompts/project-analysis";
import {
  audioAnswerSchema,
  MAX_ANSWER_AUDIO_BYTES,
} from "@/lib/validations/session";
import { createClient } from "@/lib/supabase/server";
import {
  AI_LIMIT_MESSAGE,
  chatCostCents,
  checkAiBudget,
  recordAiUsage,
  sttCostCents,
  ttsCostCents,
} from "@/lib/ai/usage";

// Follow-up questions are inserted with order_index >= this base, so they're
// distinguishable from the pre-generated originals (0..N-1) without a schema
// change. We only ever follow up on originals, so follow-ups never chain.
const FOLLOWUP_ORDER_BASE = 1000;

const AUDIO_BUCKET = "interview-audio";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

// Speaking-style hints fed to the TTS model so the question audio matches the
// configured interviewer personality.
const PERSONALITY_TTS_STYLE: Record<string, string> = {
  friendly: "Warm and encouraging, conversational pace.",
  direct: "Businesslike and brisk, no filler.",
  analytical: "Measured and precise, calm and thoughtful.",
  skeptical: "Cool and probing, with a hint of doubt.",
  fast_paced: "Energetic, speaking at a quick clip.",
  interrupts_often: "Impatient, with clipped delivery.",
  pushes_for_metrics: "No-nonsense, zeroing in on specifics.",
  challenges_assumptions: "Confident, with a challenging edge.",
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function requireUser(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

type SessionRow = {
  id: string;
  project_id: string;
  status: string;
  interview_type: string;
  difficulty: string;
  interviewer_personality: string;
  conversation_mode: string;
  length_minutes: number;
  started_at: string | null;
};

type QuestionRow = {
  id: string;
  question: string;
  category: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  order_index: number;
  asked_at: string | null;
};

type NextQuestion = {
  id: string;
  question: string;
  category: string | null;
  difficulty: string | null;
};

async function loadSession(
  supabase: SupabaseServerClient,
  projectId: string,
  sessionId: string,
): Promise<SessionRow | null> {
  const { data } = await supabase
    .from("interview_sessions")
    .select(
      "id, project_id, status, interview_type, difficulty, interviewer_personality, conversation_mode, length_minutes, started_at",
    )
    .eq("id", sessionId)
    .eq("project_id", projectId)
    .single();
  return data as SessionRow | null;
}

async function loadQuestions(
  supabase: SupabaseServerClient,
  sessionId: string,
): Promise<QuestionRow[]> {
  const { data } = await supabase
    .from("questions")
    .select("id, question, category, difficulty, order_index, asked_at")
    .eq("session_id", sessionId)
    .order("order_index", { ascending: true });
  return (data as QuestionRow[] | null) ?? [];
}

/** question_ids that already have a current answer. */
async function answeredQuestionIds(
  supabase: SupabaseServerClient,
  questions: QuestionRow[],
): Promise<Set<string>> {
  if (questions.length === 0) return new Set();
  const { data } = await supabase
    .from("answers")
    .select("question_id")
    .in(
      "question_id",
      questions.map((q) => q.id),
    )
    .eq("is_current", true);
  return new Set((data ?? []).map((a) => a.question_id as string));
}

/**
 * Pick the next question to present and stamp its asked_at. Unanswered
 * follow-ups come before unanswered originals so a follow-up is always asked
 * right after its parent. Returns null when every question is answered.
 */
async function resolveNextQuestion(
  supabase: SupabaseServerClient,
  sessionId: string,
): Promise<NextQuestion | null> {
  const questions = await loadQuestions(supabase, sessionId);
  const answered = await answeredQuestionIds(supabase, questions);
  const unanswered = questions.filter((q) => !answered.has(q.id));
  if (unanswered.length === 0) return null;

  const followUps = unanswered.filter((q) => q.order_index >= FOLLOWUP_ORDER_BASE);
  const next = (followUps.length > 0 ? followUps : unanswered)[0];

  if (!next.asked_at) {
    await supabase
      .from("questions")
      .update({ asked_at: new Date().toISOString() })
      .eq("id", next.id);
  }

  return {
    id: next.id,
    question: next.question,
    category: next.category,
    difficulty: next.difficulty,
  };
}

async function loadRoleContext(
  supabase: SupabaseServerClient,
  projectId: string,
): Promise<{ roleSummary?: string; requiredSkills?: string[] } | null> {
  const { data } = await supabase
    .from("ai_briefings")
    .select("content")
    .eq("project_id", projectId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.content) return null;
  const analysis = data.content as ProjectAnalysis;
  return {
    roleSummary: analysis.roleSummary,
    requiredSkills: analysis.requiredSkills,
  };
}

export async function startInterview(projectId: string, sessionId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const session = await loadSession(supabase, projectId, sessionId);
  if (!session) return { error: "Session not found." };

  const questions = await loadQuestions(supabase, sessionId);
  if (questions.length === 0) {
    return { error: "This session has no questions." };
  }

  if (session.status === "configured") {
    await supabase
      .from("interview_sessions")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", sessionId);
  }

  const next = await resolveNextQuestion(supabase, sessionId);
  revalidatePath(`/projects/${projectId}/sessions/${sessionId}`);
  return { success: true, next };
}

/**
 * Signed playback URL for a question's TTS audio, generating and caching the
 * audio (questions.tts_audio_path) on first request. Failure is non-fatal for
 * the interview — the client falls back to the on-screen question text.
 */
export async function getQuestionAudio(
  projectId: string,
  sessionId: string,
  questionId: string,
) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const session = await loadSession(supabase, projectId, sessionId);
  if (!session) return { error: "Session not found." };

  const { data: question } = await supabase
    .from("questions")
    .select("id, question, tts_audio_path")
    .eq("id", questionId)
    .eq("session_id", sessionId)
    .single();
  if (!question) return { error: "Question not found." };

  const storage = supabase.storage.from(AUDIO_BUCKET);

  if (question.tts_audio_path) {
    const { data: signed } = await storage.createSignedUrl(
      question.tts_audio_path,
      SIGNED_URL_TTL_SECONDS,
    );
    // If signing fails (e.g. the object was deleted), fall through and regenerate.
    if (signed?.signedUrl) return { url: signed.signedUrl };
  }

  // Only generating fresh audio spends tokens — cached playback above is free.
  const budget = await checkAiBudget(supabase, user.id);
  if (!budget.allowed) {
    return { error: AI_LIMIT_MESSAGE };
  }

  try {
    const style = PERSONALITY_TTS_STYLE[session.interviewer_personality];
    const speech = await getOpenAIClient().audio.speech.create({
      model: OPENAI_TTS_MODEL,
      voice: OPENAI_TTS_VOICE,
      input: question.question,
      instructions: `You are a job interviewer asking the candidate a question out loud.${style ? ` ${style}` : ""}`,
    });
    await recordAiUsage(supabase, {
      userId: user.id,
      kind: "tts",
      model: OPENAI_TTS_MODEL,
      costCents: ttsCostCents(question.question.length),
    });
    const buffer = Buffer.from(await speech.arrayBuffer());

    const path = `${user.id}/${sessionId}/questions/${questionId}.mp3`;
    const { error: uploadError } = await storage.upload(path, buffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });
    if (uploadError) return { error: uploadError.message };

    await supabase
      .from("questions")
      .update({ tts_audio_path: path })
      .eq("id", questionId);

    const { data: signed } = await storage.createSignedUrl(
      path,
      SIGNED_URL_TTL_SECONDS,
    );
    if (!signed?.signedUrl) return { error: "Could not create a playback URL." };
    return { url: signed.signedUrl };
  } catch (err) {
    console.error("question TTS failed", err);
    return { error: "Could not generate question audio." };
  }
}

export async function submitTextAnswer(
  projectId: string,
  sessionId: string,
  questionId: string,
  text: string,
) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const session = await loadSession(supabase, projectId, sessionId);
  if (!session) return { error: "Session not found." };

  const questions = await loadQuestions(supabase, sessionId);
  const question = questions.find((q) => q.id === questionId);
  if (!question) return { error: "Question not found." };

  const budget = await checkAiBudget(supabase, user.id);
  if (!budget.allowed) return { error: AI_LIMIT_MESSAGE };

  return processAnswer(
    supabase,
    user.id,
    projectId,
    session,
    question,
    questions,
    text,
  );
}

/**
 * Voice answer: the browser has already uploaded the recording straight to
 * storage (Vercel's 4.5MB Server Action body limit rules out routing a few
 * minutes of audio through here), so we transcribe from the stored object and
 * then run the exact same evaluation/follow-up path as a typed answer — STT
 * just produces the transcript string that typing otherwise would.
 */
export async function submitAudioAnswer(
  projectId: string,
  sessionId: string,
  questionId: string,
  input: { storagePath: string; mimeType?: string; durationSeconds?: number | null },
) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const parsed = audioAnswerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid recording." };
  }
  const { storagePath, mimeType, durationSeconds } = parsed.data;

  // The client chose this path, so refuse anything outside the caller's own
  // session folder. Storage RLS enforces the same boundary, but rejecting here
  // yields a clear message instead of an opaque download failure.
  if (!storagePath.startsWith(`${user.id}/${sessionId}/`)) {
    return { error: "That recording doesn't belong to this session." };
  }

  const session = await loadSession(supabase, projectId, sessionId);
  if (!session) return { error: "Session not found." };

  const questions = await loadQuestions(supabase, sessionId);
  const question = questions.find((q) => q.id === questionId);
  if (!question) return { error: "Question not found." };

  // Checked before the STT + evaluation spend; the uploaded recording stays
  // in storage either way, so nothing the user said is lost.
  const budget = await checkAiBudget(supabase, user.id);
  if (!budget.allowed) return { error: AI_LIMIT_MESSAGE };

  // Pull the recording back down to transcribe it. This server→storage fetch
  // isn't an inbound request body, so the Server Action size limit never bites.
  const { data: blob, error: downloadError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .download(storagePath);
  if (downloadError || !blob) {
    return {
      error: "We couldn't read your recording. Please record it again.",
    };
  }
  if (blob.size === 0) {
    return {
      error:
        "We couldn't hear anything in that recording. Try again, or type your answer.",
    };
  }
  if (blob.size > MAX_ANSWER_AUDIO_BYTES) {
    return { error: "Recording is too large (25MB max)." };
  }

  const ext = mimeType.includes("mp4")
    ? "mp4"
    : mimeType.includes("ogg")
      ? "ogg"
      : "webm";
  const buffer = Buffer.from(await blob.arrayBuffer());

  let transcript = "";
  try {
    const result = await getOpenAIClient().audio.transcriptions.create({
      model: OPENAI_STT_MODEL,
      file: await toFile(buffer, `answer.${ext}`, { type: mimeType }),
    });
    await recordAiUsage(supabase, {
      userId: user.id,
      kind: "stt",
      model: OPENAI_STT_MODEL,
      costCents: sttCostCents(durationSeconds),
    });
    transcript = result.text?.trim() ?? "";
  } catch (err) {
    console.error("answer transcription failed", err);
    return {
      error:
        "We couldn't transcribe your recording. Record it again, or type your answer instead.",
    };
  }
  if (transcript.length === 0) {
    return {
      error:
        "We couldn't hear anything in that recording. Try again closer to your microphone, or type your answer.",
    };
  }

  const result = await processAnswer(
    supabase,
    user.id,
    projectId,
    session,
    question,
    questions,
    transcript,
    { storagePath, durationSeconds },
  );
  return { ...result, transcript };
}

/**
 * Shared answer pipeline: persist → evaluate → maybe follow-up → next
 * question. Both the typed and spoken paths end here; the only difference is
 * whether audio metadata accompanies the transcript.
 */
async function processAnswer(
  supabase: SupabaseServerClient,
  userId: string,
  projectId: string,
  session: SessionRow,
  question: QuestionRow,
  questions: QuestionRow[],
  text: string,
  audio?: { storagePath: string; durationSeconds: number | null },
) {
  const sessionId = session.id;
  const questionId = question.id;

  // Persist the answer first so a later AI failure never loses it.
  const { data: inserted, error: insertError } = await supabase
    .from("answers")
    .insert({
      question_id: questionId,
      transcript: text,
      audio_storage_path: audio?.storagePath ?? null,
      duration_seconds: audio?.durationSeconds ?? null,
      is_current: true,
      version: 1,
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    return { error: insertError?.message ?? "Failed to save answer." };
  }

  const config = {
    interviewType: session.interview_type,
    difficulty: session.difficulty,
    interviewerPersonality: session.interviewer_personality,
  };
  const { data: project } = await supabase
    .from("projects")
    .select("title, company, role")
    .eq("id", projectId)
    .single();
  const roleContext = await loadRoleContext(supabase, projectId);

  // Evaluate the answer.
  let evaluation: AnswerEvaluation | null = null;
  try {
    const completion = await getOpenAIClient().chat.completions.parse({
      model: OPENAI_MODEL,
      messages: buildAnswerEvaluationMessages({
        project: project ?? { title: "the role", company: null, role: null },
        config,
        question,
        answer: text,
        roleContext,
      }),
      response_format: zodResponseFormat(answerEvaluationSchema, "answer_evaluation"),
    });
    await recordAiUsage(supabase, {
      userId,
      kind: "evaluation",
      model: OPENAI_MODEL,
      inputTokens: completion.usage?.prompt_tokens,
      outputTokens: completion.usage?.completion_tokens,
      costCents: chatCostCents(OPENAI_MODEL, completion.usage),
    });
    evaluation = completion.choices[0]?.message?.parsed ?? null;
  } catch (err) {
    console.error("answer evaluation failed", err);
  }

  if (evaluation) {
    await supabase
      .from("answers")
      .update({ score: evaluation.score, feedback: evaluation })
      .eq("id", inserted.id);
  }

  // Adaptive mode: consider a single follow-up, but only off an original
  // question (order_index < base) so follow-ups never chain.
  let followUpCreated = false;
  if (
    session.conversation_mode === "adaptive" &&
    question.order_index < FOLLOWUP_ORDER_BASE
  ) {
    const answeredIds = await answeredQuestionIds(supabase, questions);
    const upcomingTopics = questions
      .filter((q) => q.order_index < FOLLOWUP_ORDER_BASE && !answeredIds.has(q.id))
      .map((q) => q.question);
    try {
      const completion = await getOpenAIClient().chat.completions.parse({
        model: OPENAI_MODEL,
        messages: buildFollowUpGenerationMessages({
          project: project ?? { title: "the role", company: null, role: null },
          config,
          question,
          answer: text,
          upcomingTopics,
        }),
        response_format: zodResponseFormat(
          followUpGenerationSchema,
          "follow_up_generation",
        ),
      });
      await recordAiUsage(supabase, {
        userId,
        kind: "followup",
        model: OPENAI_MODEL,
        inputTokens: completion.usage?.prompt_tokens,
        outputTokens: completion.usage?.completion_tokens,
        costCents: chatCostCents(OPENAI_MODEL, completion.usage),
      });
      const followUp = completion.choices[0]?.message?.parsed;
      if (followUp?.shouldFollowUp && followUp.question) {
        const existingFollowUps = questions.filter(
          (q) => q.order_index >= FOLLOWUP_ORDER_BASE,
        ).length;
        await supabase.from("questions").insert({
          session_id: sessionId,
          question: followUp.question,
          category: followUp.category ?? question.category,
          difficulty: followUp.difficulty ?? question.difficulty,
          order_index: FOLLOWUP_ORDER_BASE + existingFollowUps,
        });
        await supabase
          .from("answers")
          .update({ follow_up_generated: true })
          .eq("id", inserted.id);
        followUpCreated = true;
      }
    } catch (err) {
      console.error("follow-up generation failed", err);
    }
  }

  const next = await resolveNextQuestion(supabase, sessionId);
  revalidatePath(`/projects/${projectId}/sessions/${sessionId}`);

  return {
    success: true,
    evaluation,
    followUpCreated,
    next,
    done: next === null,
  };
}

export async function completeInterview(projectId: string, sessionId: string) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const session = await loadSession(supabase, projectId, sessionId);
  if (!session) return { error: "Session not found." };

  const durationSeconds = session.started_at
    ? Math.max(
        0,
        Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000),
      )
    : null;

  // Mark completed first — a summary failure shouldn't leave the session stuck
  // in_progress. The review page recomputes the summary if it's missing.
  await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", sessionId);

  await generateSessionSummary(supabase, user.id, projectId, sessionId);

  revalidatePath(`/projects/${projectId}/sessions/${sessionId}`);
  revalidatePath(`/projects/${projectId}/sessions/${sessionId}/review`);
  return { success: true };
}

/**
 * Lazily ensure a completed session has a summary — called from the review
 * page so a session whose summary generation failed (or was interrupted) still
 * gets one on next view, rather than showing a permanently empty review.
 */
export async function ensureSessionSummary(
  projectId: string,
  sessionId: string,
) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data } = await supabase
    .from("interview_sessions")
    .select("status, summary")
    .eq("id", sessionId)
    .eq("project_id", projectId)
    .single();
  if (!data || data.status !== "completed" || data.summary) return;

  const ok = await generateSessionSummary(supabase, user.id, projectId, sessionId);
  if (ok) {
    revalidatePath(`/projects/${projectId}/sessions/${sessionId}/review`);
  }
}

/**
 * Build and persist the end-of-session summary + overall score. Internal (a
 * server client isn't a serializable server-action arg); callers go through
 * completeInterview or ensureSessionSummary.
 *
 * Deliberately NOT budget-gated: a session the user was allowed to run should
 * always get its debrief, even if the final answer tipped them over the cap —
 * otherwise completed sessions would be stuck summary-less until next month
 * (and ensureSessionSummary would retry on every review view). The one call
 * is still metered.
 */
async function generateSessionSummary(
  supabase: SupabaseServerClient,
  userId: string,
  projectId: string,
  sessionId: string,
): Promise<boolean> {
  const session = await loadSession(supabase, projectId, sessionId);
  if (!session) return false;

  const questions = await loadQuestions(supabase, sessionId);
  if (questions.length === 0) return false;

  const { data: answers } = await supabase
    .from("answers")
    .select("question_id, transcript, score")
    .in(
      "question_id",
      questions.map((q) => q.id),
    )
    .eq("is_current", true);

  const answerByQuestion = new Map(
    (answers ?? []).map((a) => [a.question_id as string, a]),
  );

  // Chronological transcript: originals then their follow-ups, by asked_at.
  const ordered = [...questions].sort((a, b) => {
    const at = a.asked_at ? new Date(a.asked_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bt = b.asked_at ? new Date(b.asked_at).getTime() : Number.MAX_SAFE_INTEGER;
    return at - bt || a.order_index - b.order_index;
  });

  const transcript = ordered
    .filter((q) => answerByQuestion.has(q.id))
    .map((q) => {
      const a = answerByQuestion.get(q.id)!;
      return {
        question: q.question,
        category: q.category,
        answer: (a.transcript as string | null) ?? "",
        score: a.score as number | null,
      };
    });

  if (transcript.length === 0) return false;

  const { data: project } = await supabase
    .from("projects")
    .select("title, company, role")
    .eq("id", projectId)
    .single();

  try {
    const completion = await getOpenAIClient().chat.completions.parse({
      model: OPENAI_MODEL,
      messages: buildSessionSummaryMessages({
        project: project ?? { title: "the role", company: null, role: null },
        config: {
          interviewType: session.interview_type,
          difficulty: session.difficulty,
          interviewerPersonality: session.interviewer_personality,
        },
        transcript,
      }),
      response_format: zodResponseFormat(sessionSummarySchema, "session_summary"),
    });
    await recordAiUsage(supabase, {
      userId,
      kind: "summary",
      model: OPENAI_MODEL,
      inputTokens: completion.usage?.prompt_tokens,
      outputTokens: completion.usage?.completion_tokens,
      costCents: chatCostCents(OPENAI_MODEL, completion.usage),
    });
    const summary = completion.choices[0]?.message?.parsed;
    if (!summary) return false;

    await supabase
      .from("interview_sessions")
      .update({ summary, overall_score: summary.overallScore })
      .eq("id", sessionId);
    return true;
  } catch (err) {
    console.error("session summary failed", err);
    return false;
  }
}
