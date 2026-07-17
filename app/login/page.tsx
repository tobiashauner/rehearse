"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema, signupSchema, type SignupValues } from "@/lib/validations/auth";
import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
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

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </CardTitle>
          <CardDescription>Rehearse</CardDescription>
        </CardHeader>
        <CardContent>
          {needsConfirmation ? (
            <p className="text-sm text-muted-foreground">
              Check your email to confirm your account, then sign in.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              {mode === "sign-up" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
              <Button type="submit" className="w-full" disabled={isPending}>
                {mode === "sign-in" ? "Sign in" : "Create account"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setFormError(null);
              setNeedsConfirmation(false);
            }}
          >
            {mode === "sign-in"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
