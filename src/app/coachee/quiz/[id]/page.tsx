import { notFound } from "next/navigation";
import { QuizPage } from "@/components/coaching/coachee-learning-pages";
import { getCoacheeQuizData } from "@/services/coachee-service";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assignment?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const data = await getCoacheeQuizData(id, firstParam(query.assignment));

  if (!data) {
    notFound();
  }

  return <QuizPage data={data} />;
}
