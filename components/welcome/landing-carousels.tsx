"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Compass,
  Gauge,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Auto-advancing showcases for the landing page, mirroring real in-app
 * surfaces: the per-answer scoring feedback (light card, paper section) and
 * the cross-session coaching loop (dark card, petrol band). Slides pause on
 * hover/focus, dot-tabs jump directly, and prefers-reduced-motion disables
 * autoplay. Scores are 0-100, matching the product.
 */

const SLIDE_MS = 4000;

type Slide = {
  key: string;
  label: string;
  icon: LucideIcon;
  body: React.ReactNode;
};

function Carousel({
  slides,
  tone,
  className,
}: {
  slides: Slide[];
  tone: "light" | "dark";
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      if (!reducedMotion.current) {
        setActive((a) => (a + 1) % slides.length);
      }
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  const dark = tone === "dark";
  const slide = slides[active];

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className={cn(
          "relative min-h-[16rem] overflow-hidden rounded-2xl p-6 sm:min-h-[14.5rem]",
          dark
            ? "bg-white/8 ring-1 ring-white/15"
            : "border bg-card shadow-resting",
        )}
      >
        {slides.map((s, i) => (
          <div
            key={s.key}
            aria-hidden={i !== active}
            className={cn(
              "absolute inset-0 p-6 transition-all duration-500 ease-out motion-reduce:transition-none",
              i === active
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0",
            )}
          >
            <p className="flex items-center gap-2 text-sm font-medium">
              <s.icon
                className={cn(
                  "size-4",
                  dark ? "text-[oklch(0.80_0.13_89)]" : "text-badge-accent",
                )}
              />
              {s.label}
            </p>
            <div className="mt-4">{s.body}</div>
          </div>
        ))}
      </div>

      <div
        className="mt-4 flex items-center gap-2"
        role="tablist"
        aria-label="Examples"
      >
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={s.label}
            onClick={() => setActive(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === active
                ? "w-6 bg-primary"
                : cn(
                    "w-2",
                    dark
                      ? "bg-white/25 hover:bg-white/40"
                      : "bg-border hover:bg-muted-foreground/40",
                  ),
            )}
          />
        ))}
        <span
          className={cn(
            "ml-2 text-xs",
            dark ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {slide.label}
        </span>
      </div>
    </div>
  );
}

/* ————— Scoring: what one answer gets back ————— */

function FeedbackRows({
  icon: Icon,
  iconClass,
  items,
}: {
  icon: LucideIcon;
  iconClass: string;
  items: string[];
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
          <Icon className={cn("mt-0.5 size-4 shrink-0", iconClass)} />
          <span className="text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}

const SCORING_SLIDES: Slide[] = [
  {
    key: "score",
    label: "Every answer, scored 0–100",
    icon: Gauge,
    body: (
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-full bg-primary/15 text-primary">
          <span className="text-xl leading-none font-semibold tabular-nums">
            78
          </span>
          <span className="text-[10px] text-primary/70">/100</span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Calibrated to the question&apos;s difficulty and graded against your
          resume and the role — an 80 on a hard question means more than an 80
          on an easy one.{" "}
          <span className="text-foreground">
            &ldquo;Clear arc — stakes, decision, outcome.&rdquo;
          </span>
        </p>
      </div>
    ),
  },
  {
    key: "worked",
    label: "What worked",
    icon: Check,
    body: (
      <FeedbackRows
        icon={Check}
        iconClass="text-badge-accent"
        items={[
          "Opened with the stakes, not the setup",
          "Named the metric you owned — and the baseline",
          "Owned the trade-off honestly instead of hiding it",
        ]}
      />
    ),
  },
  {
    key: "improve",
    label: "How to improve",
    icon: ArrowRight,
    body: (
      <FeedbackRows
        icon={ArrowRight}
        iconClass="text-primary"
        items={[
          "Quantify the result — what moved, and by how much?",
          "Trim the setup to two sentences; the decision is the story",
          "Close with what you'd do differently next time",
        ]}
      />
    ),
  },
  {
    key: "missed",
    label: "What a strong answer adds",
    icon: Lightbulb,
    body: (
      <FeedbackRows
        icon={Lightbulb}
        iconClass="text-badge-accent"
        items={[
          "The alternative you rejected, and why",
          "How you validated the call after launch",
        ]}
      />
    ),
  },
  {
    key: "debrief",
    label: "The session debrief",
    icon: ClipboardList,
    body: (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-badge-accent/15 text-lg font-semibold text-badge-accent tabular-nums">
            74
          </div>
          <p className="text-sm text-muted-foreground">
            Every session rolls up into an overall score, your strongest
            areas, and what to practice next.
          </p>
        </div>
        <FeedbackRows
          icon={Sparkles}
          iconClass="text-badge-accent"
          items={[
            "Strongest: structure and metric fluency",
            "Practice next: answers under the skeptical style",
          ]}
        />
      </div>
    ),
  },
];

export function ScoringCarousel({ className }: { className?: string }) {
  return <Carousel slides={SCORING_SLIDES} tone="light" className={className} />;
}

/* ————— Coaching: what happens between sessions ————— */

const COACHING_SLIDES: Slide[] = [
  {
    key: "trend",
    label: "Scores across sessions",
    icon: TrendingUp,
    body: (
      <figure
        role="img"
        aria-label="Line chart of interview scores improving from 54 to 81 across five practice sessions"
      >
        <figcaption className="flex items-baseline justify-between text-xs text-white/70">
          <span>five sessions, three weeks</span>
          <span>0–100</span>
        </figcaption>
        <svg viewBox="0 0 320 118" className="mt-3 w-full" aria-hidden="true">
          <polyline
            points="12,88 86,70 160,76 234,38 308,16"
            fill="none"
            stroke="oklch(0.80 0.13 89)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            [12, 88, "54"],
            [86, 70, "62"],
            [160, 76, "59"],
            [234, 38, "74"],
            [308, 16, "81"],
          ].map(([x, y, label]) => (
            <g key={label}>
              <circle cx={x} cy={y} r="4" fill="white" />
              <text
                x={x}
                y={Number(y) + 22}
                textAnchor="middle"
                fill="white"
                fillOpacity="0.85"
                fontSize="12"
                fontFamily="inherit"
              >
                {label}
              </text>
            </g>
          ))}
        </svg>
      </figure>
    ),
  },
  {
    key: "plan",
    label: "Your coaching plan",
    icon: Target,
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p className="text-white/90">
          <span className="font-medium text-white">Quantify outcomes.</span>{" "}
          Your strongest answers named a metric; the weaker ones stayed
          qualitative.
        </p>
        <p className="text-white/70">
          Drill: re-answer two questions from last session, leading with the
          number that moved.
        </p>
        <p className="text-white/70">
          Keep doing: structure — stakes, decision, outcome — is already
          landing.
        </p>
      </div>
    ),
  },
  {
    key: "next",
    label: "Your next interview, prescribed",
    icon: Compass,
    body: (
      <div className="space-y-3 text-sm leading-relaxed">
        <div className="flex flex-wrap gap-1.5">
          {["Behavioral", "Hard", "Skeptical style"].map((chip) => (
            <span
              key={chip}
              className="rounded-lg bg-white/12 px-2.5 py-1 text-sm font-medium text-white"
            >
              {chip}
            </span>
          ))}
        </div>
        <p className="text-white/80">
          The next session is generated around your weak areas from the last
          one — and questions you&apos;ve already faced don&apos;t repeat.
        </p>
      </div>
    ),
  },
];

export function CoachingCarousel({ className }: { className?: string }) {
  return (
    <div className="text-white">
      <Carousel slides={COACHING_SLIDES} tone="dark" className={className} />
    </div>
  );
}
