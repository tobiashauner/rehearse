import { requireSuperAdmin } from "@/lib/auth/admin";
import { buildAdoptionReport } from "@/lib/admin/adoption";
import { AdoptionReport } from "@/components/admin/adoption-report";

export default async function AdminAdoptionPage() {
  await requireSuperAdmin();
  const report = await buildAdoptionReport();
  return <AdoptionReport report={report} />;
}
