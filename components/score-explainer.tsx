"use client";

/*
 * "How is this scored?" — a popover that demystifies the number. It states
 * exactly how scores are derived (per-answer AI grading, difficulty
 * calibration, holistic overall) in plain language, then shows the tier bands
 * so the colors used across the app have a key. Coaching tone throughout.
 */

import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";
import { SCORE_TIERS } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export function ScoreExplainer({ className }: { className?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline",
          className,
        )}
      >
        <Info className="size-3.5" aria-hidden />
        How is this scored?
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="isolate z-50 outline-none"
        >
          <Popover.Popup
            className={cn(
              "w-[22rem] max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-xl bg-popover p-4 text-popover-foreground shadow-raised ring-1 ring-foreground/10 outline-none",
              "duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
          >
            <Popover.Title className="text-sm font-medium">
              How scoring works
            </Popover.Title>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              <p>
                Each answer is graded 0–100 by the same AI that studied your
                resume, the job description, and the briefing — so
                &ldquo;good&rdquo; is measured against{" "}
                <span className="font-medium text-foreground">this</span> role,
                not answers in general.
              </p>
              <p>
                It&apos;s calibrated to difficulty: an 80 on a hard question
                means more than an 80 on an easy one.
              </p>
              <p>
                Your <span className="font-medium text-foreground">overall</span>{" "}
                score is the AI&apos;s read on the whole interview — shaped by
                every answer, but weighted by how it went, not a plain average.
              </p>
              <p>
                <span className="font-medium text-foreground">Delivery</span>{" "}
                counts for a small slice (15%): the substance of how you answer —
                specificity, structure, and directness — plus verbal habits like
                pace, hedging, and filler words. It nudges the score, never
                dominates it. (&ldquo;I&rdquo; vs &ldquo;we&rdquo; is shown as an
                observation, not scored.)
              </p>
            </div>

            <div className="mt-3 border-t pt-3">
              <p className="text-xs font-medium">What the bands mean</p>
              <ul className="mt-2 space-y-1.5">
                {SCORE_TIERS.map((tier) => (
                  <li key={tier.key} className="flex items-center gap-2 text-xs">
                    <span
                      className={cn("size-2 shrink-0 rounded-full", tier.dot)}
                      aria-hidden
                    />
                    <span className={cn("font-medium", tier.text)}>
                      {tier.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {tier.range}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              A score is a bearing, not a verdict — the coaching underneath is
              what moves it.
            </p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
