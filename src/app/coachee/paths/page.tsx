import { CoacheeLearningPathsPage } from "@/components/coaching/learning-path-pages";
import { getCoacheeLearningPathData } from "@/services/learning-path-service";

export default async function Page() {
  const data = await getCoacheeLearningPathData();

  return <CoacheeLearningPathsPage data={data} />;
}
