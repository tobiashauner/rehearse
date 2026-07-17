"use client";

import { useState } from "react";
import { AuthForm, type AuthMode } from "@/components/auth/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("sign-in");

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
          <AuthForm mode={mode} onModeChange={setMode} />
        </CardContent>
      </Card>
    </div>
  );
}
