/*
 * How each interviewer personality actually shapes the interview. One source of
 * truth consumed by the reasoning prompts (question / follow-up / evaluation /
 * summary generation) and the TTS speaking style, so a personality is a real
 * behavioral lever rather than a bare enum token dropped into a prompt.
 *
 * The user-facing one-liners live alongside the options in
 * `lib/validations/session.ts` (PERSONALITY_OPTIONS[].description).
 */

export type PersonalityBehavior = {
  /** Natural-language guidance injected into the reasoning LLM prompts. */
  prompt: string;
  /** Speaking-style hint fed to the TTS model so the audio matches the persona. */
  tts: string;
  /**
   * Interviewers who cut in: they follow up eagerly and phrase the follow-up as
   * an interruption. The runner is turn-based (it can't literally barge in mid-
   * answer), so we simulate "interrupts often" by lowering the follow-up bar and
   * wording the follow-up as a cut-in.
   */
  interruptive?: boolean;
};

export const PERSONALITY_BEHAVIOR: Record<string, PersonalityBehavior> = {
  friendly: {
    prompt:
      "Warm and encouraging. Put the candidate at ease, acknowledge good points, and keep follow-ups gentle and supportive.",
    tts: "Warm and encouraging, conversational pace.",
  },
  direct: {
    prompt:
      "Businesslike and efficient. Skip small talk, keep things moving, and expect tight, to-the-point answers.",
    tts: "Businesslike and brisk, no filler.",
  },
  analytical: {
    prompt:
      "Measured and precise. Dig into the candidate's reasoning and tradeoffs, and ask how they reached their conclusions.",
    tts: "Measured and precise, calm and thoughtful.",
  },
  skeptical: {
    prompt:
      "Cool and probing. Doubt unsupported claims and press the candidate to justify what they assert with evidence.",
    tts: "Cool and probing, with a hint of doubt.",
  },
  fast_paced: {
    prompt:
      "Energetic and quick. Move briskly between topics and expect the candidate to keep up.",
    tts: "Energetic, speaking at a quick clip.",
  },
  interrupts_often: {
    prompt:
      "Impatient and interrupting. Cut in the moment an answer rambles, hedges, or gets vague, and redirect fast with a pointed follow-up. Favor short, sharp questions over patient ones.",
    tts: "Impatient, with clipped delivery.",
    interruptive: true,
  },
  pushes_for_metrics: {
    prompt:
      "No-nonsense about evidence. Keep asking for concrete numbers, scale, and measurable outcomes behind every claim.",
    tts: "No-nonsense, zeroing in on specifics.",
  },
  challenges_assumptions: {
    prompt:
      "Confident and contrarian. Push back on the candidate's framing and pose counterexamples to test their conviction.",
    tts: "Confident, with a challenging edge.",
  },
};

/** Natural-language behavior guidance for the reasoning prompts. */
export function personalityPrompt(value: string): string {
  return PERSONALITY_BEHAVIOR[value]?.prompt ?? value;
}

/** Speaking-style hint for the TTS model. */
export function personalityTts(value: string): string {
  return PERSONALITY_BEHAVIOR[value]?.tts ?? "";
}

/** Whether this interviewer cuts in — used to make follow-ups eager + interrupting. */
export function isInterruptive(value: string): boolean {
  return PERSONALITY_BEHAVIOR[value]?.interruptive ?? false;
}
