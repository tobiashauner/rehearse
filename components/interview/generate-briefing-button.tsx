"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { generateProjectAnalysis } from "@/app/(app)/projects/[projectId]/sessions/actions";

export function GenerateBriefingButton({
  projectId,
  hasBriefing,
  hasResources,
}: {
  projectId: string;
  hasBriefing: boolean;
  hasResources: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await generateProjectAnalysis(projectId);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={hasBriefing ? "outline" : "default"}
        disabled={isPending || !hasResources}
        onClick={handleClick}
      >
        {isPending && <Spinner />}
        {isPending ? "Generating…" : hasBriefing ? "Regenerate Briefing" : "Generate Briefing"}
      </Button>
      {!hasResources && (
        <p className="text-xs text-muted-foreground">
          Add a resource first (Resources section).
        </p>
      )}
    </div>
  );
}
