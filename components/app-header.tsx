"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandMenu } from "@/components/command-menu";
import { createClient } from "@/lib/supabase/client";

export function AppHeader({ name, email }: { name: string; email: string }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-20 grid h-14 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 bg-sidebar px-4">
        <Link
          href="/"
          aria-label="Rehearse — your projects"
          className="flex items-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Image
            src="/rehearse_logo.svg"
            alt="Rehearse"
            width={320}
            height={100}
            unoptimized
            className="h-10 w-auto shrink-0"
          />
        </Link>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted sm:h-10 sm:w-full sm:max-w-[16rem] sm:justify-start sm:gap-2 sm:px-3"
          >
            <Search className="size-4" />
            <span className="hidden flex-1 text-left text-sm sm:inline">Search...</span>
            <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
          </button>
        </div>

        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar size="sm">
                    <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-32 truncate sm:inline">{name}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-56">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
