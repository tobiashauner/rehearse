"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  authSchema,
  resetRequestSchema,
  signupSchema,
  type SignupValues,
} from "@/lib/validations/auth";
import { login, signup } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/client";
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
  const [view, setView] = useState<"auth" | "forgot">("auth");
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

  if (view === "forgot") {
    return <ForgotView onBack={() => setView("auth")} />;
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
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="text-left text-sm text-muted-foreground hover:underline"
          onClick={() => {
            setFormError(null);
            onModeChange(mode === "sign-in" ? "sign-up" : "sign-in");
          }}
        >
          {mode === "sign-in"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
        {mode === "sign-in" && (
          <button
            type="button"
            className="text-left text-sm text-muted-foreground hover:underline"
            onClick={() => {
              setFormError(null);
              setView("forgot");
            }}
          >
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Request-a-reset-link sub-view. Calls resetPasswordForEmail from the browser;
 * the reply is always framed as "sent" so we don't leak which emails have
 * accounts. The email link routes through /auth/confirm to /reset-password.
 */
function ForgotView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = resetRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        { redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password` },
      );
      // Don't reveal whether the address exists — always show "sent".
      if (resetError) console.error("resetPasswordForEmail", resetError);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If an account exists for{" "}
          <span className="text-foreground">{email}</span>, a link to reset your
          password is on its way. Check your inbox.
        </p>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:underline"
          onClick={onBack}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <p className="text-sm text-muted-foreground">
        Enter your email and we&apos;ll send a link to reset your password.
      </p>
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Spinner data-icon="inline-start" />}
        Send reset link
      </Button>
      <button
        type="button"
        className="text-sm text-muted-foreground hover:underline"
        onClick={onBack}
      >
        Back to sign in
      </button>
    </form>
  );
}
