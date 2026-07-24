"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Download,
  ExternalLink,
  FileSignature,
  FileText,
  FileUser,
  Globe,
  Contact,
  Images,
  NotebookPen,
  Trash2,
  UserSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  deleteResource,
  getResourceDownloadUrl,
} from "@/app/(app)/projects/[projectId]/actions";
import { RESOURCE_TYPE_OPTIONS } from "@/lib/validations/resource";
import type { Database } from "@/types/database";

type Resource = Database["public"]["Tables"]["resources"]["Row"];

const LABELS = Object.fromEntries(
  RESOURCE_TYPE_OPTIONS.map((opt) => [opt.value, opt.label]),
);

// Rough first pass at per-type icons — swap freely.
const TYPE_ICONS: Record<string, LucideIcon> = {
  resume: FileUser,
  cover_letter: FileSignature,
  portfolio_pdf: Images,
  job_description: Briefcase,
  linkedin_url: Contact,
  company_website: Globe,
  hiring_manager_linkedin: UserSearch,
  personal_notes: NotebookPen,
  other_pdf: FileText,
};

export function ResourceList({
  projectId,
  resources,
}: {
  projectId: string;
  resources: Resource[];
}) {
  if (resources.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>No resources yet</EmptyTitle>
          <EmptyDescription>
            Add a resume, job description, or notes to get started.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          projectId={projectId}
          resource={resource}
        />
      ))}
    </div>
  );
}

function ResourceCard({
  projectId,
  resource,
}: {
  projectId: string;
  resource: Resource;
}) {
  const [isPending, startTransition] = useTransition();
  const Icon = TYPE_ICONS[resource.type] ?? FileText;

  function handleDownload() {
    const storagePath = resource.storage_path;
    if (!storagePath) return;
    startTransition(async () => {
      const result = await getResourceDownloadUrl(storagePath);
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${resource.name ?? LABELS[resource.type]}"?`)) return;
    startTransition(async () => {
      const result = await deleteResource(projectId, resource.id);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-resting ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-badge-accent/10 text-badge-accent">
          <Icon className="size-4.5" />
        </span>
        <Badge variant="accent">{LABELS[resource.type] ?? resource.type}</Badge>
      </div>

      <div className="min-w-0">
        <p className="truncate font-medium">
          {resource.name || resource.url || "Untitled"}
        </p>
        {resource.content && !resource.storage_path && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {resource.content}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-xs text-muted-foreground">
          Added {new Date(resource.created_at).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-0.5">
          {resource.storage_path && (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              onClick={handleDownload}
              aria-label="Download"
              title="Download"
            >
              <Download />
            </Button>
          )}
          {resource.url && (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              onClick={() =>
                window.open(resource.url!, "_blank", "noopener,noreferrer")
              }
              aria-label="Open link"
              title="Open link"
            >
              <ExternalLink />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isPending}
            onClick={handleDelete}
            aria-label="Delete"
            title="Delete"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  );
}
