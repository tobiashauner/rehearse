import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User } from "@supabase/supabase-js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDisplayName(user: Pick<User, "email" | "user_metadata">) {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim().length > 0) {
    return fullName;
  }
  return user.email?.split("@")[0] ?? "Account";
}
