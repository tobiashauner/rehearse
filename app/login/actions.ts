"use server";

import { redirect } from "next/navigation";
import { authSchema, signupSchema, type AuthValues, type SignupValues } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";

type AuthActionResult = { error?: string; needsConfirmation?: boolean };

export async function login(values: AuthValues): Promise<AuthActionResult> {
  const parsed = authSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signup(values: SignupValues): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid signup details." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/");
  }

  return { needsConfirmation: true };
}
