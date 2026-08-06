import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/*
 * Super-admin authorization.
 *
 * The role lives in `auth.users.app_metadata.role` (not user_metadata, which
 * the user can edit themselves). app_metadata is only writable by the service
 * role / admin API and rides in the JWT, so it's the trustworthy place for an
 * authorization claim. Grant/revoke via scripts/grant-super-admin.mjs.
 */

export const SUPER_ADMIN_ROLE = "super-admin";

type RoleBearing = Pick<User, "app_metadata"> | null | undefined;

export function roleOf(user: RoleBearing): string | null {
  const role = user?.app_metadata?.role;
  return typeof role === "string" ? role : null;
}

export function isSuperAdmin(user: RoleBearing): boolean {
  return roleOf(user) === SUPER_ADMIN_ROLE;
}

/**
 * Server guard for the admin area. Returns the current super-admin user, or
 * redirects: to /login if signed out, to / if signed in but not a super-admin.
 * Call it in the admin layout AND in every admin server action — the layout
 * gate alone doesn't protect the actions.
 */
export async function requireSuperAdmin(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isSuperAdmin(user)) redirect("/");
  return user;
}
