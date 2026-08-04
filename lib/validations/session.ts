import { z } from "zod";

export const INTERVIEW_TYPE_OPTIONS = [
  {
    value: "behavioral",
    label: "Behavioral",
    description: "Past experiences — how you handled real situations (STAR).",
  },
  {
    value: "technical",
    label: "Technical",
    description: "Role-specific technical depth and problem-solving.",
  },
  {
    value: "product",
    label: "Product",
    description: "Product sense — user problems, tradeoffs, prioritization.",
  },
  {
    value: "leadership",
    label: "Leadership",
    description: "Leading people, influence, and hard decisions.",
  },
  {
    value: "panel",
    label: "Panel",
    description: "Multiple angles in one sitting, with varied focus.",
  },
  {
    value: "recruiter_screen",
    label: "Recruiter Screen",
    description: "First-round fit, motivation, and logistics check.",
  },
  {
    value: "hiring_manager",
    label: "Hiring Manager",
    description: "Depth on the role and how you'd operate on the team.",
  },
  {
    value: "executive",
    label: "Executive",
    description: "Strategy, vision, and high-stakes judgment.",
  },
] as const;

export const DIFFICULTY_OPTIONS = [
  {
    value: "easy",
    label: "Easy",
    description: "Warm-up level — approachable and forgiving.",
  },
  {
    value: "medium",
    label: "Medium",
    description: "A realistic bar for most interviews.",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Senior, demanding bar — probing and unforgiving.",
  },
] as const;

export const PERSONALITY_OPTIONS = [
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm and encouraging — puts you at ease.",
  },
  {
    value: "direct",
    label: "Direct",
    description: "Businesslike and brisk; wants tight answers.",
  },
  {
    value: "analytical",
    label: "Analytical",
    description: "Digs into your reasoning and tradeoffs.",
  },
  {
    value: "skeptical",
    label: "Skeptical",
    description: "Doubts unbacked claims and makes you justify them.",
  },
  {
    value: "fast_paced",
    label: "Fast-paced",
    description: "Moves quickly and expects you to keep up.",
  },
  {
    value: "interrupts_often",
    label: "Interrupts often",
    description:
      "Cuts in when you ramble or get vague, and redirects with pointed follow-ups.",
  },
  {
    value: "pushes_for_metrics",
    label: "Pushes for metrics",
    description: "Keeps asking for numbers and measurable outcomes.",
  },
  {
    value: "challenges_assumptions",
    label: "Challenges assumptions",
    description: "Pushes back on your framing with counterexamples.",
  },
] as const;

export const CONVERSATION_MODE_OPTIONS = [
  {
    value: "adaptive",
    label: "Adaptive",
    description: "Questions and follow-ups adapt to your answers.",
  },
  {
    value: "fixed",
    label: "Fixed questions",
    description: "A set list of questions, asked as planned.",
  },
] as const;

export const LENGTH_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
] as const;

// OpenAI TTS voices, described by feel rather than name so the choice reads
// as an interviewer trait. Keep `value` aligned with OpenAI's voice ids.
export const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy — neutral, even" },
  { value: "echo", label: "Echo — warm, measured" },
  { value: "onyx", label: "Onyx — deep, authoritative" },
  { value: "nova", label: "Nova — bright, energetic" },
  { value: "shimmer", label: "Shimmer — soft, calm" },
  { value: "fable", label: "Fable — expressive, animated" },
] as const;

export const PLAYBACK_OPTIONS = [
  { value: "0.75", label: "0.75× — slower" },
  { value: "1", label: "1× — normal" },
  { value: "1.25", label: "1.25× — faster" },
  { value: "1.5", label: "1.5× — fastest" },
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
  interviewerVoice: z.enum(
    VOICE_OPTIONS.map((o) => o.value) as [string, ...string[]],
  ),
  playbackRate: z.coerce.number().refine(
    (n) => PLAYBACK_OPTIONS.some((o) => Number(o.value) === n),
    "Invalid playback speed",
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
