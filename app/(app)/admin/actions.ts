"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/admin";
import { getAdminUser, setAccountDisabled } from "@/lib/admin/data";

/*
 * Admin server actions. Each one re-checks requireSuperAdmin() — the layout
 * gate protects the pages, not these entry points, so authorization is
 * enforced here too.
 */

export async function setAccountDisabledAction(
  userId: string,
  disabled: boolean,
): Promise<{ ok?: true; error?: string }> {
  const me = await requireSuperAdmin();

  if (userId === me.id) {
    return { error: "You can't disable your own account." };
  }

  const target = await getAdminUser(userId);
  if (!target) {
    return { error: "That account no longer exists." };
  }
  if (disabled && target.isSuperAdmin) {
    return { error: "Super-admin accounts can't be disabled." };
  }

  try {
    await setAccountDisabled(userId, disabled);
  } catch (e) {
    console.error("setAccountDisabled failed", e);
    return {
      error: "Something went wrong updating the account. Please try again.",
    };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}
