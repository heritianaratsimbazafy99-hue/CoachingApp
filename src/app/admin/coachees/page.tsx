import { AdminCoacheeAssignmentsPage } from "@/components/coaching/admin-coachee-pages";
import { getAdminCoacheeAssignments } from "@/services/admin-service";

export default async function Page() {
  const data = await getAdminCoacheeAssignments();

  return <AdminCoacheeAssignmentsPage data={data} />;
}
