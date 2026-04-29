import { notFound } from "next/navigation";
import { QuizBuilderPage } from "@/components/coaching/quiz-pages";
import { getCoachQuizEditorData } from "@/services/coach-service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const data = await getCoachQuizEditorData(id);

  if (!data.quiz) {
    notFound();
  }

  return <QuizBuilderPage data={data} />;
}
