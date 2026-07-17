import { z } from "zod";

export const INTERVIEW_TYPE_OPTIONS = [
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "product", label: "Product" },
  { value: "leadership", label: "Leadership" },
  { value: "panel", label: "Panel" },
  { value: "recruiter_screen", label: "Recruiter Screen" },
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "executive", label: "Executive" },
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

export const PERSONALITY_OPTIONS = [
  { value: "friendly", label: "Friendly" },
  { value: "direct", label: "Direct" },
  { value: "analytical", label: "Analytical" },
  { value: "skeptical", label: "Skeptical" },
  { value: "fast_paced", label: "Fast-paced" },
  { value: "interrupts_often", label: "Interrupts often" },
  { value: "pushes_for_metrics", label: "Pushes for metrics" },
  { value: "challenges_assumptions", label: "Challenges assumptions" },
] as const;

export const CONVERSATION_MODE_OPTIONS = [
  { value: "adaptive", label: "Adaptive" },
  { value: "fixed", label: "Fixed questions" },
] as const;

export const LENGTH_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
] as const;

export const configureInterviewSchema = z.object({
  interviewType: z.enum(
    INTERVIEW_TYPE_OPTIONS.map((o) => o.value) as [string, ...string[]],
  ),
  difficulty: z.enum(
    DIFFICULTY_OPTIONS.map((o) => o.value) as [string, ...string[]],
  ),
  interviewerPersonality: z.enum(
    PERSONALITY_OPTIONS.map((o) => o.value) as [string, ...string[]],
  ),
  conversationMode: z.enum(
    CONVERSATION_MODE_OPTIONS.map((o) => o.value) as [string, ...string[]],
  ),
  lengthMinutes: z.coerce.number().refine(
    (n) => LENGTH_OPTIONS.some((o) => Number(o.value) === n),
    "Invalid interview length",
  ),
});

export type ConfigureInterviewValues = z.infer<typeof configureInterviewSchema>;

export const MAX_ANSWER_AUDIO_BYTES = 25 * 1024 * 1024;

// Spoken answers are uploaded straight to Supabase Storage from the browser —
// Vercel caps Server Action request bodies at 4.5MB, far below a few minutes of
// audio — so the action receives only a reference to the stored object. The
// mimeType echoes MediaRecorder's output, which varies by browser: audio/webm
// (Chrome/Firefox), audio/mp4 (Safari), occasionally an audio/ogg fallback.
export const audioAnswerSchema = z.object({
  storagePath: z.string().min(1).max(1024),
  mimeType: z
    .string()
    .max(255)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : "audio/webm")),
  durationSeconds: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(60 * 60)
    .nullish()
    .transform((v) => v ?? null),
});

export function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
