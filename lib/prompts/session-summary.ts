import { z } from "zod";
import type OpenAI from "openai";

export const sessionSummarySchema = z.object({
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall interview performance, 0-100."),
  headline: z
    .string()
    .describe("One-sentence overall verdict on the candidate's performance."),
  strengths: z
    .array(z.string())
    .describe("The candidate's strongest areas across the whole interview."),
  weaknesses: z
    .array(z.string())
    .describe("The clearest areas to improve across the whole interview."),
  questionsMissed: z
    .array(z.string())
    .describe("Questions the candidate handled weakly and should revisit."),
  recommendedPractice: z
    .array(z.string())
    .describe("Concrete next steps to prepare before the real interview."),
});

export type SessionSummary = z.infer<typeof sessionSummarySchema>;

type SessionSummaryInput = {
  project: { title: string; company: string | null; role: string | null };
  config: {
    interviewType: string;
    difficulty: string;
    interviewerPersonality: string;
  };
  transcript: {
    question: string;
    category: string | null;
    answer: string;
    score: number | null;
  }[];
};

export function buildSessionSummaryMessages({
  project,
  config,
  transcript,
}: SessionSummaryInput): OpenAI.ChatCompletionMessageParam[] {
  const transcriptText = transcript
    .map(
      (t, i) =>
        `Q${i + 1} (${t.category ?? "general"}${t.score != null ? `, scored ${t.score}` : ""}): ${t.question}\n` +
        `A${i + 1}: ${t.answer.trim() || "(no answer given)"}`,
    )
    .join("\n\n");

  return [
    {
      role: "system",
      content:
        "You are an expert interview coach writing an end-of-session debrief after a mock " +
        "interview. Base every point on the actual transcript — be specific and honest, " +
        "not generically encouraging. The overall score should reflect the whole " +
        "performance, roughly consistent with the per-answer scores provided.",
    },
    {
      role: "user",
      content:
        `Target role: ${project.title}` +
        (project.role ? ` — ${project.role}` : "") +
        (project.company ? ` @ ${project.company}` : "") +
        `\nInterview type: ${config.interviewType} · Difficulty: ${config.difficulty} · ` +
        `Interviewer style: ${config.interviewerPersonality}\n\n` +
        `Full transcript:\n\n${transcriptText}\n\n` +
        "Write the debrief: an overall score (0-100), a one-sentence headline verdict, " +
        "the candidate's strengths, weaknesses, which questions they should revisit, and " +
        "recommended practice before the real interview.",
    },
  ];
}
