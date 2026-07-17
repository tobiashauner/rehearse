"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  fileResourceSchema,
  textOrUrlResourceSchema,
  textResourceSchema,
  urlResourceSchema,
} from "@/lib/validations/resource";
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
