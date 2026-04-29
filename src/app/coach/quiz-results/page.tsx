import { QuizResultsPage } from "@/components/coaching/quiz-pages";
import { getCoachQuizResultsData } from "@/services/coach-service";

export default async function Page() {
  const data = await getCoachQuizResultsData();

  return <QuizResultsPage data={data} />;
}
