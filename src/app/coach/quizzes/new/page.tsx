import { QuizBuilderPage } from "@/components/coaching/quiz-pages";
import { getCoachQuizEditorData } from "@/services/coach-service";

export default async function Page() {
  const data = await getCoachQuizEditorData();

  return <QuizBuilderPage data={data} />;
}
