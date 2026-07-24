"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  fileResourceSchema,
  textOrUrlResourceSchema,
  textResourceSchema,
  urlResourceSchema,
} from "@/lib/validations/resource";
import { projectSchema, type ProjectValues } from "@/lib/validations/project";
import { createClient } from "@/lib/supabase/server";
import { extractFileText } from "@/lib/resources/extract-text";

async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function uploadFileResource(projectId: string, formData: FormData) {
  const parsed = fileResourceSchema.safeParse({
    type: formData.get("type"),
    file: formData.get("file"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid file." };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { file, type } = parsed.data;
  const storagePath = `${user.id}/${projectId}/${Date.now()}-${file.name}`;

  // Extraction and upload both read `file`'s underlying stream — reading it
  // twice concurrently (e.g. via Promise.all) risks a race that truncates
  // one of the reads, so these must run sequentially, not in parallel.
  const content = await extractFileText(file);
  const { error: uploadError } = await supabase.storage
    .from("resources")
    .upload(storagePath, file);
  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("resources").insert({
    project_id: projectId,
    type,
    name: file.name,
    storage_path: storagePath,
    content,
  });
  if (insertError) {
    await supabase.storage.from("resources").remove([storagePath]);
    return { error: insertError.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function createTextResource(
  projectId: string,
  values: { type: string; name?: string; content: string },
) {
  const parsed = textResourceSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid resource." };
  }

  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("resources").insert({
    project_id: projectId,
    type: parsed.data.type,
    name: parsed.data.name || null,
    content: parsed.data.content,
  });
  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function createUrlResource(
  projectId: string,
  values: { type: string; url: string; content?: string },
) {
  const parsed = urlResourceSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid resource." };
  }

  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("resources").insert({
    project_id: projectId,
    type: parsed.data.type,
    name: parsed.data.url,
    url: parsed.data.url,
    content: parsed.data.content || null,
  });
  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function createTextOrUrlResource(
  projectId: string,
  values: { type: string; name?: string; url?: string; content?: string },
) {
  const parsed = textOrUrlResourceSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid resource." };
  }

  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase.from("resources").insert({
    project_id: projectId,
    type: parsed.data.type,
    name: parsed.data.name || parsed.data.url || null,
    url: parsed.data.url || null,
    content: parsed.data.content || null,
  });
  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteResource(projectId: string, resourceId: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: resource } = await supabase
    .from("resources")
    .select("storage_path")
    .eq("id", resourceId)
    .single();

  const { error } = await supabase.from("resources").delete().eq("id", resourceId);
  if (error) {
    return { error: error.message };
  }

  if (resource?.storage_path) {
    await supabase.storage.from("resources").remove([resource.storage_path]);
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function getResourceDownloadUrl(storagePath: string) {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data, error } = await supabase.storage
    .from("resources")
    .createSignedUrl(storagePath, 60);
  if (error || !data) {
    return { error: error?.message ?? "Failed to create download link." };
  }

  return { url: data.signedUrl };
}

/** Rename a project or change its role/company. */
export async function updateProject(projectId: string, values: ProjectValues) {
  const parsed = projectSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createClient();
  await requireUser(supabase);

  const { error } = await supabase
    .from("projects")
    .update({
      title: parsed.data.title.trim(),
      // Empty strings clear the field rather than storing "".
      company: parsed.data.company?.trim() || null,
      role: parsed.data.role?.trim() || null,
    })
    .eq("id", projectId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

/**
 * Permanently delete a project and everything under it. The DB cascade
 * (projects → resources / ai_briefings / coaching_plans / interview_sessions →
 * questions → answers) handles the rows; storage objects don't cascade, so we
 * clear them explicitly first (best-effort — a storage failure shouldn't block
 * the row deletion the user asked for). `confirmTitle` must match the project's
 * title exactly, matching the typed confirmation in the UI.
 */
export async function deleteProject(projectId: string, confirmTitle: string) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .single();
  if (!project) {
    return { error: "Project not found." };
  }
  if (confirmTitle.trim() !== project.title) {
    return { error: "The name you typed doesn't match this project." };
  }

  // Resource files.
  const { data: resources } = await supabase
    .from("resources")
    .select("storage_path")
    .eq("project_id", projectId);
  const resourcePaths = (resources ?? [])
    .map((r) => r.storage_path)
    .filter((p): p is string => Boolean(p));
  if (resourcePaths.length > 0) {
    await supabase.storage.from("resources").remove(resourcePaths);
  }

  // Interview audio (answer recordings + generated TTS) lives under
  // <uid>/<sessionId>/{answers,questions}/… — list and remove per session.
  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("id")
    .eq("project_id", projectId);
  const audio = supabase.storage.from("interview-audio");
  for (const s of sessions ?? []) {
    for (const sub of ["answers", "questions"]) {
      const { data: files } = await audio.list(`${user.id}/${s.id}/${sub}`, {
        limit: 1000,
      });
      const paths = (files ?? [])
        .filter((f) => f.id)
        .map((f) => `${user.id}/${s.id}/${sub}/${f.name}`);
      if (paths.length > 0) await audio.remove(paths);
    }
  }

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}
