import { AdminStatsPage } from "@/components/coaching/admin-pages";
import { getAdminMetrics } from "@/services/admin-service";

export default async function Page() {
  const metrics = await getAdminMetrics();

  return <AdminStatsPage metrics={metrics} />;
}
