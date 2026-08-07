/*
 * Single source of truth for legal/disclaimer metadata, referenced by the
 * /terms, /privacy, /disclaimer pages, the signup consent, and in-product
 * notices.
 *
 * ⚠️ DRAFT — the copy on the legal pages is a tailored starting template, NOT
 * lawyer-reviewed. Have it reviewed and form the operating entity (LLC) before
 * introducing pricing. Update `version`/`effectiveDate` whenever the terms
 * change (the signup flow stamps the accepted version onto the user).
 *
 * TODO(founder): replace the placeholder contact addresses and confirm the
 * operator line once the entity exists.
 */
export const LEGAL = {
  productName: "Rehearse",
  domain: "walkinrehearsed.com",
  /** Pre-LLC: an individual operating under the trade name below. */
  operator: "the individual operator of Rehearse",
  aiProvider: "OpenAI",
  /** Third parties that process user data. Keep in sync with reality. */
  subprocessors: [
    { name: "Supabase", role: "Authentication, database, and file storage" },
    { name: "OpenAI", role: "AI feedback, question generation, speech-to-text, text-to-speech" },
    { name: "Vercel", role: "Application hosting and logs" },
  ],
  contactEmail: "hello@walkinrehearsed.com",
  privacyEmail: "privacy@walkinrehearsed.com",
  effectiveDate: "August 6, 2026",
  /** Bump on any material change; stamped onto users at signup. */
  version: "2026-08-06-beta",
} as const;
