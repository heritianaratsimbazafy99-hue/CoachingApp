import { CoacheeTasksPage } from "@/components/coaching/coachee-learning-pages";
import { getCoacheeTasksData } from "@/services/coachee-service";

export default async function Page() {
  const data = await getCoacheeTasksData();

  return <CoacheeTasksPage data={data} />;
}
