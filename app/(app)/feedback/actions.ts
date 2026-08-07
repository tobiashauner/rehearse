"use server";

import { createClient } from "@/lib/supabase/server";
import { feedbackSchema, type FeedbackValues } from "@/lib/validations/feedback";

/*
 * Records a CSAT submission. Uses the caller's authenticated client so RLS
 * (insert-own) applies; user_id is set server-side to the session user, never
 * trusted from the client.
 */
export async function submitFeedback(
  values: FeedbackValues,
): Promise<{ error?: string }> {
  const parsed = feedbackSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please pick a rating first." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Please sign in to send feedback." };
  }

  const { error } = await supabase.from("user_feedback").insert({
    user_id: user.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
    page_path: parsed.data.pagePath || null,
  });

  if (error) {
    console.error("submitFeedback failed", error);
    return { error: "Couldn't send your feedback. Please try again." };
  }

  return {};
}
