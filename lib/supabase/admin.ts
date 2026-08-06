import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/*
 * Service-role Supabase client. Bypasses RLS and exposes `auth.admin`
 * (list users, ban/unban, read cross-user rows). SERVER-ONLY — the
 * `server-only` import makes bundling it into client code a build error.
 *
 * Never call this without a requireSuperAdmin() gate in front of it, and
 * never hand its raw results to the client without shaping them first. No
 * session/cookies — it authenticates purely with the service-role key.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Admin client unavailable: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.",
    );
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
