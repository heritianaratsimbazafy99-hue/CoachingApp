import { AdminCohortsPage } from "@/components/coaching/admin-pages";
import { getAdminCohorts } from "@/services/admin-service";

export default async function Page() {
  const cohorts = await getAdminCohorts();

  return <AdminCohortsPage cohorts={cohorts} />;
}
