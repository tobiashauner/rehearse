import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — Rehearse",
};

/*
 * DRAFT template — not lawyer-reviewed. Solid starting copy tailored to
 * Rehearse (AI feedback, audio, free beta); replace with reviewed text and
 * re-issue under the operating entity before charging. See lib/legal.ts.
 */
export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">
        Effective {LEGAL.effectiveDate}
      </p>
      <p>
        These Terms govern your use of {LEGAL.productName} (the “Service”), a
        website that helps you prepare for job interviews using AI-generated mock
        interviews and feedback, operated by {LEGAL.operator}. By creating an
        account or using the Service, you agree to these Terms and to our{" "}
        <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/disclaimer">Disclaimer</Link>. If you don’t agree, don’t use
        the Service.
      </p>

      <h2>Free beta</h2>
      <p>
        The Service is currently offered <strong>free of charge as a beta</strong>{" "}
        while we test it. That means features may change, break, or be removed,
        and <strong>your data may be reset or deleted</strong> without notice. We
        may introduce paid plans in the future; if we do, we’ll update these Terms
        and give you notice before charging you.
      </p>

      <h2>Eligibility</h2>
      <p>
        You must be at least 18 years old and able to form a binding contract to
        use the Service.
      </p>

      <h2>Your account</h2>
      <p>
        You’re responsible for your account and for keeping your credentials
        secure. You’re responsible for all activity under your account. Tell us at{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> if you
        suspect unauthorized use.
      </p>

      <h2>Your content</h2>
      <p>
        You may upload materials such as your resume, job descriptions, notes, and
        audio recordings of your answers (“Your Content”). You retain ownership of
        Your Content. You grant us a limited license to store, process, and
        transmit it to operate the Service — including sending it to our AI
        provider ({LEGAL.aiProvider}) to generate questions, feedback, and
        transcriptions.
      </p>
      <p>You represent that:</p>
      <ul>
        <li>Your Content is yours to share, and doesn’t infringe anyone’s rights.</li>
        <li>
          You won’t upload confidential information belonging to others (for
          example, an employer’s confidential documents or a third party’s
          personal data) without the right to do so.
        </li>
        <li>You won’t upload unlawful, harmful, or abusive content.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Reverse engineer, scrape, or disrupt the Service or its systems.</li>
        <li>Use the Service to build a competing product or to train models.</li>
        <li>Attempt to access other users’ data or bypass security or usage limits.</li>
        <li>Use the Service for any unlawful purpose.</li>
      </ul>

      <h2>AI-generated content</h2>
      <p>
        The Service uses AI to generate interview questions, scores, and feedback.
        This output can be inaccurate, incomplete, or inappropriate, and{" "}
        <strong>is not professional career, legal, HR, or psychological advice</strong>
        . We make <strong>no guarantee</strong> about interview performance,
        hiring outcomes, or job offers. See our{" "}
        <Link href="/disclaimer">Disclaimer</Link>.
      </p>

      <h2>No warranty</h2>
      <p>
        The Service is provided <strong>“as is” and “as available,” without
        warranties of any kind</strong>, whether express or implied, including
        merchantability, fitness for a particular purpose, and non-infringement.
        We don’t warrant that the Service will be uninterrupted, secure, or
        error-free, or that any content will be accurate.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {LEGAL.operator} will not be
        liable for any indirect, incidental, special, consequential, or punitive
        damages, or for lost profits, data, or opportunities, arising out of or
        related to your use of the Service. Because the Service is currently free,
        our total liability to you for any claim is limited to{" "}
        <strong>USD $100</strong>.
      </p>

      <h2>Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless {LEGAL.operator} from claims
        arising out of Your Content or your misuse of the Service or violation of
        these Terms.
      </p>

      <h2>Termination</h2>
      <p>
        You may stop using the Service and request account deletion at any time.
        We may suspend or terminate access at our discretion, including for
        violations of these Terms. Sections that by their nature should survive
        (e.g., ownership, disclaimers, limitation of liability) will survive
        termination.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms. If we make material changes, we’ll update the
        effective date and, where appropriate, notify you. Continued use after
        changes take effect means you accept the updated Terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of the United States and the state in
        which the operator resides, without regard to conflict-of-laws rules.
        <em> (To be finalized upon formation of the operating entity.)</em>
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    </>
  );
}
