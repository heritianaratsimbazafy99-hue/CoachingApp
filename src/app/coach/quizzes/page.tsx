import { QuizzesPage } from "@/components/coaching/quiz-pages";
import { getCoachQuizzesData } from "@/services/coach-service";

export default async function Page() {
  const data = await getCoachQuizzesData();

  return <QuizzesPage data={data} />;
}
