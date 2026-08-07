"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import { Angry, Frown, Laugh, Meh, MessageSquare, Smile } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { CSAT_LEVELS } from "@/lib/validations/feedback";
import { submitFeedback } from "@/app/(app)/feedback/actions";

/*
 * Header feedback entry point: a popover with a 1–5 CSAT scale (satisfaction
 * faces) and an optional comment, written to the user_feedback table via the
 * submitFeedback action. Rating is required; comment is optional. Resets on
 * close so each open starts fresh.
 */

const FACES: Record<number, LucideIcon> = {
  1: Angry,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
};

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setRating(null);
    setComment("");
  }

  function handleSubmit() {
    if (rating == null) return;
    startTransition(async () => {
      const result = await submitFeedback({
        rating,
        comment: comment.trim() || undefined,
        pagePath: pathname,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Thanks — we read every note.");
      setOpen(false);
      reset();
    });
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Popover.Trigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-2 text-muted-foreground",
        )}
      >
        <MessageSquare className="size-4" />
        <span className="hidden sm:inline">Feedback</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="isolate z-50 outline-none"
        >
          <Popover.Popup
            className={cn(
              "w-80 origin-(--transform-origin) rounded-xl bg-popover p-5 text-popover-foreground shadow-raised ring-1 ring-foreground/10 outline-none",
              "duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
          >
            <Popover.Title className="text-base font-medium">
              Share feedback
            </Popover.Title>
            <Popover.Description className="mt-1 text-sm text-muted-foreground">
              How satisfied are you with Rehearse?
            </Popover.Description>

            <div
              className="mt-4 flex items-center justify-between"
              role="radiogroup"
              aria-label="Satisfaction rating"
            >
              {CSAT_LEVELS.map((level) => {
                const Face = FACES[level.value];
                const selected = rating === level.value;
                return (
                  <button
                    key={level.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={level.label}
                    title={level.label}
                    onClick={() => setRating(level.value)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-lg border transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Face className="size-6" />
                  </button>
                );
              })}
            </div>

            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What's working, what's not? (optional)"
              className="mt-4 resize-none"
            />

            <Button
              className="mt-4 w-full"
              disabled={rating == null || isPending}
              onClick={handleSubmit}
            >
              {isPending && <Spinner data-icon="inline-start" />}
              Send feedback
            </Button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
