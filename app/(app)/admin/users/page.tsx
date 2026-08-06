import { requireSuperAdmin } from "@/lib/auth/admin";
import { listAllUsers } from "@/lib/admin/data";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const me = await requireSuperAdmin();
  const users = await listAllUsers();

  return <UsersTable users={users} currentUserId={me.id} />;
}
