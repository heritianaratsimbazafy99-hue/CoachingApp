import { AdminCohortsPage } from "@/components/coaching/admin-pages";
import { getAdminCohorts, getAdminUsers } from "@/services/admin-service";

export default async function Page() {
  const [cohorts, users] = await Promise.all([
    getAdminCohorts(),
    getAdminUsers(),
  ]);

  return <AdminCohortsPage cohorts={cohorts} users={users} />;
}
