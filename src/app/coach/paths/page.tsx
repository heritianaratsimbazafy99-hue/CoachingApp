import { CoachLearningPathsPage } from "@/components/coaching/learning-path-pages";
import { getCoachLearningPathData } from "@/services/learning-path-service";

export default async function Page() {
  const data = await getCoachLearningPathData();

  return <CoachLearningPathsPage data={data} />;
}
