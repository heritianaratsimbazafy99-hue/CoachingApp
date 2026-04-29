import { AssignmentsPage } from "@/components/coaching/assignment-pages";
import { getCoachAssignmentsData } from "@/services/coach-service";

export default async function Page() {
  const data = await getCoachAssignmentsData();

  return <AssignmentsPage data={data} />;
}
