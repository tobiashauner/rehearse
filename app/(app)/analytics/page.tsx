import { redirect } from "next/navigation";

// Analytics moved to project level (each project's Analytics tab).
export default function AnalyticsPage() {
  redirect("/");
}
