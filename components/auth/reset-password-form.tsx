"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

/**
 * Set-a-new-password form. Reached from a recovery email link (which
 * establishes a session via /auth/confirm), so this just needs the new
 * password and calls updateUser. Doubles as a change-password form for an
 * already-signed-in user. On success the session is valid, so we go home.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  function onSubmit(values: ResetPasswordValues) {
    setFormError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (error) {
        setFormError(
          error.message.toLowerCase().includes("session")
            ? "This reset link has expired. Request a new one from the sign-in page."
            : error.message,
        );
        return;
      }
      toast.success("Password updated — you're signed in.");
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          autoFocus
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          {...register("confirm")}
        />
        {errors.confirm && (
          <p className="text-sm text-destructive">{errors.confirm.message}</p>
        )}
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Spinner data-icon="inline-start" />}
        Update password
      </Button>
    </form>
  );
}
