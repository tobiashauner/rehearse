import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — Rehearse",
};

/*
 * DRAFT template — not lawyer-reviewed. US-focused (CCPA/CPRA) with a general
 * data-rights posture. Replace with reviewed copy before charging. See
 * lib/legal.ts.
 */
export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Effective {LEGAL.effectiveDate}</p>
      <p>
        This Policy explains what {LEGAL.productName} collects, how we use it, and
        the choices you have. It applies to {LEGAL.domain} and is operated by{" "}
        {LEGAL.operator}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> your name and email address.
        </li>
        <li>
          <strong>Content you provide:</strong> resumes, job descriptions, company
          notes, and similar materials — which may contain personal information
          about you and, if you include it, others.
        </li>
        <li>
          <strong>Interview data:</strong> your typed answers, <strong>audio
          recordings</strong> of spoken answers, transcripts, scores, and feedback.
        </li>
        <li>
          <strong>Usage data:</strong> basic logs and AI-usage metering (e.g.,
          which features you used and approximate cost), used to run and improve
          the Service.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To provide the Service — generate interviews, feedback, and progress.</li>
        <li>To operate, secure, debug, and improve the Service.</li>
        <li>To communicate with you about your account.</li>
        <li>To comply with law and enforce our Terms.</li>
      </ul>
      <p>
        We <strong>do not sell</strong> your personal information, and we{" "}
        <strong>do not use your content to train our own models</strong>.
      </p>

      <h2>AI processing &amp; service providers</h2>
      <p>
        To run the Service we share data with the providers below, who process it
        on our behalf:
      </p>
      <ul>
        {LEGAL.subprocessors.map((s) => (
          <li key={s.name}>
            <strong>{s.name}:</strong> {s.role}.
          </li>
        ))}
      </ul>
      <p>
        In particular, your resume, job description, answers, and audio are sent to{" "}
        {LEGAL.aiProvider} to generate questions, feedback, and transcriptions.
        Their handling of that data is governed by their own terms and policies.
      </p>

      <h2>Audio recordings</h2>
      <p>
        If you use the spoken-interview mode, we record and transcribe your
        answers so we can give you feedback. You can use the “type instead” option
        to avoid recording. Recordings are stored privately and tied to your
        account.
      </p>

      <h2>Retention &amp; beta note</h2>
      <p>
        We keep your data while your account is active. Because the Service is in a
        free beta, data may be reset or deleted as we develop it. You can request
        deletion at any time (below).
      </p>

      <h2>Security</h2>
      <p>
        Access is protected by authentication and per-user access controls, and
        files are stored in private storage. No method of transmission or storage
        is 100% secure, so we can’t guarantee absolute security.
      </p>

      <h2>Your choices &amp; rights</h2>
      <p>
        You can access and update your account information in the app. You may
        request a copy of your data or deletion of your account and associated
        data by emailing{" "}
        <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.
      </p>
      <p>
        <strong>California residents (CCPA/CPRA):</strong> you have the right to
        know what personal information we collect, to request access or deletion,
        and to not be discriminated against for exercising these rights. We do not
        sell or “share” personal information as those terms are defined under
        California law. To exercise these rights, contact us at the address above.
      </p>

      <h2>Children</h2>
      <p>
        The Service is for adults (18+) and isn’t directed to children. We don’t
        knowingly collect data from children under 13.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this Policy; we’ll revise the effective date above and, for
        material changes, provide notice where appropriate.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions or data requests:{" "}
        <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>. See also
        our <Link href="/terms">Terms</Link> and{" "}
        <Link href="/disclaimer">Disclaimer</Link>.
      </p>
    </>
  );
}
