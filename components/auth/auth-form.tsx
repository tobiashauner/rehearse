"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  authSchema,
  signupSchema,
  type SignupValues,
} from "@/lib/validations/auth";
import { login, signup } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export type AuthMode = "sign-in" | "sign-up";

/**
 * The email/password form shared by the login page and the landing-page
 * popover. Mode is controlled by the parent (which typically also shows a
 * mode-dependent title); everything else — validation, submission, the
 * "confirm your email" resting state — lives here.
 */
export function AuthForm({
  mode,
  onModeChange,
  autoFocus = false,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  autoFocus?: boolean;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(
      mode === "sign-up" ? signupSchema : authSchema,
    ) as unknown as Resolver<SignupValues>,
  });

  function onSubmit(values: SignupValues) {
    setFormError(null);
    startTransition(async () => {
      const result =
        mode === "sign-in" ? await login(values) : await signup(values);
      if (result?.error) {
        setFormError(result.error);
      } else if (result?.needsConfirmation) {
        setNeedsConfirmation(true);
      }
    });
  }

  if (needsConfirmation) {
    return (
      <p className="text-sm text-muted-foreground">
        Check your email to confirm your account, then sign in.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {mode === "sign-up" && (
          <div className="space-y-2">
            <Label htmlFor="auth-name">Name</Label>
            <Input id="auth-name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            autoFocus={autoFocus && mode === "sign-in"}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="auth-password">Password</Label>
          <Input
            id="auth-password"
            type="password"
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <button
        type="button"
        className="text-sm text-muted-foreground hover:underline"
        onClick={() => {
          setFormError(null);
          onModeChange(mode === "sign-in" ? "sign-up" : "sign-in");
        }}
      >
        {mode === "sign-in"
          ? "Need an account? Create one"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
