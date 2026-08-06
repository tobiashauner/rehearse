"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { setAccountDisabledAction } from "@/app/(app)/admin/actions";

/*
 * Per-row enable/disable control for the admin users table. Wraps the server
 * action in a ConfirmDialog: on failure it throws so the dialog stays open and
 * a toast surfaces the reason; on success it resolves (the action revalidates
 * the route, refreshing the row's state).
 *
 * Guards mirror the server: you can't act on your own row, and an active
 * super-admin has no disable control (the server rejects it too).
 */
export function UserAccountToggle({
  userId,
  email,
  disabled,
  isSuperAdmin,
  isSelf,
}: {
  userId: string;
  email: string;
  disabled: boolean;
  isSuperAdmin: boolean;
  isSelf: boolean;
}) {
  if (isSelf) {
    return <span className="text-xs text-muted-foreground">You</span>;
  }
  if (isSuperAdmin && !disabled) {
    return <span className="text-xs text-muted-foreground">Protected</span>;
  }

  const next = !disabled;

  async function handleConfirm() {
    const res = await setAccountDisabledAction(userId, next);
    if (res?.error) {
      toast.error(res.error);
      throw new Error(res.error); // keep the dialog open
    }
    toast.success(next ? `Disabled ${email}` : `Enabled ${email}`);
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant={disabled ? "outline" : "ghost"} size="sm">
          {disabled ? "Enable" : "Disable"}
        </Button>
      }
      title={disabled ? `Enable ${email}?` : `Disable ${email}?`}
      description={
        disabled
          ? "They'll be able to sign in again. Nothing about their data changes."
          : "They'll be signed out and blocked from signing in. Their projects, interviews, and feedback are all kept — you can re-enable them anytime."
      }
      confirmLabel={disabled ? "Enable account" : "Disable account"}
      variant={disabled ? "default" : "destructive"}
      onConfirm={handleConfirm}
    />
  );
}
