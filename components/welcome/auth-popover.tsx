"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";
import { AuthForm, type AuthMode } from "@/components/auth/auth-form";

/**
 * Landing-page auth: the form drops out of whichever CTA was clicked instead
 * of routing to /login. Mode resets to the trigger's intent on each open, so
 * "Start rehearsing" always greets with sign-up and "Sign in" with sign-in.
 */
export function AuthPopover({
  initialMode,
  align = "center",
  className,
  children,
}: {
  initialMode: AuthMode;
  align?: "start" | "center" | "end";
  /** Classes for the trigger button (e.g. buttonVariants output). */
  className?: string;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (open) setMode(initialMode);
      }}
    >
      <Popover.Trigger className={className}>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align={align}
          sideOffset={10}
          collisionPadding={16}
          className="isolate z-50 outline-none"
        >
          <Popover.Popup
            className={cn(
              "w-80 origin-(--transform-origin) rounded-xl bg-popover p-5 text-popover-foreground shadow-raised ring-1 ring-foreground/10 outline-none",
              "duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
          >
            <Popover.Title className="text-base font-medium">
              {mode === "sign-in" ? "Welcome back" : "Create your account"}
            </Popover.Title>
            <Popover.Description className="mt-1 mb-4 text-sm text-muted-foreground">
              {mode === "sign-in"
                ? "Pick up where you left off."
                : "Two minutes to your first mock interview."}
            </Popover.Description>
            <AuthForm mode={mode} onModeChange={setMode} autoFocus />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
