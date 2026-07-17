"use server";

import { redirect } from "next/navigation";
import { projectSchema, type ProjectValues } from "@/lib/validations/project";
import { createClient } from "@/lib/supabase/server";

export async function createProject(values: ProjectValues) {
  const parsed = projectSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Title is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      company: parsed.data.company || null,
      role: parsed.data.role || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create project." };
  }

  redirect(`/projects/${data.id}`);
}
