import { z } from "zod";
import type OpenAI from "openai";
import {
  isInterruptive,
  personalityPrompt,
} from "@/lib/interview-personality";

export const followUpGenerationSchema = z.object({
  shouldFollowUp: z
    .boolean()
    .describe("Whether a natural follow-up question is warranted right now."),
  question: z
    .string()
    .nullable()
    .describe("The follow-up question text. Null when shouldFollowUp is false."),
  category: z
    .string()
    .nullable()
    .describe("Short category label for the follow-up. Null when no follow-up."),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .nullable()
    .describe("Difficulty of the follow-up. Null when no follow-up."),
  reason: z
    .string()
    .nullable()
    .describe("Brief rationale for the decision (for logging/debugging)."),
});

export type FollowUpGeneration = z.infer<typeof followUpGenerationSchema>;

type FollowUpGenerationInput = {
  project: { title: string; company: string | null; role: string | null };
  config: {
    interviewType: string;
    difficulty: string;
    interviewerPersonality: string;
  };
  question: { question: string; category: string | null };
  answer: string;
  /** Topics/questions still coming up, so follow-ups don't pre-empt them. */
  upcomingTopics: string[];
};

export function buildFollowUpGenerationMessages({
  project,
  config,
  question,
  answer,
  upcomingTopics,
}: FollowUpGenerationInput): OpenAI.ChatCompletionMessageParam[] {
  const interruptive = isInterruptive(config.interviewerPersonality);

  const system = interruptive
    ? "You are a realistic interviewer who INTERRUPTS OFTEN, deciding whether to cut in " +
      "with ONE follow-up to the candidate's last answer. Lean toward following up: cut in " +
      "whenever the answer rambles, hedges, stays vague, or leaves a claim unsupported — err " +
      "on the side of asking. Phrase the follow-up as an interruption that cuts them off, " +
      'opening with something like "Let me stop you there —", "Hold on —", or "Quick —", ' +
      "then a short, pointed question. Do NOT ask something already planned as an upcoming " +
      "topic. Only set shouldFollowUp to false if the answer was genuinely tight and complete."
    : "You are a realistic interviewer deciding whether to ask ONE natural follow-up " +
      "to the candidate's last answer, the way a real interviewer would when something " +
      "is vague, incomplete, or genuinely interesting. Only follow up when it adds real " +
      "value — probing a claim, asking for specifics/metrics, or digging into a tradeoff. " +
      "Do NOT follow up just to fill space, and do NOT ask something already planned as " +
      "an upcoming topic. Match the interviewer's personality. When in doubt, don't.";

  return [
    {
      role: "system",
      content: system,
    },
    {
      role: "user",
      content:
        `Target role: ${project.title}` +
        (project.role ? ` — ${project.role}` : "") +
        (project.company ? ` @ ${project.company}` : "") +
        `\nInterview type: ${config.interviewType} · Difficulty: ${config.difficulty} · ` +
        `Interviewer style: ${personalityPrompt(config.interviewerPersonality)}\n\n` +
        `Question just asked (${question.category ?? "general"}):\n${question.question}\n\n` +
        `Candidate's answer:\n${answer.trim() || "(no answer given)"}\n\n` +
        (upcomingTopics.length
          ? `Upcoming topics still to be covered (do not duplicate these):\n- ${upcomingTopics.join("\n- ")}\n\n`
          : "") +
        "Decide whether to ask a single follow-up. If yes, provide the follow-up question, " +
        "a short category, and a difficulty. If no, set shouldFollowUp to false and leave " +
        "the other fields null.",
    },
  ];
}
