"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { AlignLeft, FileText, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
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

const KIND_ICONS = {
  file: <FileText />,
  text: <AlignLeft />,
  url: <Link2 />,
  text_or_url: <Link2 />,
} as const;

function resourceIcon(type: string) {
  const kind = RESOURCE_TYPE_OPTIONS.find((opt) => opt.value === type)?.kind;
  return KIND_ICONS[kind ?? "text"];
}

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
    <ItemGroup className="gap-0 divide-y divide-border rounded-lg border">
      {resources.map((resource) => (
        <ResourceRow
          key={resource.id}
          projectId={projectId}
          resource={resource}
        />
      ))}
    </ItemGroup>
  );
}

function ResourceRow({
  projectId,
  resource,
}: {
  projectId: string;
  resource: Resource;
}) {
  const [isPending, startTransition] = useTransition();

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
    <Item className="rounded-none border-none">
      <ItemMedia variant="icon">{resourceIcon(resource.type)}</ItemMedia>
      <ItemContent>
        <ItemTitle>
          <Badge variant="accent">{LABELS[resource.type] ?? resource.type}</Badge>
          <span className="truncate">{resource.name || resource.url || "Untitled"}</span>
        </ItemTitle>
        {resource.content && !resource.storage_path && (
          <ItemDescription className="line-clamp-1">{resource.content}</ItemDescription>
        )}
        <ItemDescription className="text-xs">
          Added {new Date(resource.created_at).toLocaleDateString()}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        {resource.storage_path && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleDownload}
          >
            Download
          </Button>
        )}
        {resource.url && (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => window.open(resource.url!, "_blank", "noopener,noreferrer")}
          >
            Open
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </ItemActions>
    </Item>
  );
}
