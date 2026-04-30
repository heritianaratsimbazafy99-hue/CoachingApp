import { notFound } from "next/navigation";
import { CoachLearningPathEditPage } from "@/components/coaching/learning-path-pages";
import { getCoachLearningPathEditorData } from "@/services/learning-path-service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const data = await getCoachLearningPathEditorData(id);

  if (!data) {
    notFound();
  }

  return <CoachLearningPathEditPage data={data} />;
}
