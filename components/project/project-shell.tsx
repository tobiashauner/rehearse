"use client";

import { useSearchParams } from "next/navigation";

/*
 * Decides the project body layout. Overview and interview (session/review)
 * routes get the persistent interview rail on the left + detail on the right;
 * the focused sections (Resources / AI Briefing / Settings) render full-width.
 */
export function ProjectShell({
  rail,
  children,
}: {
  rail: React.ReactNode;
  children: React.ReactNode;
}) {
  const tab = useSearchParams().get("tab");
  const focused =
    tab === "resources" || tab === "briefing" || tab === "settings";

  if (focused) return <>{children}</>;

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      <aside className="md:w-60 md:shrink-0 lg:w-72">{rail}</aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
