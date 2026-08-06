import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { SUPER_ADMIN_ROLE } from "@/lib/auth/admin";

/*
 * Server-only data access for the admin area. Everything here uses the
 * service-role client, so callers MUST sit behind requireSuperAdmin(). The
 * shapes returned are already trimmed to what the UI needs — never leak the
 * raw admin user objects (tokens, identities, etc.) to the client.
 */

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  /** Account disabled = currently banned (blocked from signing in). */
  disabled: boolean;
  isSuperAdmin: boolean;
};

/** Ban duration that reads as "indefinitely disabled" (~100 years). */
const DISABLE_BAN_DURATION = "876000h";

function shapeUser(u: {
  id: string;
  email?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
  banned_until?: string | null;
}): AdminUser {
  const fullName = u.user_metadata?.full_name;
  const bannedUntil = u.banned_until ?? null;
  return {
    id: u.id,
    email: u.email ?? "—",
    name: typeof fullName === "string" && fullName.trim() ? fullName : null,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
    disabled: !!bannedUntil && new Date(bannedUntil).getTime() > Date.now(),
    isSuperAdmin: u.app_metadata?.role === SUPER_ADMIN_ROLE,
  };
}

/** Every auth user, paginating through the Admin API. */
export async function listAllUsers(): Promise<AdminUser[]> {
  const admin = createAdminClient();
  const perPage = 1000;
  const out: AdminUser[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    out.push(...data.users.map(shapeUser));
    if (data.users.length < perPage) break;
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Fetch a single user's admin view (used to guard actions server-side). */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return shapeUser(data.user);
}

/** Disable (ban) or re-enable (unban) an account. Data is never deleted. */
export async function setAccountDisabled(
  userId: string,
  disabled: boolean,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: disabled ? DISABLE_BAN_DURATION : "none",
  });
  if (error) throw error;
}

/* ————— Usage report ————— */

export type UsageByKind = { kind: string; cents: number; events: number };
export type UsagePerUser = {
  userId: string;
  email: string;
  name: string | null;
  disabled: boolean;
  totalCents: number;
  monthCents: number;
  events: number;
  lastActivity: string | null;
};
export type UsageReport = {
  totalCents: number;
  monthCents: number;
  totalEvents: number;
  userCount: number;
  activeThisMonth: number;
  byKind: UsageByKind[];
  perUser: UsagePerUser[];
  /** First-of-month UTC boundary the "this month" figures are measured from. */
  monthStartIso: string;
};

function monthStartUtc(): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Aggregate the ai_usage_events ledger across all users into a report.
 *
 * Reads the full ledger and aggregates in memory — fine at this scale (a
 * handful of users, ~$2/mo each). If the ledger grows large, move the
 * aggregation into a Postgres view/RPC and select the rolled-up rows instead.
 */
export async function buildUsageReport(): Promise<UsageReport> {
  const admin = createAdminClient();
  const { data: events, error } = await admin
    .from("ai_usage_events")
    .select("user_id, kind, cost_cents, created_at");
  if (error) throw error;

  const rows = events ?? [];
  const monthStart = monthStartUtc();
  const monthStartMs = monthStart.getTime();

  const users = await listAllUsers();
  const userById = new Map(users.map((u) => [u.id, u]));

  const byKind = new Map<string, UsageByKind>();
  const perUser = new Map<string, UsagePerUser>();
  let totalCents = 0;
  let monthCents = 0;

  for (const r of rows) {
    const cents = Number(r.cost_cents) || 0;
    const inMonth = new Date(r.created_at).getTime() >= monthStartMs;
    totalCents += cents;
    if (inMonth) monthCents += cents;

    const k = byKind.get(r.kind) ?? { kind: r.kind, cents: 0, events: 0 };
    k.cents += cents;
    k.events += 1;
    byKind.set(r.kind, k);

    const u = userById.get(r.user_id);
    const pu =
      perUser.get(r.user_id) ??
      ({
        userId: r.user_id,
        email: u?.email ?? "(deleted user)",
        name: u?.name ?? null,
        disabled: u?.disabled ?? false,
        totalCents: 0,
        monthCents: 0,
        events: 0,
        lastActivity: null,
      } satisfies UsagePerUser);
    pu.totalCents += cents;
    if (inMonth) pu.monthCents += cents;
    pu.events += 1;
    if (!pu.lastActivity || r.created_at > pu.lastActivity) {
      pu.lastActivity = r.created_at;
    }
    perUser.set(r.user_id, pu);
  }

  const perUserArr = [...perUser.values()].sort(
    (a, b) => b.totalCents - a.totalCents,
  );

  return {
    totalCents,
    monthCents,
    totalEvents: rows.length,
    userCount: users.length,
    activeThisMonth: perUserArr.filter((u) => u.monthCents > 0).length,
    byKind: [...byKind.values()].sort((a, b) => b.cents - a.cents),
    perUser: perUserArr,
    monthStartIso: monthStart.toISOString(),
  };
}

/* ————— Formatting ————— */

/** USD-cents → currency string, with extra precision for sub-dollar sums. */
export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: dollars !== 0 && Math.abs(dollars) < 1 ? 4 : 2,
  }).format(dollars);
}
