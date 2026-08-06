import { requireSuperAdmin } from "@/lib/auth/admin";
import { AdminNav } from "@/components/admin/admin-nav";

/*
 * Admin area, gated to super-admins. The gate here covers the pages; server
 * actions re-check independently (see admin/actions.ts). Lives inside the
 * (app) route group, so it inherits the app header and page container.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          AI spend and account management.
        </p>
      </header>
      <AdminNav />
      {children}
    </div>
  );
}
