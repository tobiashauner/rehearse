// Grants (or revokes) the super-admin role on a user, by email.
//
// The role lives in auth.users.app_metadata.role — writable only by the
// service role, and the single source of truth the app checks (see
// lib/auth/admin.ts). This is the bootstrap path for the first super-admin;
// there's no in-app UI to grant the role.
//
// Usage:
//   node --env-file=.env.local scripts/grant-super-admin.mjs <email>
//   node --env-file=.env.local scripts/grant-super-admin.mjs <email> --revoke
//
// Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local.

import { createClient } from "@supabase/supabase-js";

const SUPER_ADMIN_ROLE = "super-admin";

const email = process.argv[2];
const revoke = process.argv.includes("--revoke");

if (!email || email.startsWith("--")) {
  console.error(
    "Usage: node --env-file=.env.local scripts/grant-super-admin.mjs <email> [--revoke]",
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (pass --env-file=.env.local).",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

// The Admin API has no "get user by email", so page through until we find it.
async function findUserByEmail(targetEmail) {
  const perPage = 1000;
  const needle = targetEmail.trim().toLowerCase();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const match = data.users.find(
      (u) => (u.email ?? "").toLowerCase() === needle,
    );
    if (match) return match;
    if (data.users.length < perPage) return null;
  }
}

const user = await findUserByEmail(email);
if (!user) {
  console.error(`No user found with email ${email}.`);
  process.exit(1);
}

const nextAppMetadata = { ...(user.app_metadata ?? {}) };
nextAppMetadata.role = revoke ? null : SUPER_ADMIN_ROLE;

const { error } = await supabase.auth.admin.updateUserById(user.id, {
  app_metadata: nextAppMetadata,
});
if (error) {
  console.error("Failed to update role:", error.message);
  process.exit(1);
}

console.log(
  revoke
    ? `Revoked super-admin from ${email} (${user.id}).`
    : `Granted super-admin to ${email} (${user.id}).`,
);
console.log("They may need to sign out and back in for the change to take effect.");
