import { QuizPage } from "@/components/coaching/coachee-learning-pages";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <QuizPage id={id} />;
}
