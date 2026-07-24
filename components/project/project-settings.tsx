"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { projectSchema, type ProjectValues } from "@/lib/validations/project";
import {
  deleteProject,
  updateProject,
} from "@/app/(app)/projects/[projectId]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function ProjectSettings({
  projectId,
  project,
}: {
  projectId: string;
  project: { title: string; company: string | null; role: string | null };
}) {
  return (
    <div className="max-w-xl space-y-8">
      <DetailsForm projectId={projectId} project={project} />
      <DangerZone projectId={projectId} title={project.title} />
    </div>
  );
}

function DetailsForm({
  projectId,
  project,
}: {
  projectId: string;
  project: { title: string; company: string | null; role: string | null };
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project.title,
      company: project.company ?? "",
      role: project.role ?? "",
    },
  });

  function onSubmit(values: ProjectValues) {
    startTransition(async () => {
      const result = await updateProject(projectId, values);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Project updated.");
        // Reset dirty state to the just-saved values.
        reset(values);
      }
    });
  }

  return (
    <section className="space-y-5">
      <div>
        <h3 className="font-medium">Project details</h3>
        <p className="text-sm text-muted-foreground">
          Rename the project or update the role and company you&apos;re
          preparing for.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input id="role" placeholder="e.g., Senior Product Manager" {...register("role")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" placeholder="e.g., Stripe" {...register("company")} />
        </div>
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending && <Spinner />}
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </section>
  );
}

function DangerZone({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const matches = confirmText.trim() === title;

  function onDelete() {
    if (!matches) return;
    startTransition(async () => {
      // On success deleteProject redirects; only an error returns here.
      const result = await deleteProject(projectId, confirmText);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/[0.03] p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <TriangleAlert className="size-4" />
        </span>
        <div>
          <h3 className="font-medium">Delete this project</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently removes this project and everything in it — resources,
            the AI briefing, every interview session, its questions, answers,
            recordings, and scores. This cannot be undone.
          </p>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setConfirmText("");
        }}
      >
        <DialogTrigger
          render={
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            />
          }
        >
          Delete project
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{title}&rdquo;?</DialogTitle>
            <DialogDescription>
              This permanently deletes the project and all of its data —
              resources, briefing, sessions, answers, recordings, and scores.
              There is no way to recover it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-medium text-foreground">{title}</span>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              placeholder={title}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={onDelete}
              disabled={!matches || isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending && <Spinner />}
              {isPending ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
