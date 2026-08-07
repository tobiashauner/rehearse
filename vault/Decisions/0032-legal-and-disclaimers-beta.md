# 0032 — Legal + disclaimers scaffolding for the free beta

**Date:** 2026-08-06
**Status:** accepted (copy is DRAFT — needs lawyer review before pricing)

## Context

The site is live and free while we test before introducing pricing, and it collects real
PII (resumes, job descriptions) and **audio recordings**, all processed by a third party
(OpenAI). That needs a baseline legal/disclaimer layer even pre-LLC. Strategy chosen:
US-focused, ship replaceable draft copy now, form the entity + get lawyer review before
charging.

## Decision

- **Single source of metadata:** `lib/legal.ts` (`LEGAL`) — product name, operator line,
  subprocessors, contact/privacy emails (placeholders), effective date, and a `version`
  string. Every legal surface reads from it.
- **Public legal pages** in a `(legal)` route group (`app/(legal)/{terms,privacy,disclaimer}`)
  with a shared public layout. Middleware **allowlists** `/terms`, `/privacy`, `/disclaimer`
  (via a `publicPaths` list alongside `/login`, `/welcome`, `/auth/confirm`). Linked from the
  welcome footer.
- **Copy is a tailored DRAFT template, not lawyer-reviewed** — US-focused (CCPA/CPRA nod),
  covering AI-may-be-wrong, not-professional-advice, no-guarantee-of-outcomes, third-party
  (OpenAI) processing, audio-recording consent, free-beta as-is / data-may-reset, 18+,
  no-warranty, limitation of liability, and a data-request/deletion contact. Marked DRAFT in
  code comments. **Replace + re-issue under the LLC before pricing.**
- **Clickwrap consent at signup:** a required checkbox (`acceptTerms`, in `signupSchema`)
  linking Terms + Privacy; the signup action stamps `terms_accepted_at` + `terms_version`
  into `user_metadata` as the acceptance record.
- **In-product notices:** `components/ai-disclaimer.tsx` on the session review page;
  a recording-consent line in the voice interview runner (shown before recording); a
  low-key "Free beta" pill in the app header and welcome header.

## Consequences / follow-ups

- **Before charging:** lawyer review, form the LLC, swap the operator/governing-law lines,
  replace placeholder emails, and bump `LEGAL.version` (new signups then record the new
  version; consider re-prompting existing users to re-accept on material change).
- No self-serve account deletion yet — deletion is via emailing the privacy address (admin
  can action it). A real delete-my-account flow is a later add.
- Consent is stored in `user_metadata` (not a dedicated table) — fine for beta.
