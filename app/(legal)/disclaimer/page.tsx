import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Disclaimer — Rehearse",
};

/*
 * DRAFT template — not lawyer-reviewed. The AI / no-guarantee / not-advice
 * notice. Replace with reviewed copy before charging. See lib/legal.ts.
 */
export default function DisclaimerPage() {
  return (
    <>
      <h1>Disclaimer</h1>
      <p className="text-muted-foreground">Effective {LEGAL.effectiveDate}</p>

      <h2>AI-generated feedback</h2>
      <p>
        {LEGAL.productName} uses artificial intelligence to generate interview
        questions, scores, and feedback. This output{" "}
        <strong>may be inaccurate, incomplete, biased, or misleading</strong>. Use
        your own judgment and verify anything important. The AI can make mistakes.
      </p>

      <h2>Not professional advice</h2>
      <p>
        The Service is for practice and informational purposes only. It is{" "}
        <strong>not</strong> career, recruiting, legal, financial, medical, or
        psychological advice, and it doesn’t create any professional or advisory
        relationship. For decisions that matter, consult a qualified professional.
      </p>

      <h2>No guarantee of results</h2>
      <p>
        We make <strong>no guarantee</strong> that using the Service will improve
        your interview performance or result in interviews, offers, or employment.
        Outcomes depend on many factors outside our control.
      </p>

      <h2>Your responsibility</h2>
      <p>
        You’re responsible for the materials you upload and how you use the
        feedback. Don’t upload confidential information belonging to others, and
        don’t rely on the Service as your only source of preparation.
      </p>

      <h2>Beta software</h2>
      <p>
        The Service is a free beta and is provided “as is,” may change or break,
        and may lose data. See our <Link href="/terms">Terms</Link> for the full
        no-warranty and liability terms and our{" "}
        <Link href="/privacy">Privacy Policy</Link> for how data is handled.
      </p>

      <h2>Contact</h2>
      <p>
        Questions:{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    </>
  );
}
