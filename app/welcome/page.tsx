import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import "./welcome.css";

export const metadata: Metadata = {
  title: "Rehearse — walk in already rehearsed",
  description:
    "Realistic AI mock interviews built from your resume, the job description, and the company you're chasing — with feedback that coaches, not grades.",
};

/*
 * Public entry page, shown at "/" for signed-out visitors (middleware
 * rewrite). Imagery is product-true: vignettes composed from the app's own
 * visual vocabulary (cards, badges, waveform, feedback) rather than stock
 * screenshots that would drift out of date.
 */

// Static waveform silhouette for the hero vignette (percent heights).
const WAVE_BARS = [
  28, 46, 62, 40, 74, 55, 88, 66, 48, 80, 58, 36, 70, 92, 60, 44, 76, 52, 84,
  64, 38, 72, 50, 30, 58, 42,
];

const PERSONALITIES = [
  "Friendly",
  "Direct",
  "Analytical",
  "Skeptical",
  "Fast-paced",
  "Pushes for metrics",
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* ————— Nav ————— */}
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Image
          src="/rehearse_logo.svg"
          alt="Rehearse"
          width={320}
          height={100}
          unoptimized
          className="h-10 w-auto shrink-0"
        />
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "sm" }), "max-sm:hidden")}
          >
            Start rehearsing
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* ————— Hero ————— */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pt-[clamp(3rem,8vh,6rem)] pb-[clamp(4rem,10vh,7rem)] lg:grid-cols-[1.05fr_1fr]">
          <div className="max-w-xl">
            <h1
              className="welcome-rise text-[clamp(2.5rem,5.5vw,4rem)] leading-[1.08] font-medium tracking-[-0.025em] [text-wrap:balance]"
              style={{ "--rise-delay": "0s" } as React.CSSProperties}
            >
              Walk in already rehearsed.
            </h1>
            <p
              className="welcome-rise mt-6 max-w-[52ch] text-lg leading-relaxed text-foreground/80"
              style={{ "--rise-delay": "0.08s" } as React.CSSProperties}
            >
              Rehearse builds a realistic mock interview from your resume, the
              job description, and the company you&apos;re after — asks its
              questions out loud, listens to your answers, and coaches you
              between sessions.
            </p>
            <div
              className="welcome-rise mt-9 flex flex-wrap items-center gap-3"
              style={{ "--rise-delay": "0.16s" } as React.CSSProperties}
            >
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "lg" }), "px-6")}
              >
                Start rehearsing
                <ArrowRight data-icon="inline-end" />
              </Link>
              <p className="text-sm text-muted-foreground">
                Your materials, your questions — no fixed question bank.
              </p>
            </div>
          </div>

          {/* Product vignette: a session mid-answer, feedback arriving. */}
          <div
            className="welcome-rise relative mx-auto w-full max-w-md lg:max-w-none"
            style={{ "--rise-delay": "0.24s" } as React.CSSProperties}
            aria-hidden="true"
          >
            <div className="rounded-2xl border bg-card p-6 shadow-raised">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-badge-accent text-badge-accent-foreground">
                    Behavioral
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Senior Product Manager · adaptive
                  </span>
                </div>
                <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  4 of 8
                </span>
              </div>
              <p className="mt-5 text-[0.9375rem] leading-normal font-medium">
                Tell me about a time you shipped something important with
                incomplete data. How did you decide what was enough?
              </p>
              <div className="mt-6 flex items-center gap-4 rounded-xl bg-secondary px-4 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Mic className="size-3.5" />
                </span>
                <div className="flex h-9 flex-1 items-center justify-between">
                  {WAVE_BARS.map((h, i) => (
                    <span
                      key={i}
                      className="welcome-bar w-[3px] shrink-0 rounded-full bg-primary/80"
                      style={
                        {
                          height: `${h}%`,
                          "--bar-delay": `${(i % 7) * 0.13}s`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  1:42
                </span>
              </div>
            </div>

            {/* Feedback card, arriving over the session card. */}
            <div className="relative z-10 -mt-3 ml-auto w-[88%] rounded-xl border bg-card p-4 shadow-raised sm:-mt-5 sm:w-[76%]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-[0.01em] text-muted-foreground">
                  Answer feedback
                </span>
                <span className="text-sm font-medium text-badge-accent tabular-nums">
                  7.8
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <p className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-badge-accent" />
                  <span>Clear arc — stakes, decision, outcome.</span>
                </p>
                <p className="flex gap-2 text-muted-foreground">
                  <ArrowRight className="mt-0.5 size-3.5 shrink-0" />
                  <span>Quantify the result — what moved, and by how much?</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ————— How it works: a real sequence, so the numbers are earned ————— */}
        <section className="border-y bg-card">
          <div className="mx-auto grid w-full max-w-6xl gap-x-10 gap-y-12 px-6 py-[clamp(3.5rem,8vh,6rem)] sm:grid-cols-3">
            {[
              {
                n: "1",
                title: "Bring the job",
                copy: "Upload your resume and the job description. Rehearse studies both — and the company — before it writes a single question.",
              },
              {
                n: "2",
                title: "Rehearse out loud",
                copy: "A voice interviewer asks, listens, and follows up on what you actually said. Type your answers when speaking isn't an option.",
              },
              {
                n: "3",
                title: "Leave with a plan",
                copy: "Every answer gets specific feedback; every session ends with a debrief — what worked, what to sharpen, what to expect next time.",
              },
            ].map((step) => (
              <div key={step.n} className="border-t pt-5">
                <span className="text-sm font-medium text-badge-accent tabular-nums">
                  {step.n}
                </span>
                <h2 className="mt-3 text-lg font-medium">{step.title}</h2>
                <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
                  {step.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ————— An interviewer, not a question bank ————— */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-[clamp(4rem,10vh,7rem)] lg:grid-cols-2">
          <div className="max-w-lg">
            <h2 className="text-[clamp(1.75rem,3vw,2.375rem)] leading-tight font-medium tracking-[-0.015em] [text-wrap:balance]">
              An interviewer, not a question bank
            </h2>
            <p className="mt-4 leading-relaxed text-foreground/80">
              Choose the room you&apos;ll actually face — friendly, direct,
              skeptical, fast-paced. In adaptive mode the interviewer listens
              to each answer and asks the follow-up a real one would, instead
              of marching down a script.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md rounded-2xl border bg-card p-6 shadow-resting lg:max-w-none">
            <p className="text-xs font-medium tracking-[0.01em] text-muted-foreground">
              Interviewer style
            </p>
            <div className="mt-3 flex flex-wrap gap-2" aria-hidden="true">
              {PERSONALITIES.map((p, i) => (
                <span
                  key={p}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm",
                    i === 3
                      ? "bg-badge-accent font-medium text-badge-accent-foreground"
                      : "border text-muted-foreground",
                  )}
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="mt-6 space-y-3 border-t pt-5 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">You:</span>{" "}
                &ldquo;…so we launched two weeks early and adoption grew
                steadily.&rdquo;
              </p>
              <p className="flex items-start gap-2">
                <Badge
                  variant="outline"
                  className="mt-0.5 shrink-0 text-badge-accent"
                >
                  Follow-up
                </Badge>
                <span>
                  &ldquo;Steadily — compared to what baseline? What would have
                  told you the early launch was a mistake?&rdquo;
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ————— Coaching, not testing — drenched petrol moment ————— */}
        <section className="bg-[oklch(0.40_0.12_200)] text-white">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-[clamp(4rem,10vh,7rem)] lg:grid-cols-[1fr_0.9fr]">
            <div className="max-w-lg">
              <h2 className="text-[clamp(1.875rem,3.4vw,2.625rem)] leading-tight font-medium tracking-[-0.015em] [text-wrap:balance]">
                Coaching, not testing.
              </h2>
              <p className="mt-5 leading-relaxed text-white/85">
                A score isn&apos;t a verdict — it&apos;s a bearing. Rehearse
                remembers every session, shows you how your answers strengthen
                from one to the next, and tells you what to work on before the
                interview that counts. Cramming the night before or practicing
                over months, the feedback stays specific and never punishing.
              </p>
            </div>
            <figure
              className="mx-auto w-full max-w-md rounded-2xl bg-white/8 p-6 ring-1 ring-white/15 lg:max-w-none"
              role="img"
              aria-label="Line chart of interview scores improving from 5.4 to 8.1 across five practice sessions"
            >
              <figcaption className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Session scores</span>
                <span className="text-xs text-white/70">
                  five sessions, three weeks
                </span>
              </figcaption>
              <svg
                viewBox="0 0 320 130"
                className="mt-4 w-full"
                aria-hidden="true"
              >
                <polyline
                  points="12,96 86,78 160,84 234,46 308,24"
                  fill="none"
                  stroke="oklch(0.80 0.13 89)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {[
                  [12, 96, "5.4"],
                  [86, 78, "6.2"],
                  [160, 84, "5.9"],
                  [234, 46, "7.4"],
                  [308, 24, "8.1"],
                ].map(([x, y, label]) => (
                  <g key={label}>
                    <circle cx={x} cy={y} r="4" fill="white" />
                    <text
                      x={x}
                      y={Number(y) - 12}
                      textAnchor="middle"
                      fill="white"
                      fillOpacity="0.9"
                      fontSize="12"
                      fontFamily="inherit"
                    >
                      {label}
                    </text>
                  </g>
                ))}
              </svg>
            </figure>
          </div>
        </section>

        {/* ————— Final CTA ————— */}
        <section className="mx-auto w-full max-w-6xl px-6 py-[clamp(4.5rem,12vh,8rem)] text-center">
          <h2 className="mx-auto max-w-2xl text-[clamp(1.875rem,3.6vw,2.75rem)] leading-tight font-medium tracking-[-0.02em] [text-wrap:balance]">
            Your next interview deserves a rehearsal.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-foreground/80">
            Set up your first project in a couple of minutes — the first
            question is ready as soon as your resume is.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg" }), "px-7")}
            >
              Start rehearsing
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </section>
      </main>

      {/* ————— Footer ————— */}
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-icon.svg"
              alt=""
              width={99}
              height={93}
              unoptimized
              className="h-6 w-auto"
            />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Rehearse
            </span>
          </div>
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
