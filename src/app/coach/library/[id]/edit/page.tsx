import { ContentEditorPage } from "@/components/coaching/library-pages";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <ContentEditorPage contentId={id} />;
}
