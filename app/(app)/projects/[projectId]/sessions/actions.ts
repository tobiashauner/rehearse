"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/openai/client";
import {
  buildProjectAnalysisMessages,
  projectAnalysisSchema,
  type ProjectAnalysis,
} from "@/lib/prompts/project-analysis";
import {
  QUESTION_COUNT_BY_LENGTH,
  buildQuestionGenerationMessages,
  questionGenerationResultSchema,
  type PastPerformance,
} from "@/lib/prompts/question-generation";
import {
  buildCoachingPlanMessages,
  coachingPlanSchema,
  type CoachingPlan,
  type PastSessionDigest,
} from "@/lib/prompts/coaching-plan";
import type { SessionSummary } from "@/lib/prompts/session-summary";
import { configureInterviewSchema } from "@/lib/validations/session";
import { createClient } from "@/lib/supabase/server";
import {
  extractTextFromBuffer,
  mimeTypeFromName,
} from "@/lib/resources/extract-text";
import type { Database } from "@/types/database";

async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

type ResourceRow = {
  id: string;
  type: string;
  name: string | null;
  content: string | null;
  url: string | null;
  storage_path: string | null;
};

/**
 * Extract and persist `content` for any file resource that has a stored file
 * but no extracted text yet — e.g. files uploaded before extraction existed,
 * or uploads where extraction previously failed. Makes "regenerate briefing"
 * self-healing rather than permanently stuck on stale null content. Mutates
 * the passed rows in place so the caller sees the freshly-extracted text.
 */
async function backfillResourceContent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  resources: ResourceRow[],
): Promise<void> {
  const pending = resources.filter(
    (r) => !r.content && r.storage_path,
  );
  if (pending.length === 0) return;

  await Promise.all(
    pending.map(async (r) => {
      const { data: file, error } = await supabase.storage
        .from("resources")
        .download(r.storage_path!);
      if (error || !file) return;

      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType =
        file.type || mimeTypeFromName(r.name ?? r.storage_path!);
      const text = await extractTextFromBuffer(buffer, mimeType);
      if (!text) return;

      const { error: updateError } = await supabase
        .from("resources")
        .update({ content: text })
        .eq("id", r.id);
      if (!updateError) {
        r.content = text;
      }
    }),
  );
}

export async function generateProjectAnalysis(projectId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: project } = await supabase
    .from("projects")
    .select("title, company, role")
    .eq("id", projectId)
    .single();
  if (!project) {
    return { error: "Project not found." };
  }

  const { data: resources } = await supabase
    .from("resources")
    .select("id, type, name, content, url, storage_path")
    .eq("project_id", projectId);

  if (!resources || resources.length === 0) {
    return { error: "Add a resume or job description first." };
  }

  // Extract text from any uploaded files that don't have it yet (e.g. files
  // uploaded before extraction existed) so their content feeds the briefing.
  await backfillResourceContent(supabase, resources);

  const messages = buildProjectAnalysisMessages({ project, resources });

  let parsed: ProjectAnalysis | null | undefined;
  try {
    const completion = await getOpenAIClient().chat.completions.parse({
      model: OPENAI_MODEL,
      messages,
      response_format: zodResponseFormat(projectAnalysisSchema, "project_analysis"),
    });
    const message = completion.choices[0]?.message;
    if (message?.refusal) {
      return { error: message.refusal };
    }
    parsed = message?.parsed;
  } catch (err) {
    console.error("generateProjectAnalysis failed", err);
    return { error: "Failed to generate the briefing. Please try again." };
  }

  if (!parsed) {
    return { error: "Failed to generate the briefing. Please try again." };
  }

  const { error } = await supabase.from("ai_briefings").insert({
    project_id: projectId,
    content: parsed,
  });
  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

/**
 * Completed sessions with summaries, oldest first — the shared input for both
 * the coaching plan and adaptive question generation.
 */
async function loadCompletedSessionDigests(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
): Promise<PastSessionDigest[]> {
  const { data } = await supabase
    .from("interview_sessions")
    .select("id, interview_type, difficulty, overall_score, summary, completed_at")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .not("summary", "is", null)
    .order("completed_at", { ascending: true });

  return (data ?? []).map((s) => ({
    completedAt: s.completed_at,
    interviewType: s.interview_type,
    difficulty: s.difficulty,
    overallScore: s.overall_score != null ? Number(s.overall_score) : null,
    summary: s.summary as SessionSummary,
  }));
}

// Caps keep the question-generation prompt bounded as history grows.
const PAST_LIST_CAP = 12;
const PREVIOUS_QUESTIONS_CAP = 40;

function dedupeCap(items: string[], cap: number): string[] {
  return [...new Set(items)].slice(-cap);
}

/**
 * Digest of previous completed sessions for adaptive question generation.
 * Returns null when there's no completed history yet, so a first interview
 * generates exactly as before.
 */
async function loadPastPerformance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
): Promise<PastPerformance | null> {
  const digests = await loadCompletedSessionDigests(supabase, projectId);
  if (digests.length === 0) return null;

  // Every question asked in any of this project's sessions, oldest first.
  const { data: sessionRows } = await supabase
    .from("interview_sessions")
    .select("id")
    .eq("project_id", projectId);
  const sessionIds = (sessionRows ?? []).map((s) => s.id);
  const { data: askedQuestions } = sessionIds.length
    ? await supabase
        .from("questions")
        .select("question, created_at")
        .in("session_id", sessionIds)
        .not("asked_at", "is", null)
        .order("created_at", { ascending: true })
    : { data: [] };

  const { data: plan } = await supabase
    .from("coaching_plans")
    .select("recommendations")
    .eq("project_id", projectId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const coachingFocus = plan
    ? (plan.recommendations as CoachingPlan).suggestedNextInterview?.focus ?? null
    : null;

  return {
    scores: digests
      .map((d) => d.overallScore)
      .filter((s): s is number => s != null),
    weaknesses: dedupeCap(
      digests.flatMap((d) => d.summary.weaknesses),
      PAST_LIST_CAP,
    ),
    strengths: dedupeCap(
      digests.flatMap((d) => d.summary.strengths),
      PAST_LIST_CAP,
    ),
    questionsMissed: dedupeCap(
      digests.flatMap((d) => d.summary.questionsMissed),
      PAST_LIST_CAP,
    ),
    previousQuestions: dedupeCap(
      (askedQuestions ?? []).map((q) => q.question),
      PREVIOUS_QUESTIONS_CAP,
    ),
    coachingFocus,
  };
}

export async function generateCoachingPlan(projectId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: project } = await supabase
    .from("projects")
    .select("title, company, role")
    .eq("id", projectId)
    .single();
  if (!project) {
    return { error: "Project not found." };
  }

  const sessions = await loadCompletedSessionDigests(supabase, projectId);
  if (sessions.length === 0) {
    return { error: "Complete an interview first — the plan is built from your results." };
  }

  let parsed: CoachingPlan | null | undefined;
  try {
    const completion = await getOpenAIClient().chat.completions.parse({
      model: OPENAI_MODEL,
      messages: buildCoachingPlanMessages({ project, sessions }),
      response_format: zodResponseFormat(coachingPlanSchema, "coaching_plan"),
    });
    const message = completion.choices[0]?.message;
    if (message?.refusal) {
      return { error: message.refusal };
    }
    parsed = message?.parsed;
  } catch (err) {
    console.error("generateCoachingPlan failed", err);
    return { error: "Failed to generate the coaching plan. Please try again." };
  }

  if (!parsed) {
    return { error: "Failed to generate the coaching plan. Please try again." };
  }

  const { error } = await supabase.from("coaching_plans").insert({
    project_id: projectId,
    recommendations: parsed,
  });
  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function createInterviewSession(
  projectId: string,
  values: {
    interviewType: string;
    difficulty: string;
    interviewerPersonality: string;
    conversationMode: string;
    lengthMinutes: number;
  },
) {
  const parsed = configureInterviewSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid configuration." };
  }

  const supabase = await createClient();
  await requireUser(supabase);

  const { data: project } = await supabase
    .from("projects")
    .select("title, company, role")
    .eq("id", projectId)
    .single();
  if (!project) {
    return { error: "Project not found." };
  }

  const { data: briefing } = await supabase
    .from("ai_briefings")
    .select("content")
    .eq("project_id", projectId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!briefing) {
    return { error: "Generate an AI Briefing first." };
  }

  const config = {
    interviewType: parsed.data
      .interviewType as Database["public"]["Enums"]["interview_type"],
    difficulty: parsed.data
      .difficulty as Database["public"]["Enums"]["interview_difficulty"],
    interviewerPersonality: parsed.data
      .interviewerPersonality as Database["public"]["Enums"]["interviewer_personality"],
    conversationMode: parsed.data
      .conversationMode as Database["public"]["Enums"]["conversation_mode"],
    lengthMinutes: parsed.data.lengthMinutes,
  };

  const questionCount =
    QUESTION_COUNT_BY_LENGTH[parsed.data.lengthMinutes as 15 | 30 | 45 | 60];

  // Adapt to previous completed sessions (weak areas, no repeats) — null on
  // the first interview, which generates exactly as before.
  const pastPerformance = await loadPastPerformance(supabase, projectId);

  const messages = buildQuestionGenerationMessages({
    project,
    analysis: briefing.content as ProjectAnalysis,
    config,
    questionCount,
    pastPerformance,
  });

  let generated;
  try {
    const completion = await getOpenAIClient().chat.completions.parse({
      model: OPENAI_MODEL,
      messages,
      response_format: zodResponseFormat(
        questionGenerationResultSchema,
        "question_generation",
      ),
    });
    const message = completion.choices[0]?.message;
    if (message?.refusal) {
      return { error: message.refusal };
    }
    generated = message?.parsed;
  } catch (err) {
    console.error("createInterviewSession question generation failed", err);
    return { error: "Failed to generate interview questions. Please try again." };
  }

  if (!generated) {
    return { error: "Failed to generate interview questions. Please try again." };
  }

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .insert({
      project_id: projectId,
      interview_type: config.interviewType,
      difficulty: config.difficulty,
      interviewer_personality: config.interviewerPersonality,
      conversation_mode: config.conversationMode,
      length_minutes: config.lengthMinutes,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return { error: sessionError?.message ?? "Failed to create the session." };
  }

  const { error: questionsError } = await supabase.from("questions").insert(
    generated.questions.map((q, index) => ({
      session_id: session.id,
      question: q.question,
      category: q.category,
      difficulty: q.difficulty,
      order_index: index,
    })),
  );

  if (questionsError) {
    await supabase.from("interview_sessions").delete().eq("id", session.id);
    return { error: questionsError.message };
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/sessions/${session.id}`);
}
