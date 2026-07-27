"use client";

import * as React from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/*
 * Reusable confirmation modal — the considered replacement for window.confirm().
 * Wrap any element as the `trigger`; on confirm it awaits `onConfirm` and shows
 * a pending state. Resolve to let it close; throw to keep it open (the caller
 * surfaces the failure, e.g. a toast). Destructive variant adds a warning
 * glyph and a solid destructive action button.
 */

type ConfirmDialogProps = {
  /** Element that opens the dialog (e.g. a Button). Merged via base-ui render. */
  trigger: React.ReactElement;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  /**
   * Runs on confirm. If it resolves the dialog closes; if it throws the dialog
   * stays open so the user can retry.
   */
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const destructive = variant === "destructive";

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // Leave the dialog open on failure; the caller reports the error.
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false} className="gap-5">
        <DialogHeader className="flex-row items-start gap-3">
          {destructive && (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <TriangleAlert className="size-4.5" />
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-2">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={pending}
            className={cn(
              destructive &&
                "bg-destructive text-white hover:bg-destructive/90",
            )}
          >
            {pending && <Spinner />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
