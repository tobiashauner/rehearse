import { Skeleton } from "@/components/ui/skeleton";

// The project title + rail live in the layout and stay visible; this only
// covers the page slot (overview tiles / a section body).
export default function ProjectDetailsLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}
