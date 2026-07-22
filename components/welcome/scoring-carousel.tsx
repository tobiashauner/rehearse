"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Gauge,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Auto-advancing showcase of the feedback a scored answer produces — the
 * cards mirror the real in-app evaluation UI (score + summary, strengths,
 * improvements, missed points, session debrief). Pauses on hover/focus,
 * no autoplay under prefers-reduced-motion, dots jump directly.
 */

const SLIDE_MS = 4000;

type Slide = {
  key: string;
  label: string;
  icon: LucideIcon;
  body: React.ReactNode;
};

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

const SLIDES: Slide[] = [
  {
    key: "score",
    label: "Every answer, scored",
    icon: Gauge,
    body: (
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-semibold text-primary tabular-nums">
          7.8
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Calibrated to the question&apos;s difficulty and graded against your
          resume and the role — not a generic rubric.{" "}
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
            7.4
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
        setActive((a) => (a + 1) % SLIDES.length);
      }
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [paused]);

  const slide = SLIDES[active];

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative min-h-[15rem] overflow-hidden rounded-2xl border bg-card p-6 shadow-resting sm:min-h-[13.5rem]">
        {SLIDES.map((s, i) => (
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
              <s.icon className="size-4 text-badge-accent" />
              {s.label}
            </p>
            <div className="mt-4">{s.body}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2" role="tablist" aria-label="Feedback examples">
        {SLIDES.map((s, i) => (
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
                : "w-2 bg-border hover:bg-muted-foreground/40",
            )}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {slide.label}
        </span>
      </div>
    </div>
  );
}
