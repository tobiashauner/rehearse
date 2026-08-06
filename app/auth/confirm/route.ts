import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/*
 * Email-link verification endpoint (recovery today; usable by other email
 * flows later). The auth email links here with a `token_hash` + `type`;
 * verifyOtp establishes the session server-side (no PKCE code-verifier, so it
 * works even when the link is opened on a different device) and we forward to
 * `next`. On failure the link is expired/used — send them to /login to retry.
 *
 * Middleware allowlists this path so a signed-out visitor isn't bounced to
 * /login before the handler runs.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?error=link_expired");
}
