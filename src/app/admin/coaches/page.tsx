import { AdminCoachesPage } from "@/components/coaching/admin-pages";
import { getAdminCohorts, getAdminUsers } from "@/services/admin-service";

export default async function Page() {
  const [users, cohorts] = await Promise.all([
    getAdminUsers(),
    getAdminCohorts(),
  ]);

  return <AdminCoachesPage cohorts={cohorts} users={users} />;
}
