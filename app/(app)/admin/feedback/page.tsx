import { requireSuperAdmin } from "@/lib/auth/admin";
import { buildFeedbackReport } from "@/lib/admin/data";
import { FeedbackReport } from "@/components/admin/feedback-report";

export default async function AdminFeedbackPage() {
  await requireSuperAdmin();
  const report = await buildFeedbackReport();
  return <FeedbackReport report={report} />;
}
