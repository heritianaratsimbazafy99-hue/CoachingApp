import { notFound } from "next/navigation";
import { ContentEditorPage } from "@/components/coaching/library-pages";
import { getCoachContentEditorData } from "@/services/coach-service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const data = await getCoachContentEditorData(id);

  if (!data.content) {
    notFound();
  }

  return <ContentEditorPage data={data} />;
}
