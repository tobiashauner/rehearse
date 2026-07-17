import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/utils";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader name={getDisplayName(user)} email={user.email ?? ""} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-6 sm:p-10">{children}</div>
      </main>
    </div>
  );
}
