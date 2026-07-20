import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthPopover } from "@/components/welcome/auth-popover";
import "./welcome.css";

export const metadata: Metadata = {
  title: "Rehearse — walk in already rehearsed",
  description:
    "Realistic AI mock interviews built from your resume, the job description, and the company you're chasing — with feedback that coaches, not grades.",
};

/*
 * Public entry page, shown at "/" for signed-out visitors (middleware
 * rewrite). Illustration-led: unDraw scenes (undraw.co, MIT-like unDraw
 * license), downloaded to public/illustrations/ and recolored to the brand
 * palette (petrol accent, amber warmth — see vault decision 0023); the
 * "interviewer, not a question bank" card stays product-true.
 */

const PERSONALITIES = [
  "Friendly",
  "Direct",
  "Analytical",
  "Skeptical",
  "Fast-paced",
  "Pushes for metrics",
];

/* Full-width organic curve between a petrol band and the page background.
 * flip=true renders the mirror curve (page → petrol). */
function Curve({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 84"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn(
        "block h-[clamp(2.25rem,6vw,5rem)] w-full",
        flip && "rotate-180",
      )}
    >
      <path
        d="M0,50 C180,10 400,0 720,26 C1040,52 1260,74 1440,34 L1440,84 L0,84 Z"
        fill="var(--background)"
      />
    </svg>
  );
}

export default function WelcomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* ————— Petrol-drenched hero, nav included ————— */}
      <div className="bg-[oklch(0.40_0.12_200)] text-white">
        <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Image
            src="/rehearse_logo_white.svg"
            alt="Rehearse"
            width={320}
            height={100}
            unoptimized
            className="h-10 w-auto shrink-0"
          />
          <nav className="flex items-center gap-2">
            <AuthPopover
              initialMode="sign-in"
              align="end"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-white hover:bg-white/12 hover:text-white",
              )}
            >
              Sign in
            </AuthPopover>
            <AuthPopover
              initialMode="sign-up"
              align="end"
              className={cn(buttonVariants({ size: "sm" }), "max-sm:hidden")}
            >
              Start rehearsing
            </AuthPopover>
          </nav>
        </header>

        <section className="mx-auto grid w-full max-w-6xl items-center gap-x-10 gap-y-4 px-6 pt-[clamp(2rem,6vh,4.5rem)] lg:grid-cols-[1fr_1.05fr]">
          <div className="max-w-xl pb-[clamp(2rem,6vh,5rem)]">
            <h1
              className="welcome-rise text-[clamp(2.5rem,5.5vw,4rem)] leading-[1.06] font-medium tracking-[-0.025em] [text-wrap:balance]"
              style={{ "--rise-delay": "0s" } as React.CSSProperties}
            >
              Walk in already rehearsed.
            </h1>
            <p
              className="welcome-rise mt-6 max-w-[50ch] text-lg leading-relaxed text-white/85"
              style={{ "--rise-delay": "0.08s" } as React.CSSProperties}
            >
              Rehearse builds a realistic mock interview from your resume, the
              job description, and the company you&apos;re after — asks its
              questions out loud, listens to your answers, and coaches you
              between sessions.
            </p>
            <div
              className="welcome-rise mt-9 flex flex-wrap items-center gap-x-5 gap-y-3"
              style={{ "--rise-delay": "0.16s" } as React.CSSProperties}
            >
              <AuthPopover
                initialMode="sign-up"
                align="start"
                className={cn(buttonVariants({ size: "lg" }), "px-6")}
              >
                Start rehearsing
                <ArrowRight data-icon="inline-end" />
              </AuthPopover>
              <p className="text-sm text-white/70">
                Your materials, your questions — no fixed question bank.
              </p>
            </div>
          </div>

          <div
            className="welcome-rise relative mx-auto w-full max-w-md self-center pb-[clamp(2rem,5vh,4rem)] lg:max-w-[36rem]"
            style={{ "--rise-delay": "0.24s" } as React.CSSProperties}
            aria-hidden="true"
          >
            {/* Transparent-background WebP cut from assets-src/hero-scene-source.svg
                (the source has a baked-in checkerboard; see vault 0023). */}
            <Image
              src="/illustrations/hero-scene.webp"
              alt=""
              width={1980}
              height={1073}
              unoptimized
              className="block h-auto w-full"
            />
          </div>
        </section>
      </div>
      <div className="-mt-px bg-[oklch(0.40_0.12_200)]">
        <Curve />
      </div>

      <main className="flex-1">
        {/* ————— How it works: three illustrated moments ————— */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-[clamp(2.5rem,6vh,4.5rem)] pb-[clamp(3.5rem,8vh,6rem)]">
          <h2 className="mx-auto max-w-2xl text-center text-[clamp(1.75rem,3vw,2.375rem)] leading-tight font-medium tracking-[-0.015em] [text-wrap:balance]">
            Practice the interview you&apos;ll actually face
          </h2>
          <div className="mt-[clamp(2.5rem,5vh,4rem)] grid gap-x-10 gap-y-12 sm:grid-cols-3">
            {[
              {
                src: "/illustrations/step-bring.svg",
                title: "Bring the job",
                copy: "Upload your resume and the job description. Rehearse studies both — and the company — before it writes a single question.",
              },
              {
                src: "/illustrations/step-speak.svg",
                title: "Rehearse out loud",
                copy: "A voice interviewer asks, listens, and follows up on what you actually said. Type your answers when speaking isn't an option.",
              },
              {
                src: "/illustrations/step-plan.svg",
                title: "Leave with a plan",
                copy: "Every answer gets specific feedback; every session ends with a debrief — what worked, what to sharpen, what to expect next time.",
              },
            ].map((step) => (
              <div key={step.title} className="text-center sm:text-left">
                <Image
                  src={step.src}
                  alt=""
                  width={800}
                  height={560}
                  unoptimized
                  aria-hidden="true"
                  className="mx-auto block h-40 w-auto sm:mx-0"
                />
                <h3 className="mt-6 text-lg font-medium">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-[38ch] text-sm leading-relaxed text-muted-foreground sm:mx-0">
                  {step.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ————— An interviewer, not a question bank ————— */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-x-14 gap-y-10 px-6 py-[clamp(3rem,8vh,6rem)] lg:grid-cols-2">
          <div className="max-w-lg">
            <Image
              src="/illustrations/conversation.svg"
              alt=""
              width={842}
              height={843}
              unoptimized
              aria-hidden="true"
              className="mb-8 block h-auto w-full max-w-[17rem]"
            />
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

        {/* ————— Coaching, not testing — petrol band with organic edges ————— */}
        <div className="bg-[oklch(0.40_0.12_200)]">
          <Curve flip />
        </div>
        <section className="bg-[oklch(0.40_0.12_200)] text-white">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-x-12 gap-y-16 px-6 py-[clamp(3rem,8vh,5.5rem)] lg:grid-cols-[1fr_0.9fr]">
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
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <figure
                className="relative rounded-2xl bg-white/8 p-6 ring-1 ring-white/15"
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
          </div>
        </section>
        <div className="-mt-px bg-[oklch(0.40_0.12_200)]">
          <Curve />
        </div>

        {/* ————— Final CTA: the door ————— */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-x-10 gap-y-8 px-6 pt-[clamp(2.5rem,7vh,5rem)] pb-[clamp(3.5rem,9vh,6.5rem)] lg:grid-cols-[1fr_0.85fr]">
          <div className="max-w-xl max-lg:text-center max-lg:mx-auto">
            <h2 className="text-[clamp(1.875rem,3.6vw,2.75rem)] leading-tight font-medium tracking-[-0.02em] [text-wrap:balance]">
              Your next interview deserves a rehearsal.
            </h2>
            <p className="mt-4 max-w-md text-foreground/80 max-lg:mx-auto">
              Set up your first project in a couple of minutes — the first
              question is ready as soon as your resume is.
            </p>
            <div className="mt-8 flex max-lg:justify-center">
              <AuthPopover
                initialMode="sign-up"
                className={cn(buttonVariants({ size: "lg" }), "px-7")}
              >
                Start rehearsing
                <ArrowRight data-icon="inline-end" />
              </AuthPopover>
            </div>
          </div>
          <Image
            src="/illustrations/cta-walk-in.svg"
            alt=""
            width={760}
            height={800}
            unoptimized
            aria-hidden="true"
            className="mx-auto block h-auto w-full max-w-[22rem]"
          />
        </section>
      </main>

      {/* ————— Footer ————— */}
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <div className="flex items-center gap-3">
            <Image
              src="/rehearse_logo.svg"
              alt="Rehearse"
              width={320}
              height={100}
              unoptimized
              className="h-7 w-auto"
            />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()}
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
