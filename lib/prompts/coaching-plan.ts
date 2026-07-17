import { z } from "zod";
import type OpenAI from "openai";
import type { SessionSummary } from "@/lib/prompts/session-summary";
import {
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
} from "@/lib/validations/session";

export const coachingPlanSchema = z.object({
  headline: z
    .string()
    .describe("One-sentence coaching verdict across all sessions so far."),
  progress: z
    .string()
    .describe(
      "How performance is trending across sessions — improving, plateauing, or slipping, and where.",
    ),
  focusAreas: z
    .array(
      z.object({
        area: z.string().describe("Short name of the skill or habit to work on."),
        why: z
          .string()
          .describe("Evidence from the sessions that makes this a priority."),
        practice: z
          .string()
          .describe("A concrete drill or exercise to improve this area."),
      }),
    )
    .min(1)
    .describe("Prioritized areas to work on, most important first."),
  strengthsToKeep: z
    .array(z.string())
    .describe("What's already working and should be kept up."),
  suggestedNextInterview: z
    .object({
      interviewType: z.enum(
        INTERVIEW_TYPE_OPTIONS.map((o) => o.value) as [string, ...string[]],
      ),
      difficulty: z.enum(
        DIFFICULTY_OPTIONS.map((o) => o.value) as [string, ...string[]],
      ),
      focus: z
        .string()
        .describe(
          "What the next mock interview should concentrate on, given the weaknesses above.",
        ),
    })
    .describe("Recommended configuration for the next practice interview."),
});

export type CoachingPlan = z.infer<typeof coachingPlanSchema>;

export type PastSessionDigest = {
  completedAt: string | null;
  interviewType: string;
  difficulty: string;
  overallScore: number | null;
  summary: SessionSummary;
};

type CoachingPlanInput = {
  project: { title: string; company: string | null; role: string | null };
  /** Completed sessions with summaries, oldest first so the trend reads forward. */
  sessions: PastSessionDigest[];
};

export function buildCoachingPlanMessages({
  project,
  sessions,
}: CoachingPlanInput): OpenAI.ChatCompletionMessageParam[] {
  const sessionsText = sessions
    .map((s, i) => {
      const date = s.completedAt
        ? new Date(s.completedAt).toISOString().slice(0, 10)
        : "unknown date";
      return (
        `Session ${i + 1} (${date}, ${s.interviewType}, ${s.difficulty}` +
        (s.overallScore != null ? `, scored ${Math.round(s.overallScore)}/100` : "") +
        `):\n` +
        `- Verdict: ${s.summary.headline}\n` +
        `- Strengths: ${s.summary.strengths.join("; ") || "—"}\n` +
        `- Weaknesses: ${s.summary.weaknesses.join("; ") || "—"}\n` +
        `- Questions handled weakly: ${s.summary.questionsMissed.join("; ") || "—"}`
      );
    })
    .join("\n\n");

  return [
    {
      role: "system",
      content:
        "You are an expert interview coach writing a personal coaching plan from a " +
        "candidate's mock-interview history. Every recommendation must be grounded in " +
        "the actual session debriefs — cite the recurring patterns, not generic advice. " +
        "Prioritize ruthlessly: a few focus areas that would move the needle most, each " +
        "with a concrete practice drill. Finish by recommending how to configure the " +
        "next mock interview so it targets the weaknesses.",
    },
    {
      role: "user",
      content:
        `Target role: ${project.title}` +
        (project.role ? ` — ${project.role}` : "") +
        (project.company ? ` @ ${project.company}` : "") +
        `\n\nMock interview history, oldest first:\n\n${sessionsText}\n\n` +
        "Write the coaching plan: a one-sentence headline, the performance trend, " +
        "prioritized focus areas (with evidence and a practice drill each), strengths " +
        "to keep, and the suggested configuration and focus for the next interview.",
    },
  ];
}
