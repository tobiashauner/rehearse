import { z } from "zod";
import type OpenAI from "openai";

export const answerEvaluationSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall quality of this answer, 0-100."),
  summary: z.string().describe("One-sentence assessment of the answer."),
  strengths: z
    .array(z.string())
    .describe("What the candidate did well in this answer."),
  improvements: z
    .array(z.string())
    .describe("Concrete, actionable ways this specific answer could be stronger."),
  missedPoints: z
    .array(z.string())
    .describe("Key points a strong answer to this question would have covered but this one did not."),
});

export type AnswerEvaluation = z.infer<typeof answerEvaluationSchema>;

type AnswerEvaluationInput = {
  project: { title: string; company: string | null; role: string | null };
  config: {
    interviewType: string;
    difficulty: string;
    interviewerPersonality: string;
  };
  question: { question: string; category: string | null; difficulty: string | null };
  answer: string;
  /** Compact grounding pulled from the AI briefing, if one exists. */
  roleContext?: { roleSummary?: string; requiredSkills?: string[] } | null;
};

export function buildAnswerEvaluationMessages({
  project,
  config,
  question,
  answer,
  roleContext,
}: AnswerEvaluationInput): OpenAI.ChatCompletionMessageParam[] {
  const grounding = roleContext
    ? `\n\nRole context (for grounding your evaluation):\n` +
      (roleContext.roleSummary ? `Role summary: ${roleContext.roleSummary}\n` : "") +
      (roleContext.requiredSkills?.length
        ? `Required skills: ${roleContext.requiredSkills.join(", ")}\n`
        : "")
    : "";

  return [
    {
      role: "system",
      content:
        "You are an expert interview coach evaluating a candidate's answer to a mock " +
        "interview question. Be specific, fair, and constructive — ground every point in " +
        "what the candidate actually said, never generic praise or criticism. Calibrate " +
        "the score to the requested difficulty: a strong answer to a hard question scores " +
        "higher than an equally-polished answer to an easy one. A blank, evasive, or " +
        "off-topic answer should score low.",
    },
    {
      role: "user",
      content:
        `Target role: ${project.title}` +
        (project.role ? ` — ${project.role}` : "") +
        (project.company ? ` @ ${project.company}` : "") +
        `\nInterview type: ${config.interviewType} · Difficulty: ${config.difficulty} · ` +
        `Interviewer style: ${config.interviewerPersonality}` +
        grounding +
        `\n\nQuestion (${question.category ?? "general"}, ${question.difficulty ?? "medium"}):\n` +
        `${question.question}\n\n` +
        `Candidate's answer:\n${answer.trim() || "(no answer given)"}\n\n` +
        "Evaluate this answer. Return a score (0-100), a one-sentence summary, the " +
        "answer's strengths, concrete improvements, and any key points a strong answer " +
        "would have covered but this one missed.",
    },
  ];
}
