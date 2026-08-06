import { requireSuperAdmin } from "@/lib/auth/admin";
import { buildUsageReport } from "@/lib/admin/data";
import { UsageReport } from "@/components/admin/usage-report";

export default async function AdminUsagePage() {
  await requireSuperAdmin();
  const report = await buildUsageReport();
  return <UsageReport report={report} />;
}
