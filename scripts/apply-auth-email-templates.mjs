// Branded Supabase auth email templates for Rehearse.
// Shared card layout, inline styles only (email-client-safe), text wordmark
// (remote images are blocked by default in many clients), no "Supabase"
// anywhere in the visible copy.

import { execSync } from "node:child_process";

const TOKEN = execSync('security find-generic-password -s "Supabase CLI" -w')
  .toString()
  .trim();

const INK = "#33312C";
const MUTED = "#807C71";
const AMBER = "#CA9E00";
const AMBER_DOT = "#D69E2E";
const PAPER = "#FAF8F3";

function layout({ heading, body, cta, note }) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAPER};padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:14px;border:1px solid #E8E5DD;">
      <tr><td style="padding:36px 40px 32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="font-size:19px;font-weight:700;letter-spacing:-0.01em;color:#303030;padding-bottom:28px;">rehearse<span style="color:${AMBER_DOT};">.</span></div>
        <div style="font-size:21px;font-weight:600;letter-spacing:-0.01em;color:${INK};padding-bottom:10px;">${heading}</div>
        <div style="font-size:15px;line-height:1.65;color:#55524A;padding-bottom:28px;">${body}</div>
        <div style="padding-bottom:28px;">
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:${AMBER};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 26px;border-radius:10px;">${cta}</a>
        </div>
        <div style="font-size:13px;line-height:1.6;color:${MUTED};border-top:1px solid #EDEAE3;padding-top:20px;">
          If the button doesn't work, <a href="{{ .ConfirmationURL }}" style="color:#00737C;">use this link instead</a>.<br>${note}
        </div>
      </td></tr>
    </table>
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#9B968A;padding-top:20px;">
      Rehearse &middot; <a href="https://walkinrehearsed.com" style="color:#9B968A;">walkinrehearsed.com</a>
    </div>
  </td></tr>
</table>`;
}

const IGNORE = "Didn't expect this email? You can safely ignore it.";

const config = {
  mailer_subjects_confirmation: "Confirm your email to start rehearsing",
  mailer_templates_confirmation_content: layout({
    heading: "Welcome to Rehearse",
    body:
      "You're one step away from your first mock interview. Confirm your email " +
      "address, and everything is ready — bring the job you're going after and " +
      "rehearse it out loud, with coaching feedback on every answer.",
    cta: "Confirm email address",
    note: IGNORE,
  }),

  mailer_subjects_invite: "You're invited to Rehearse",
  mailer_templates_invite_content: layout({
    heading: "You've been invited",
    body:
      "You've been invited to Rehearse — realistic mock interviews built from " +
      "your resume, the job description, and the company you're going after, " +
      "with structured feedback on every answer. Accept the invitation to set " +
      "up your account.",
    cta: "Accept invitation",
    note: IGNORE,
  }),

  mailer_subjects_magic_link: "Your sign-in link for Rehearse",
  mailer_templates_magic_link_content: layout({
    heading: "Sign in to Rehearse",
    body:
      "Here's the sign-in link you requested. It can be used once and expires " +
      "shortly, so use it soon.",
    cta: "Sign in",
    note: "If you didn't request this link, you can safely ignore this email — your account is untouched.",
  }),

  mailer_subjects_recovery: "Reset your Rehearse password",
  mailer_templates_recovery_content: layout({
    heading: "Choose a new password",
    body:
      "We received a request to reset the password for your Rehearse account. " +
      "If that was you, choose a new password below.",
    cta: "Reset password",
    note: "If you didn't request a reset, you can safely ignore this email — your password is unchanged.",
  }),

  mailer_subjects_email_change: "Confirm your new email address",
  mailer_templates_email_change_content: layout({
    heading: "Confirm your new email",
    body:
      "Follow the link below to confirm the new email address on your " +
      "Rehearse account.",
    cta: "Confirm new email",
    note: IGNORE,
  }),
};

const res = await fetch(
  "https://api.supabase.com/v1/projects/nrcmtbduoxcwplbaspex/config/auth",
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  },
);
if (!res.ok) {
  console.error("PATCH failed", res.status, await res.text());
  process.exit(1);
}
const updated = await res.json();
console.log("subjects now:");
for (const k of Object.keys(config)) {
  if (k.includes("subjects")) console.log(" ", k, "=", updated[k]);
}
console.log("templates updated:", Object.keys(config).filter((k) => k.includes("templates")).length);
