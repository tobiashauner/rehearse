"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, FolderPlus, LayoutGrid } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";

type ProjectEntry = {
  id: string;
  title: string;
  company: string | null;
  role: string | null;
};

export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectEntry[]>([]);

  // Refresh the project list each time the palette opens; it's one tiny
  // indexed query and keeps the list correct without cache invalidation.
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("projects")
      .select("id, title, company, role")
      .order("updated_at", { ascending: false })
      .then(({ data }) => setProjects(data ?? []));
  }, [open]);

  function navigate(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput placeholder="Jump to a project..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Projects">
            <CommandItem onSelect={() => navigate("/")}>
              <LayoutGrid />
              All projects
            </CommandItem>
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                keywords={[project.company ?? "", project.role ?? ""].filter(
                  Boolean,
                )}
                onSelect={() => navigate(`/projects/${project.id}`)}
              >
                <FolderKanban />
                <span className="truncate">{project.title}</span>
                {(project.role || project.company) && (
                  <span className="truncate text-muted-foreground">
                    {[project.role, project.company].filter(Boolean).join(" @ ")}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => navigate("/")}>
              <FolderPlus />
              New Project
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
