import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

function ChecklistItem({
  done,
  label,
}: {
  done: boolean;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {done ? (
        <CheckCircle2 className="size-4 shrink-0 text-foreground" />
      ) : (
        <Circle className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className={cn(!done && "text-muted-foreground")}>{label}</span>
    </li>
  );
}

export function AiBriefingOnboarding({
  hasResume,
  hasJobDescription,
  hasAnyResource,
}: {
  hasResume: boolean;
  hasJobDescription: boolean;
  hasAnyResource: boolean;
}) {
  return (
    <Empty className="max-w-xl border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Sparkles />
        </EmptyMedia>
        <EmptyTitle>Generate your AI Briefing</EmptyTitle>
        <EmptyDescription>
          The briefing analyzes your project&apos;s resources into a role summary,
          required skills, resume strengths and gaps, likely interview questions, and
          more. Every interview you generate afterward is grounded in this briefing, so
          better inputs here mean more realistic, specific interview questions.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <ul className="space-y-1.5 text-left">
          <ChecklistItem done={hasResume} label="Resume, cover letter, or notes about your background" />
          <ChecklistItem done={hasJobDescription} label="Job description" />
        </ul>
        <p className="text-xs text-muted-foreground">
          {!hasAnyResource
            ? "At least one resource is required. Add one in the Resources section, then come back here."
            : hasResume && hasJobDescription
              ? "You have both recommended inputs — ready to generate a high-quality briefing."
              : "You can generate a briefing now — adding both of the above will produce a more accurate one."}
        </p>
      </EmptyContent>
    </Empty>
  );
}
