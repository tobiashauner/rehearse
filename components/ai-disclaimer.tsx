import Link from "next/link";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Small in-product notice that AI feedback is informational, may be wrong, and
 * isn't professional advice. Links to the full /disclaimer. Server component
 * (no client hooks) so it can drop into server-rendered pages.
 */
export function AiDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        Feedback is AI-generated — it can be inaccurate and isn&apos;t
        professional career advice.{" "}
        <Link
          href="/disclaimer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Learn more
        </Link>
        .
      </span>
    </p>
  );
}
