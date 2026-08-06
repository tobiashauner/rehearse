import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Card, CardContent } from "@/components/ui/card";
import { UserAccountToggle } from "@/components/admin/user-account-toggle";
import type { AdminUser } from "@/lib/admin/data";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UsersTable({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-4">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No users yet</EmptyTitle>
              <EmptyDescription>
                Accounts will appear here as people sign up.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="px-0 py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead className="pr-4 text-right">Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="max-w-[18rem] pl-4">
                    <div className="min-w-0">
                      {u.name && (
                        <p className="truncate font-medium">{u.name}</p>
                      )}
                      <p className="truncate text-sm text-muted-foreground">
                        {u.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {u.disabled ? (
                        <Badge variant="destructive">Disabled</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                      {u.isSuperAdmin && (
                        <Badge variant="accent">Super-admin</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {fmtDate(u.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {fmtDate(u.lastSignInAt)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <UserAccountToggle
                      userId={u.id}
                      email={u.email}
                      disabled={u.disabled}
                      isSuperAdmin={u.isSuperAdmin}
                      isSelf={u.id === currentUserId}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
