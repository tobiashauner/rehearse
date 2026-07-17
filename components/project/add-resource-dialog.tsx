"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
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
  ACCEPTED_FILE_LABEL,
  MAX_FILE_LABEL,
  RESOURCE_TYPE_OPTIONS,
  fileResourceSchema,
  textOrUrlResourceSchema,
  textResourceSchema,
  urlResourceSchema,
} from "@/lib/validations/resource";
import {
  createTextOrUrlResource,
  createTextResource,
  createUrlResource,
  uploadFileResource,
} from "@/app/(app)/projects/[projectId]/actions";

export function AddResourceDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>(RESOURCE_TYPE_OPTIONS[0].value);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const option = RESOURCE_TYPE_OPTIONS.find((o) => o.value === type)!;

  function reset() {
    setType(RESOURCE_TYPE_OPTIONS[0].value);
    setName("");
    setContent("");
    setUrl("");
    setFile(null);
    setError(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (option.kind === "file") {
      const parsed = fileResourceSchema.safeParse({ type, file });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid file.");
        return;
      }
      const formData = new FormData();
      formData.set("type", parsed.data.type);
      formData.set("file", parsed.data.file);
      startTransition(async () => {
        const result = await uploadFileResource(projectId, formData);
        if (result?.error) {
          setError(result.error);
        } else {
          reset();
          setOpen(false);
        }
      });
      return;
    }

    if (option.kind === "text") {
      const parsed = textResourceSchema.safeParse({ type, name, content });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid resource.");
        return;
      }
      startTransition(async () => {
        const result = await createTextResource(projectId, parsed.data);
        if (result?.error) {
          setError(result.error);
        } else {
          reset();
          setOpen(false);
        }
      });
      return;
    }

    if (option.kind === "url") {
      const parsed = urlResourceSchema.safeParse({ type, url, content });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid resource.");
        return;
      }
      startTransition(async () => {
        const result = await createUrlResource(projectId, parsed.data);
        if (result?.error) {
          setError(result.error);
        } else {
          reset();
          setOpen(false);
        }
      });
      return;
    }

    const parsed = textOrUrlResourceSchema.safeParse({ type, name, url, content });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid resource.");
      return;
    }
    startTransition(async () => {
      const result = await createTextOrUrlResource(projectId, parsed.data);
      if (result?.error) {
        setError(result.error);
      } else {
        reset();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button>Add Resource</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
        </DialogHeader>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="resource-type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as string);
                setError(null);
              }}
            >
              <SelectTrigger id="resource-type" className="w-full">
                <SelectValue>
                  {(value: string) =>
                    RESOURCE_TYPE_OPTIONS.find((opt) => opt.value === value)
                      ?.label ?? value
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {option.kind === "file" && (
            <div className="space-y-2">
              <Label htmlFor="resource-file">File</Label>
              <Input
                id="resource-file"
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                {ACCEPTED_FILE_LABEL} · Max {MAX_FILE_LABEL}
              </p>
            </div>
          )}

          {option.kind === "text" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="resource-name">Name (optional)</Label>
                <Input
                  id="resource-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-content">Content</Label>
                <Textarea
                  id="resource-content"
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </>
          )}

          {option.kind === "text_or_url" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="resource-name">Name (optional)</Label>
                <Input
                  id="resource-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-jd-url">Job posting URL (optional)</Label>
                <Input
                  id="resource-jd-url"
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-jd-content">
                  Paste job description text (optional)
                </Label>
                <Textarea
                  id="resource-jd-content"
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Provide a URL or paste the text — at least one is required.
              </p>
            </>
          )}

          {option.kind === "url" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="resource-url">URL</Label>
                <Input
                  id="resource-url"
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-url-content">
                  Paste page text (optional)
                </Label>
                <Textarea
                  id="resource-url-content"
                  rows={10}
                  placeholder="We can't fetch page content automatically yet — paste the article or profile text here so it becomes searchable AI context."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              {isPending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
