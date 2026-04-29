import { CoacheeResultsPage } from "@/components/coaching/coachee-learning-pages";
import { getCoacheeResultsData } from "@/services/coachee-service";

export default async function Page() {
  const data = await getCoacheeResultsData();

  return <CoacheeResultsPage data={data} />;
}
