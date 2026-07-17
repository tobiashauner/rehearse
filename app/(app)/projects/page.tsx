import { redirect } from "next/navigation";

// The home pane is the project list now; this route stays only so old links land well.
export default function ProjectsPage() {
  redirect("/");
}
