import { AssignmentComposerPage } from "@/components/coaching/assignment-pages";
import { getCoachAssignmentComposerData } from "@/services/coach-service";

export default async function Page() {
  const data = await getCoachAssignmentComposerData();

  return <AssignmentComposerPage data={data} />;
}
