import { z } from "zod";
import type OpenAI from "openai";
import type { Database } from "@/types/database";
import type { ProjectAnalysis } from "@/lib/prompts/project-analysis";

export const questionGenerationResultSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        category: z.string(),
        difficulty: z.enum(["easy", "medium", "hard"]),
      }),
    )
    .min(1),
});

export type QuestionGenerationResult = z.infer<typeof questionGenerationResultSchema>;

export const QUESTION_COUNT_BY_LENGTH: Record<15 | 30 | 45 | 60, number> = {
  15: 4,
  30: 7,
  45: 10,
  60: 13,
};

type SessionConfig = {
  interviewType: Database["public"]["Enums"]["interview_type"];
  difficulty: Database["public"]["Enums"]["interview_difficulty"];
  interviewerPersonality: Database["public"]["Enums"]["interviewer_personality"];
  conversationMode: Database["public"]["Enums"]["conversation_mode"];
  lengthMinutes: number;
};

/** Digest of previous completed sessions that the new question set should adapt to. */
export type PastPerformance = {
  /** Session scores oldest-first, e.g. [62, 71]. */
  scores: number[];
  /** Recurring weaknesses pulled from session summaries. */
  weaknesses: string[];
  /** Demonstrated strengths that don't need re-testing. */
  strengths: string[];
  /** Questions the candidate handled weakly and should be re-tested on (rephrased). */
  questionsMissed: string[];
  /** Questions already asked in previous sessions — avoid repeating them. */
  previousQuestions: string[];
  /** Focus recommendation from the latest coaching plan, if one exists. */
  coachingFocus: string | null;
};

type QuestionGenerationInput = {
  project: { title: string; company: string | null; role: string | null };
  analysis: ProjectAnalysis;
  config: SessionConfig;
  questionCount: number;
  pastPerformance?: PastPerformance | null;
};

function pastPerformanceSection(past: PastPerformance): string {
  const lines: string[] = [
    "This candidate has already done " +
      `${past.scores.length} mock interview${past.scores.length === 1 ? "" : "s"} ` +
      `for this role (scores oldest-first: ${past.scores.map(Math.round).join(", ")}).`,
  ];
  if (past.weaknesses.length) {
    lines.push(`Observed weaknesses:\n- ${past.weaknesses.join("\n- ")}`);
  }
  if (past.strengths.length) {
    lines.push(`Demonstrated strengths:\n- ${past.strengths.join("\n- ")}`);
  }
  if (past.questionsMissed.length) {
    lines.push(
      `Questions handled weakly last time (re-test the underlying skill from a fresh angle):\n- ${past.questionsMissed.join("\n- ")}`,
    );
  }
  if (past.coachingFocus) {
    lines.push(`Coaching plan focus for this session: ${past.coachingFocus}`);
  }
  if (past.previousQuestions.length) {
    lines.push(
      `Questions already asked in previous sessions (do NOT repeat or lightly rephrase these):\n- ${past.previousQuestions.join("\n- ")}`,
    );
  }
  return lines.join("\n\n");
}

export function buildQuestionGenerationMessages({
  project,
  analysis,
  config,
  questionCount,
  pastPerformance,
}: QuestionGenerationInput): OpenAI.ChatCompletionMessageParam[] {
  return [
    {
      role: "system",
      content:
        "You are simulating a realistic job interviewer conducting a mock interview. " +
        "Generate a set of interview questions grounded in the candidate's actual " +
        "background and the target role — never generic filler questions. Vary " +
        "categories and avoid duplicate or near-duplicate questions." +
        (pastPerformance
          ? " The candidate has completed previous mock interviews for this role: " +
            "weight roughly half the questions toward their observed weak areas " +
            "(probing whether they've improved), don't re-test what they've already " +
            "shown they do well, and never repeat a previously asked question."
          : ""),
    },
    {
      role: "user",
      content:
        `Project: ${project.title}` +
        (project.role ? ` — ${project.role}` : "") +
        (project.company ? ` @ ${project.company}` : "") +
        `\n\nProject briefing:\n${JSON.stringify(analysis, null, 2)}\n\n` +
        "Interview configuration:\n" +
        `- Type: ${config.interviewType}\n` +
        `- Difficulty: ${config.difficulty}\n` +
        `- Interviewer personality: ${config.interviewerPersonality}\n` +
        `- Conversation mode: ${config.conversationMode}\n` +
        `- Length: ${config.lengthMinutes} minutes\n\n` +
        (pastPerformance
          ? `Previous performance:\n\n${pastPerformanceSection(pastPerformance)}\n\n`
          : "") +
        `Generate exactly ${questionCount} questions appropriate for this configuration. ` +
        "Each question needs a short category label (e.g. \"Leadership\", \"System Design\", " +
        "\"Behavioral - Conflict\") and a difficulty (easy, medium, or hard) consistent with " +
        "the requested difficulty, order them from warm-up to more challenging.",
    },
  ];
}
