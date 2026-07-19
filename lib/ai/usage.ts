import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/*
 * AI spend metering + per-user budget cap.
 *
 * Every OpenAI call records an ai_usage_events row with its cost (computed
 * here, in USD cents), and every AI-triggering server action first checks
 * the caller's current-calendar-month spend against their limit. Today the
 * limit is one env-configured number for everyone; account tiers
 * (free/basic/max) later only need to change `monthlyLimitCents()`.
 *
 * Failure posture: the budget CHECK fails open (a transient DB error must
 * not brick the product; the exposure is bounded by one action's cost) and
 * usage RECORDING failures are logged loudly but never break the user's
 * action. The ledger is insert-only under RLS, so a user cannot delete or
 * shrink their own spend history.
 */

type Supabase = SupabaseClient<Database>;

export type AiUsageKind =
  | "briefing"
  | "questions"
  | "followup"
  | "evaluation"
  | "summary"
  | "coaching"
  | "tts"
  | "stt";

/* ————— Pricing (USD per 1M tokens; verified 2026-07-19) ————— */

const CHAT_PRICES: Record<string, { inputPerM: number; outputPerM: number }> = {
  "gpt-5.4-mini": { inputPerM: 0.75, outputPerM: 4.5 },
  "gpt-4o-mini": { inputPerM: 0.15, outputPerM: 0.6 },
};

// Unknown chat model (e.g. someone points OPENAI_MODEL at a new release
// without updating this table): deliberately price HIGH so we over-meter,
// never under-meter, until the table is updated.
const FALLBACK_CHAT_PRICE = { inputPerM: 5, outputPerM: 20 };

// When the API response carries no usage object, assume a large call.
const FALLBACK_CHAT_USAGE = { prompt_tokens: 20_000, completion_tokens: 4_000 };

// gpt-4o-mini-tts ≈ $0.015/min of audio ≈ $0.02 per 1K input characters.
const TTS_CENTS_PER_CHAR = 0.002;

// gpt-4o-mini-transcribe ≈ $0.003/min.
const STT_CENTS_PER_SECOND = 0.005;
const STT_FALLBACK_SECONDS = 300; // duration unknown → assume a long answer

export function chatCostCents(
  model: string,
  usage: { prompt_tokens?: number; completion_tokens?: number } | null | undefined,
): number {
  const price = CHAT_PRICES[model] ?? FALLBACK_CHAT_PRICE;
  const prompt = usage?.prompt_tokens ?? FALLBACK_CHAT_USAGE.prompt_tokens;
  const completion =
    usage?.completion_tokens ?? FALLBACK_CHAT_USAGE.completion_tokens;
  return (
    ((prompt * price.inputPerM + completion * price.outputPerM) / 1_000_000) *
    100
  );
}

export function ttsCostCents(characters: number): number {
  return characters * TTS_CENTS_PER_CHAR;
}

export function sttCostCents(durationSeconds: number | null | undefined): number {
  return (durationSeconds || STT_FALLBACK_SECONDS) * STT_CENTS_PER_SECOND;
}

/* ————— Limit ————— */

// Per-user monthly cap in USD cents. This is where account types plug in
// later: look up the user's plan and return that plan's allowance instead.
export function monthlyLimitCents(): number {
  const fromEnv = Number(process.env.AI_MONTHLY_LIMIT_CENTS);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 200; // $2 default
}

export const AI_LIMIT_MESSAGE =
  "You've reached this month's AI practice allowance. It resets at the start of next month — your projects, sessions, and feedback are all safe.";

/* ————— Ledger ————— */

export async function recordAiUsage(
  supabase: Supabase,
  event: {
    userId: string;
    kind: AiUsageKind;
    model: string;
    inputTokens?: number | null;
    outputTokens?: number | null;
    costCents: number;
  },
): Promise<void> {
  const { error } = await supabase.from("ai_usage_events").insert({
    user_id: event.userId,
    kind: event.kind,
    model: event.model,
    input_tokens: event.inputTokens ?? null,
    output_tokens: event.outputTokens ?? null,
    cost_cents: Math.max(0, event.costCents),
  });
  if (error) {
    // Unmetered spend is bad, but failing the user's action over it is
    // worse. Log loudly so it shows up in Vercel logs.
    console.error("ai usage recording failed", event.kind, error);
  }
}

/* ————— Budget check ————— */

export async function checkAiBudget(
  supabase: Supabase,
  userId: string,
): Promise<{ allowed: boolean; spentCents: number; limitCents: number }> {
  const limitCents = monthlyLimitCents();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("ai_usage_events")
    .select("cost_cents")
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString());

  if (error) {
    console.error("ai budget check failed (allowing)", error);
    return { allowed: true, spentCents: 0, limitCents };
  }

  const spentCents = (data ?? []).reduce(
    (sum, row) => sum + Number(row.cost_cents),
    0,
  );
  return { allowed: spentCents < limitCents, spentCents, limitCents };
}
