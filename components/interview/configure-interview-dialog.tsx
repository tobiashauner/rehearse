"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONVERSATION_MODE_OPTIONS,
  DIFFICULTY_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  LENGTH_OPTIONS,
  PERSONALITY_OPTIONS,
  configureInterviewSchema,
} from "@/lib/validations/session";
import { createInterviewSession } from "@/app/(app)/projects/[projectId]/sessions/actions";

function OptionSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue>
            {(v: string) => options.find((opt) => opt.value === v)?.label ?? v}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ConfigureInterviewDialog({
  projectId,
  hasBriefing,
  completedSessionCount = 0,
}: {
  projectId: string;
  hasBriefing: boolean;
  completedSessionCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [interviewType, setInterviewType] = useState<string>(
    INTERVIEW_TYPE_OPTIONS[0].value,
  );
  const [difficulty, setDifficulty] = useState<string>(DIFFICULTY_OPTIONS[1].value);
  const [interviewerPersonality, setInterviewerPersonality] = useState<string>(
    PERSONALITY_OPTIONS[0].value,
  );
  const [conversationMode, setConversationMode] = useState<string>(
    CONVERSATION_MODE_OPTIONS[0].value,
  );
  const [lengthMinutes, setLengthMinutes] = useState<string>(LENGTH_OPTIONS[1].value);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = configureInterviewSchema.safeParse({
      interviewType,
      difficulty,
      interviewerPersonality,
      conversationMode,
      lengthMinutes: Number(lengthMinutes),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid configuration.");
      return;
    }

    startTransition(async () => {
      const result = await createInterviewSession(projectId, parsed.data);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button disabled={!hasBriefing}>New Interview</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Interview</DialogTitle>
            {completedSessionCount > 0 && (
              <DialogDescription>
                Adapts to your{" "}
                {completedSessionCount === 1
                  ? "previous session"
                  : `${completedSessionCount} previous sessions`}
                : questions target your weak areas and skip what you&apos;ve nailed.
              </DialogDescription>
            )}
          </DialogHeader>
          <form className="space-y-5" onSubmit={onSubmit}>
            <OptionSelect
              id="interview-type"
              label="Interview Type"
              value={interviewType}
              onChange={setInterviewType}
              options={INTERVIEW_TYPE_OPTIONS}
            />
            <OptionSelect
              id="interview-difficulty"
              label="Difficulty"
              value={difficulty}
              onChange={setDifficulty}
              options={DIFFICULTY_OPTIONS}
            />
            <OptionSelect
              id="interview-personality"
              label="Interviewer Personality"
              value={interviewerPersonality}
              onChange={setInterviewerPersonality}
              options={PERSONALITY_OPTIONS}
            />
            <OptionSelect
              id="interview-mode"
              label="Conversation Mode"
              value={conversationMode}
              onChange={setConversationMode}
              options={CONVERSATION_MODE_OPTIONS}
            />
            <OptionSelect
              id="interview-length"
              label="Length"
              value={lengthMinutes}
              onChange={setLengthMinutes}
              options={LENGTH_OPTIONS}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner />}
                {isPending ? "Generating…" : "Generate Interview"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {!hasBriefing && (
        <p className="text-xs text-muted-foreground">
          Generate an AI Briefing first (AI Briefing section).
        </p>
      )}
    </div>
  );
}
