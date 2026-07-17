import OpenAI from "openai";

let client: OpenAI | null = null;

// Lazy singleton: constructing `new OpenAI()` throws synchronously if
// OPENAI_API_KEY is unset, which would otherwise crash any module that
// imports this file at load time, before a caller ever gets a chance to
// short-circuit on its own preconditions (e.g. "no resources yet").
export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

export const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
export const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE || "alloy";
export const OPENAI_STT_MODEL =
  process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe";
